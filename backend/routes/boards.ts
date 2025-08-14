import express from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../database/postgres-db";
import { Board, CreateBoardRequest } from "../types";

const router = express.Router();

// Get all boards for a project
router.get("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await query(
      "SELECT * FROM boards WHERE project_id = $1 ORDER BY created_at DESC",
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});

// Get a specific board
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("SELECT * FROM boards WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Board not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching board:", error);
    res.status(500).json({ error: "Failed to fetch board" });
  }
});

// Create a new board
router.post("/", async (req, res) => {
  const { project_id, name, description }: CreateBoardRequest = req.body;

  if (!name || !project_id) {
    return res
      .status(400)
      .json({ error: "Board name and project ID are required" });
  }

  const id = uuidv4();

  try {
    const result = await query(
      "INSERT INTO boards (id, project_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, project_id, name, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ error: "Failed to create board" });
  }
});

// Update a board
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const result = await query(
      "UPDATE boards SET name = COALESCE($2, name), description = COALESCE($3, description), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id, name, description]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Board not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating board:", error);
    res.status(500).json({ error: "Failed to update board" });
  }
});

// Delete a board
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      "DELETE FROM boards WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Board not found" });
    }

    res.json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ error: "Failed to delete board" });
  }
});

export default router;
