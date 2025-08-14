const { Client } = require("pg");
const { Signer } = require("@aws-sdk/rds-signer");
require("dotenv").config();

async function createDSQLClient() {
  const signer = new Signer({
    region: process.env.AWS_REGION || "ap-northeast-1",
    hostname: process.env.DSQL_ENDPOINT,
    port: parseInt(process.env.DSQL_PORT || "5432"),
    username: process.env.DSQL_USER || "admin",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const token = await signer.getAuthToken();

  return new Client({
    host: process.env.DSQL_ENDPOINT,
    port: parseInt(process.env.DSQL_PORT || "5432"),
    database: process.env.DSQL_DATABASE || "postgres",
    user: process.env.DSQL_USER || "admin",
    password: token,
    ssl: { rejectUnauthorized: false },
  });
}

async function setupDSQLSchema() {
  console.log("🚀 Setting up AWS DSQL schema...");

  try {
    const client = await createDSQLClient();
    await client.connect();
    console.log("✅ Connected to AWS DSQL");

    // Create tables
    const tables = [
      {
        name: "users",
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            avatar TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `,
      },
      {
        name: "projects",
        sql: `
          CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            color TEXT DEFAULT '#3B82F6',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `,
      },
      {
        name: "project_members",
        sql: `
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
        `,
      },
      {
        name: "boards",
        sql: `
          CREATE TABLE IF NOT EXISTS boards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
          )
        `,
      },
      {
        name: "columns",
        sql: `
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
        `,
      },
      {
        name: "tasks",
        sql: `
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
        `,
      },
    ];

    // Create each table
    for (const table of tables) {
      console.log(`📋 Creating table: ${table.name}`);
      await client.query(table.sql);
      console.log(`✅ Table ${table.name} created`);
    }

    // Create indexes
    console.log("📊 Creating indexes...");
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id)",
      "CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_boards_project_id ON boards(project_id)",
      "CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id)",
      "CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id)",
      "CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id)",
      "CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id)",
    ];

    for (const indexSql of indexes) {
      await client.query(indexSql);
    }
    console.log("✅ Indexes created");

    // Test with sample data
    console.log("🧪 Testing with sample data...");
    const testResult = await client.query(`
      INSERT INTO users (name, email) 
      VALUES ('Test User', 'test@kanban.com') 
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email
    `);

    if (testResult.rows.length > 0) {
      console.log("✅ Sample user created:", testResult.rows[0]);
    } else {
      console.log("ℹ️ Sample user already exists");
    }

    await client.end();
    console.log("\n🎉 AWS DSQL schema setup complete!");
    console.log("🚀 You can now start your application with: npm run dev:full");
  } catch (error) {
    console.error("❌ Schema setup failed:", error);
  }
}

setupDSQLSchema();
