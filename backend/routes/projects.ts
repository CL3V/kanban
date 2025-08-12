import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database/db";
import { Project, CreateProjectRequest } from "../types";

const router = express.Router();

// Get all projects
router.get("/", (req, res) => {
  db.all("SELECT * FROM projects ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      console.error("Error fetching projects:", err);
      return res.status(500).json({ error: "Failed to fetch projects" });
    }
    res.json(rows);
  });
});

// Get a specific project
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Error fetching project:", err);
      return res.status(500).json({ error: "Failed to fetch project" });
    }
    if (!row) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(row);
  });
});

// Create a new project
router.post("/", (req, res) => {
  const {
    name,
    description,
    color = "#3B82F6",
  }: CreateProjectRequest = req.body;

  if (!name) {
    return res.status(400).json({ error: "Project name is required" });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    "INSERT INTO projects (id, name, description, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, name, description, color, now, now],
    function (err) {
      if (err) {
        console.error("Error creating project:", err);
        return res.status(500).json({ error: "Failed to create project" });
      }

      const project: Project = {
        id,
        name,
        description,
        color,
        created_at: now,
        updated_at: now,
      };

      res.status(201).json(project);
    }
  );
});

// Update a project
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;
  const updated_at = new Date().toISOString();

  db.run(
    "UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), color = COALESCE(?, color), updated_at = ? WHERE id = ?",
    [name, description, color, updated_at, id],
    function (err) {
      if (err) {
        console.error("Error updating project:", err);
        return res.status(500).json({ error: "Failed to update project" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Fetch and return updated project
      db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
        if (err) {
          console.error("Error fetching updated project:", err);
          return res
            .status(500)
            .json({ error: "Failed to fetch updated project" });
        }
        res.json(row);
      });
    }
  );
});

// Delete a project
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM projects WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Error deleting project:", err);
      return res.status(500).json({ error: "Failed to delete project" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({ message: "Project deleted successfully" });
  });
});

export default router;
