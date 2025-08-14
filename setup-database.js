const { Client } = require("pg");
require("dotenv").config();

// Simple schema setup script that will try different authentication methods
async function setupSchema() {
  console.log("🚀 Setting up database schema...");

  // Try different connection configurations
  const configs = [
    {
      name: "Local PostgreSQL",
      config: {
        host: "localhost",
        port: 5432,
        database: "kanban",
        user: "postgres",
        password: "password",
        ssl: false,
      },
    },
    {
      name: "AWS DSQL (no password)",
      config: {
        host: process.env.DSQL_ENDPOINT,
        port: parseInt(process.env.DSQL_PORT || "5432"),
        database: process.env.DSQL_DATABASE || "postgres",
        user: process.env.DSQL_USER || "admin",
        password: "",
        ssl: { rejectUnauthorized: false },
      },
    },
    {
      name: "AWS DSQL (with env password)",
      config: {
        host: process.env.DSQL_ENDPOINT,
        port: parseInt(process.env.DSQL_PORT || "5432"),
        database: process.env.DSQL_DATABASE || "postgres",
        user: process.env.DSQL_USER || "admin",
        password: process.env.DSQL_PASSWORD,
        ssl: { rejectUnauthorized: false },
      },
    },
  ];

  for (const { name, config } of configs) {
    console.log(`\n🔍 Trying ${name}...`);

    // Skip if required environment variables are missing
    if (name.includes("DSQL") && !process.env.DSQL_ENDPOINT) {
      console.log("   ⏭️  Skipping - missing DSQL configuration");
      continue;
    }

    const client = new Client(config);

    try {
      await client.connect();
      console.log(`   ✅ Connected to ${name}!`);

      await setupTables(client);
      console.log(`   ✅ Schema setup complete for ${name}!`);

      await client.end();
      console.log(`\n🎉 Successfully set up database with ${name}!`);
      return true;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      try {
        await client.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  console.log("\n❌ Could not connect to any database configuration");
  return false;
}

async function setupTables(client) {
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

  for (const table of tables) {
    try {
      console.log(`   📋 Creating table: ${table.name}`);
      await client.query(table.sql);
      console.log(`   ✅ Table ${table.name} created`);
    } catch (error) {
      console.log(`   ❌ Failed to create ${table.name}: ${error.message}`);
      throw error;
    }
  }

  // Create indexes
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id)",
    "CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_boards_project_id ON boards(project_id)",
    "CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id)",
  ];

  console.log(`   📊 Creating indexes...`);
  for (const indexSql of indexes) {
    await client.query(indexSql);
  }
  console.log(`   ✅ Indexes created`);
}

setupSchema()
  .then((success) => {
    if (success) {
      console.log(
        "\n🎉 Database setup complete! You can now start your application."
      );
    } else {
      console.log("\n💡 Next steps:");
      console.log("   1. Install PostgreSQL locally, OR");
      console.log("   2. Fix AWS DSQL authentication in .env file");
    }
  })
  .catch(console.error);
