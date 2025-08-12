import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database/db";
import { CreateColumnRequest } from "../types";

const router = Router();

// Get all columns for a board
router.get("/board/:boardId", (req, res) => {
  const { boardId } = req.params;

  db.all(
    `SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC`,
    [boardId],
    (err, rows) => {
      if (err) {
        console.error("Error fetching columns:", err);
        return res.status(500).json({ error: "Failed to fetch columns" });
      }
      res.json(rows);
    }
  );
});

// Create a new column
router.post("/", (req, res) => {
  const { board_id, name, color = "#6B7280" }: CreateColumnRequest = req.body;

  if (!board_id || !name) {
    return res.status(400).json({ error: "Board ID and name are required" });
  }

  const columnId = uuidv4();

  // Get the next position
  db.get(
    `SELECT MAX(position) as max_position FROM columns WHERE board_id = ?`,
    [board_id],
    (err, row: any) => {
      if (err) {
        console.error("Error getting max position:", err);
        return res.status(500).json({ error: "Failed to create column" });
      }

      const position = (row?.max_position || -1) + 1;

      db.run(
        `INSERT INTO columns (id, board_id, name, color, position) VALUES (?, ?, ?, ?, ?)`,
        [columnId, board_id, name, color, position],
        function (err) {
          if (err) {
            console.error("Error creating column:", err);
            return res.status(500).json({ error: "Failed to create column" });
          }

          // Return the created column
          db.get(
            `SELECT * FROM columns WHERE id = ?`,
            [columnId],
            (err, column) => {
              if (err) {
                console.error("Error fetching created column:", err);
                return res
                  .status(500)
                  .json({ error: "Failed to fetch created column" });
              }
              res.status(201).json(column);
            }
          );
        }
      );
    }
  );
});

// Update a column
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, color, position } = req.body;

  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push("name = ?");
    values.push(name);
  }
  if (color !== undefined) {
    updates.push("color = ?");
    values.push(color);
  }
  if (position !== undefined) {
    updates.push("position = ?");
    values.push(position);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const query = `UPDATE columns SET ${updates.join(", ")} WHERE id = ?`;

  db.run(query, values, function (err) {
    if (err) {
      console.error("Error updating column:", err);
      return res.status(500).json({ error: "Failed to update column" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Column not found" });
    }

    // Return the updated column
    db.get(`SELECT * FROM columns WHERE id = ?`, [id], (err, column) => {
      if (err) {
        console.error("Error fetching updated column:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch updated column" });
      }
      res.json(column);
    });
  });
});

// Delete a column
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  // First, check if the column has any tasks
  db.get(
    `SELECT COUNT(*) as task_count FROM tasks WHERE column_id = ?`,
    [id],
    (err, row: any) => {
      if (err) {
        console.error("Error checking tasks in column:", err);
        return res.status(500).json({ error: "Failed to delete column" });
      }

      if (row.task_count > 0) {
        return res.status(400).json({
          error:
            "Cannot delete column with tasks. Please move or delete all tasks first.",
        });
      }

      // Delete the column
      db.run(`DELETE FROM columns WHERE id = ?`, [id], function (err) {
        if (err) {
          console.error("Error deleting column:", err);
          return res.status(500).json({ error: "Failed to delete column" });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: "Column not found" });
        }

        res.json({ message: "Column deleted successfully" });
      });
    }
  );
});

export default router;
