import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database/db";
import { Task, CreateTaskRequest, UpdateTaskRequest } from "../types";

const router = express.Router();

// Get all tasks for a board
router.get("/board/:boardId", (req, res) => {
  const { boardId } = req.params;

  db.all(
    "SELECT * FROM tasks WHERE board_id = ? ORDER BY position ASC",
    [boardId],
    (err, rows) => {
      if (err) {
        console.error("Error fetching tasks:", err);
        return res.status(500).json({ error: "Failed to fetch tasks" });
      }
      res.json(rows);
    }
  );
});

// Get a specific task
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Error fetching task:", err);
      return res.status(500).json({ error: "Failed to fetch task" });
    }
    if (!row) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(row);
  });
});

// Create a new task
router.post("/", (req, res) => {
  const {
    board_id,
    title,
    description,
    status = "todo",
    priority = "medium",
    assignee,
  }: CreateTaskRequest = req.body;

  if (!title || !board_id) {
    return res
      .status(400)
      .json({ error: "Task title and board ID are required" });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  // Get the next position for this board
  db.get(
    "SELECT MAX(position) as max_position FROM tasks WHERE board_id = ?",
    [board_id],
    (err, row: any) => {
      if (err) {
        console.error("Error getting max position:", err);
        return res.status(500).json({ error: "Failed to create task" });
      }

      const position = (row?.max_position || 0) + 1;

      db.run(
        "INSERT INTO tasks (id, board_id, title, description, status, priority, assignee, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          board_id,
          title,
          description,
          status,
          priority,
          assignee,
          position,
          now,
          now,
        ],
        function (err) {
          if (err) {
            console.error("Error creating task:", err);
            return res.status(500).json({ error: "Failed to create task" });
          }

          const task: Task = {
            id,
            board_id,
            title,
            description,
            status: status as Task["status"],
            priority: priority as Task["priority"],
            assignee,
            position,
            created_at: now,
            updated_at: now,
          };

          res.status(201).json(task);
        }
      );
    }
  );
});

// Update a task
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    status,
    priority,
    assignee,
    position,
  }: UpdateTaskRequest = req.body;
  const updated_at = new Date().toISOString();

  db.run(
    "UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description), status = COALESCE(?, status), priority = COALESCE(?, priority), assignee = COALESCE(?, assignee), position = COALESCE(?, position), updated_at = ? WHERE id = ?",
    [title, description, status, priority, assignee, position, updated_at, id],
    function (err) {
      if (err) {
        console.error("Error updating task:", err);
        return res.status(500).json({ error: "Failed to update task" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Fetch and return updated task
      db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, row) => {
        if (err) {
          console.error("Error fetching updated task:", err);
          return res
            .status(500)
            .json({ error: "Failed to fetch updated task" });
        }
        res.json(row);
      });
    }
  );
});

// Update task positions (for drag and drop)
router.put("/reorder/positions", (req, res) => {
  const { tasks } = req.body; // Array of { id, position, status }

  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: "Tasks array is required" });
  }

  const updated_at = new Date().toISOString();

  // Use a transaction to update all task positions
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    let completed = 0;
    let hasError = false;

    tasks.forEach((task, index) => {
      db.run(
        "UPDATE tasks SET position = ?, status = COALESCE(?, status), updated_at = ? WHERE id = ?",
        [task.position, task.status, updated_at, task.id],
        function (err) {
          if (err && !hasError) {
            hasError = true;
            console.error("Error updating task position:", err);
            db.run("ROLLBACK");
            return res
              .status(500)
              .json({ error: "Failed to update task positions" });
          }

          completed++;
          if (completed === tasks.length && !hasError) {
            db.run("COMMIT", (err) => {
              if (err) {
                console.error("Error committing transaction:", err);
                return res
                  .status(500)
                  .json({ error: "Failed to commit changes" });
              }
              res.json({ message: "Task positions updated successfully" });
            });
          }
        }
      );
    });

    if (tasks.length === 0) {
      db.run("COMMIT");
      res.json({ message: "No tasks to update" });
    }
  });
});

// Delete a task
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Error deleting task:", err);
      return res.status(500).json({ error: "Failed to delete task" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  });
});

export default router;
