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

  // If no column_id is provided, get the first column for this board
  if (!column_id) {
    db.get(
      "SELECT id FROM columns WHERE board_id = ? ORDER BY position ASC LIMIT 1",
      [board_id],
      (err, column: any) => {
        if (err) {
          console.error("Error getting default column:", err);
          return res.status(500).json({ error: "Failed to create task" });
        }

        if (!column) {
          return res
            .status(400)
            .json({
              error:
                "No columns found for this board. Please create a column first.",
            });
        }

        createTaskWithColumn(column.id);
      }
    );
  } else {
    createTaskWithColumn(column_id);
  }

  function createTaskWithColumn(columnId: string) {
    const id = uuidv4();
    const now = new Date().toISOString();

    // Get the next position for this column
    db.get(
      "SELECT MAX(position) as max_position FROM tasks WHERE column_id = ?",
      [columnId],
      (err, row: any) => {
        if (err) {
          console.error("Error getting max position:", err);
          return res.status(500).json({ error: "Failed to create task" });
        }

        const position = (row?.max_position || 0) + 1;

        db.run(
          "INSERT INTO tasks (id, board_id, column_id, title, description, priority, assignee_id, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            id,
            board_id,
            columnId,
            title,
            description,
            priority,
            assignee_id,
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
              column_id: columnId,
              title,
              description,
              priority: priority as Task["priority"],
              assignee_id,
              position,
              created_at: now,
              updated_at: now,
            };

            res.status(201).json(task);
          }
        );
      }
    );
  }
});

// Update a task
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    column_id,
    priority,
    assignee_id,
    position,
  }: UpdateTaskRequest = req.body;
  const updated_at = new Date().toISOString();

  db.run(
    "UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description), column_id = COALESCE(?, column_id), priority = COALESCE(?, priority), assignee_id = COALESCE(?, assignee_id), position = COALESCE(?, position), updated_at = ? WHERE id = ?",
    [
      title,
      description,
      column_id,
      priority,
      assignee_id,
      position,
      updated_at,
      id,
    ],
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
  const { tasks } = req.body; // Array of { id, position, column_id }

  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: "Tasks array is required" });
  }

  const updated_at = new Date().toISOString();

  // Use a transaction to update all task positions
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    let completed = 0;
    let hasError = false;

    tasks.forEach((task) => {
      db.run(
        "UPDATE tasks SET position = ?, column_id = COALESCE(?, column_id), updated_at = ? WHERE id = ?",
        [task.position, task.column_id, updated_at, task.id],
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
                  .json({ error: "Failed to update task positions" });
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
