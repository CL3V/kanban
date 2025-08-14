import { query, initPostgresConnection } from "./postgres-db";

export const migrateFromSQLite = async () => {
  console.log("Starting PostgreSQL migration...");

  try {
    // Initialize connection
    await initPostgresConnection();

    // Insert some sample data for testing
    await insertSampleData();

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

const insertSampleData = async () => {
  try {
    // Create sample user
    const userId = "user-sample-id-1";
    await query(
      "INSERT INTO users (id, name, email, avatar) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
      [userId, "John Doe", "john@example.com", null]
    );

    // Create sample project
    const projectId = "project-sample-id-1";
    await query(
      "INSERT INTO projects (id, name, description, color) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
      [projectId, "Sample Project", "A sample project for testing", "#3B82F6"]
    );

    // Add user to project
    await query(
      "INSERT INTO project_members (id, project_id, user_id, role) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
      ["member-sample-id-1", projectId, userId, "admin"]
    );

    // Create sample board
    const boardId = "board-sample-id-1";
    await query(
      "INSERT INTO boards (id, project_id, name, description) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
      [boardId, projectId, "Sample Board", "A sample board for testing"]
    );

    // Create sample columns
    const columns = [
      { id: "col-1", name: "To Do", color: "#6B7280", position: 0 },
      { id: "col-2", name: "In Progress", color: "#3B82F6", position: 1 },
      { id: "col-3", name: "Done", color: "#10B981", position: 2 },
    ];

    for (const col of columns) {
      await query(
        "INSERT INTO columns (id, board_id, name, color, position) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING",
        [col.id, boardId, col.name, col.color, col.position]
      );
    }

    // Create sample tasks
    await query(
      "INSERT INTO tasks (id, board_id, column_id, title, description, priority, assignee_id, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING",
      [
        "task-1",
        boardId,
        "col-1",
        "Sample Task 1",
        "This is a sample task",
        "medium",
        userId,
        1,
      ]
    );

    await query(
      "INSERT INTO tasks (id, board_id, column_id, title, description, priority, assignee_id, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING",
      [
        "task-2",
        boardId,
        "col-2",
        "Sample Task 2",
        "This is another sample task",
        "high",
        userId,
        1,
      ]
    );

    console.log("Sample data inserted successfully");
  } catch (error) {
    console.error("Error inserting sample data:", error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateFromSQLite()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
