import express from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../database/postgres-db";
import { Task, CreateTaskRequest, UpdateTaskRequest } from "../types";

const router = express.Router();

// Get all tasks for a board
router.get("/board/:boardId", async (req, res) => {
  const { boardId } = req.params;

  try {
    const result = await query(
      "SELECT * FROM tasks WHERE board_id = $1 ORDER BY position ASC",
      [boardId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get a specific task
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// Create a new task
router.post("/", async (req, res) => {
  const {
    board_id,
    column_id,
    title,
    description,
    priority = "medium",
    assignee_id,
  }: CreateTaskRequest = req.body;

  if (!title || !board_id) {
    return res
      .status(400)
      .json({ error: "Task title and board ID are required" });
  }

  try {
    let finalColumnId = column_id;

    // If no column_id is provided, get the first column for this board
    if (!finalColumnId) {
      const columnResult = await query(
        "SELECT id FROM columns WHERE board_id = $1 ORDER BY position ASC LIMIT 1",
        [board_id]
      );

      if (columnResult.rows.length === 0) {
        return res.status(400).json({
          error:
            "No columns found for this board. Please create a column first.",
        });
      }

      finalColumnId = columnResult.rows[0].id;
    }

    const id = uuidv4();

    // Get the next position for this column
    const positionResult = await query(
      "SELECT MAX(position) as max_position FROM tasks WHERE column_id = $1",
      [finalColumnId]
    );

    const position = (positionResult.rows[0]?.max_position || 0) + 1;

    const result = await query(
      "INSERT INTO tasks (id, board_id, column_id, title, description, priority, assignee_id, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        id,
        board_id,
        finalColumnId,
        title,
        description,
        priority,
        assignee_id,
        position,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update a task
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    column_id,
    priority,
    assignee_id,
    position,
  }: UpdateTaskRequest = req.body;

  try {
    const result = await query(
      "UPDATE tasks SET title = COALESCE($2, title), description = COALESCE($3, description), column_id = COALESCE($4, column_id), priority = COALESCE($5, priority), assignee_id = COALESCE($6, assignee_id), position = COALESCE($7, position), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id, title, description, column_id, priority, assignee_id, position]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Update task positions (for drag and drop)
router.put("/reorder/positions", async (req, res) => {
  const { tasks } = req.body; // Array of { id, position, column_id }

  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: "Tasks array is required" });
  }

  try {
    // Use a transaction to update all task positions
    await query("BEGIN");

    for (const task of tasks) {
      await query(
        "UPDATE tasks SET position = $1, column_id = COALESCE($2, column_id), updated_at = CURRENT_TIMESTAMP WHERE id = $3",
        [task.position, task.column_id, task.id]
      );
    }

    await query("COMMIT");
    res.json({ message: "Task positions updated successfully" });
  } catch (error) {
    await query("ROLLBACK");
    console.error("Error updating task positions:", error);
    res.status(500).json({ error: "Failed to update task positions" });
  }
});

// Delete a task
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("DELETE FROM tasks WHERE id = $1 RETURNING id", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
