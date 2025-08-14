import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../database/postgres-db";
import { CreateColumnRequest } from "../types";

const router = Router();

// Get all columns for a board
router.get("/board/:boardId", async (req, res) => {
  const { boardId } = req.params;

  try {
    const result = await query(
      `SELECT * FROM columns WHERE board_id = $1 ORDER BY position ASC`,
      [boardId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching columns:", error);
    res.status(500).json({ error: "Failed to fetch columns" });
  }
});

// Create a new column
router.post("/", async (req, res) => {
  const { board_id, name, color = "#6B7280" }: CreateColumnRequest = req.body;

  if (!board_id || !name) {
    return res.status(400).json({ error: "Board ID and name are required" });
  }

  const columnId = uuidv4();

  try {
    // Get the next position
    const positionResult = await query(
      `SELECT MAX(position) as max_position FROM columns WHERE board_id = $1`,
      [board_id]
    );

    const position = (positionResult.rows[0]?.max_position || -1) + 1;

    const result = await query(
      `INSERT INTO columns (id, board_id, name, color, position) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [columnId, board_id, name, color, position]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating column:", error);
    res.status(500).json({ error: "Failed to create column" });
  }
});

// Update a column
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, color, position } = req.body;

  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(color);
    }
    if (position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      values.push(position);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const queryText = `UPDATE columns SET ${updates.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Column not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating column:", error);
    res.status(500).json({ error: "Failed to update column" });
  }
});

// Delete a column
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // First, check if the column has any tasks
    const taskCountResult = await query(
      `SELECT COUNT(*) as task_count FROM tasks WHERE column_id = $1`,
      [id]
    );

    if (parseInt(taskCountResult.rows[0].task_count) > 0) {
      return res.status(400).json({
        error:
          "Cannot delete column with tasks. Please move or delete all tasks first.",
      });
    }

    // Delete the column
    const result = await query(
      `DELETE FROM columns WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Column not found" });
    }

    res.json({ message: "Column deleted successfully" });
  } catch (error) {
    console.error("Error deleting column:", error);
    res.status(500).json({ error: "Failed to delete column" });
  }
});

export default router;
