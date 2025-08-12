import sqlite3 from "sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "backend", "database", "kanban.db");
const db = new sqlite3.Database(dbPath);

export const initDatabase = () => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create project_members table
  db.run(`
    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id)
    )
  `);

  // Create boards table
  db.run(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Create columns table
  db.run(`
    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6B7280',
      position INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )
  `);

  // Update tasks table to use column_id instead of status
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      column_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      assignee_id TEXT,
      position INTEGER NOT NULL,
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
      CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
    )
  `);

  // Migration: Add column_id to tasks table and create default columns
  db.run(`
    PRAGMA foreign_keys = OFF;
  `);

  // Check if migration is needed
  db.get(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'`,
    (err, row: any) => {
      if (err) {
        console.error("Error checking tasks table schema:", err);
        return;
      }

      if (row && row.sql.includes("status TEXT")) {
        console.log("Running column migration...");

        // Create new tasks table with column_id
        db.run(`
        CREATE TABLE IF NOT EXISTS tasks_new (
          id TEXT PRIMARY KEY,
          board_id TEXT NOT NULL,
          column_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT DEFAULT 'medium',
          assignee_id TEXT,
          position INTEGER NOT NULL,
          due_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
          FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
          FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
          CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
        )
      `);

        // Create default columns for all boards
        db.all(`SELECT id FROM boards`, (err, boards: any[]) => {
          if (err) {
            console.error("Error fetching boards for migration:", err);
            return;
          }

          const defaultColumns = [
            { name: "To Do", color: "#6B7280", position: 0 },
            { name: "In Progress", color: "#3B82F6", position: 1 },
            { name: "In Review", color: "#F59E0B", position: 2 },
            { name: "Done", color: "#10B981", position: 3 },
          ];

          boards.forEach((board) => {
            defaultColumns.forEach((col, index) => {
              const columnId = `${board.id}-${col.name
                .toLowerCase()
                .replace(/\s+/g, "-")}`;
              db.run(
                `
              INSERT OR IGNORE INTO columns (id, board_id, name, color, position)
              VALUES (?, ?, ?, ?, ?)
            `,
                [columnId, board.id, col.name, col.color, col.position]
              );
            });
          });

          // Migrate existing tasks
          db.run(`
          INSERT INTO tasks_new (id, board_id, column_id, title, description, priority, assignee_id, position, due_date, created_at, updated_at)
          SELECT 
            id, 
            board_id,
            CASE 
              WHEN status = 'todo' THEN board_id || '-to-do'
              WHEN status = 'in-progress' THEN board_id || '-in-progress'
              WHEN status = 'in-review' THEN board_id || '-in-review'
              WHEN status = 'done' THEN board_id || '-done'
              ELSE board_id || '-to-do'
            END as column_id,
            title, 
            description, 
            priority, 
            assignee_id, 
            position, 
            due_date, 
            created_at, 
            updated_at
          FROM tasks
        `);

          // Replace old table with new one
          db.run(`DROP TABLE tasks`);
          db.run(`ALTER TABLE tasks_new RENAME TO tasks`);

          console.log("Column migration completed successfully");
        });
      }
    }
  );

  db.run(`
    PRAGMA foreign_keys = ON;
  `);
};

export default db;
