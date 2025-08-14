import { Client } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import dotenv from "dotenv";

dotenv.config();

// Generate AWS DSQL authentication token
const generateDSQLToken = async (): Promise<string> => {
  const signer = new Signer({
    region: process.env.AWS_REGION || "ap-northeast-1",
    hostname: process.env.DSQL_ENDPOINT!,
    port: parseInt(process.env.DSQL_PORT || "5432"),
    username: process.env.DSQL_USER || "admin",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  return await signer.getAuthToken();
};

// PostgreSQL connection configuration
const getDbConfig = async () => {
  // If DATABASE_URL is provided, use it (common for local development)
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  // For AWS DSQL, we need to handle IAM authentication
  if (process.env.DSQL_ENDPOINT && process.env.AWS_ACCESS_KEY_ID) {
    const token = await generateDSQLToken();

    const config = {
      host: process.env.DSQL_ENDPOINT,
      port: parseInt(process.env.DSQL_PORT || "5432"),
      database: process.env.DSQL_DATABASE || "postgres",
      user: process.env.DSQL_USER || "admin",
      password: token, // Use generated IAM token
      ssl: { rejectUnauthorized: false }, // AWS DSQL requires SSL
    };

    return config;
  }

  // Fallback to local PostgreSQL
  return {
    host: "localhost",
    port: 5432,
    database: "kanban",
    user: "postgres",
    password: "password",
    ssl: false,
  };
};

let db: Client | null = null;

// Initialize PostgreSQL connection
export const initPostgresConnection = async () => {
  try {
    const dbConfig = await getDbConfig();
    db = new Client(dbConfig);
    await db.connect();
    console.log("Connected to PostgreSQL database");
    return db;
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
    throw error;
  }
};

export const initDatabase = async () => {
  try {
    if (!db) {
      await initPostgresConnection();
    }

    if (!db) {
      throw new Error("Failed to initialize database connection");
    }

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create projects table
    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create project_members table
    await db.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        user_id UUID NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(project_id, user_id)
      )
    `);

    // Create boards table
    await db.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Create columns table
    await db.query(`
      CREATE TABLE IF NOT EXISTS columns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        board_id UUID NOT NULL,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#6B7280',
        position INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      )
    `);

    // Create tasks table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        board_id UUID NOT NULL,
        column_id UUID NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        assignee_id UUID,
        position INTEGER NOT NULL,
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
        CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
      )
    `);

    // Create indexes for better performance
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id)`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id)`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_boards_project_id ON boards(project_id)`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id)`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id)`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id)`
    );
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id)`
    );

    console.log("Database tables created successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

// Database query wrapper
export const query = async (text: string, params?: any[]) => {
  try {
    if (!db) {
      await initPostgresConnection();
    }

    if (!db) {
      throw new Error("Failed to establish database connection");
    }

    const result = await db.query(text, params);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

// Get database client
export const getClient = () => {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initPostgresConnection() first."
    );
  }
  return db;
};

export default { query, initDatabase, initPostgresConnection, getClient };
