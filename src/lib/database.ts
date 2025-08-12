import sqlite3 from "sqlite3";
import path from "path";

let database: sqlite3.Database | null = null;

export function getDatabase(): sqlite3.Database {
  if (!database) {
    initDatabase();
  }
  return database!;
}

export function initDatabase(): void {
  if (database) {
    return;
  }

  const dbPath =
    process.env.NODE_ENV === "production"
      ? "/tmp/kanban.db"
      : path.join(process.cwd(), "kanban.db");

  database = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      return;
    }
    console.log("Connected to SQLite database");
  });

  // Create tables
  if (database) {
    database.serialize(() => {
      // Projects table
      database!.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          color TEXT DEFAULT '#3B82F6',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Boards table
      database!.run(`
        CREATE TABLE IF NOT EXISTS boards (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
        )
      `);

      // Tasks table
      database!.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          board_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT CHECK(status IN ('todo', 'in-progress', 'in-review', 'done')) DEFAULT 'todo',
          priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
          assignee TEXT,
          position INTEGER DEFAULT 0,
          due_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE
        )
      `);

      console.log("Database tables created successfully");
    });
  }
}
