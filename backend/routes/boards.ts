import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database/db";
import { Board, CreateBoardRequest } from "../types";

const router = express.Router();

// Get all boards for a project
router.get("/project/:projectId", (req, res) => {
  const { projectId } = req.params;

  db.all(
    "SELECT * FROM boards WHERE project_id = ? ORDER BY created_at DESC",
    [projectId],
    (err, rows) => {
      if (err) {
        console.error("Error fetching boards:", err);
        return res.status(500).json({ error: "Failed to fetch boards" });
      }
      res.json(rows);
    }
  );
});

// Get a specific board
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM boards WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Error fetching board:", err);
      return res.status(500).json({ error: "Failed to fetch board" });
    }
    if (!row) {
      return res.status(404).json({ error: "Board not found" });
    }
    res.json(row);
  });
});

// Create a new board
router.post("/", (req, res) => {
  const { project_id, name, description }: CreateBoardRequest = req.body;

  if (!name || !project_id) {
    return res
      .status(400)
      .json({ error: "Board name and project ID are required" });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    "INSERT INTO boards (id, project_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, project_id, name, description, now, now],
    function (err) {
      if (err) {
        console.error("Error creating board:", err);
        return res.status(500).json({ error: "Failed to create board" });
      }

      const board: Board = {
        id,
        project_id,
        name,
        description,
        created_at: now,
        updated_at: now,
      };

      res.status(201).json(board);
    }
  );
});

// Update a board
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const updated_at = new Date().toISOString();

  db.run(
    "UPDATE boards SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = ? WHERE id = ?",
    [name, description, updated_at, id],
    function (err) {
      if (err) {
        console.error("Error updating board:", err);
        return res.status(500).json({ error: "Failed to update board" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Board not found" });
      }

      // Fetch and return updated board
      db.get("SELECT * FROM boards WHERE id = ?", [id], (err, row) => {
        if (err) {
          console.error("Error fetching updated board:", err);
          return res
            .status(500)
            .json({ error: "Failed to fetch updated board" });
        }
        res.json(row);
      });
    }
  );
});

// Delete a board
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM boards WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Error deleting board:", err);
      return res.status(500).json({ error: "Failed to delete board" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Board not found" });
    }
    res.json({ message: "Board deleted successfully" });
  });
});

export default router;
