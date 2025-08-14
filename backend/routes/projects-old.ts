import express from "express";
import { v4 as uuidv4 } from "uuid";
import { projects } from "../database/s3-db";
import { CreateProjectRequest } from "../types";

const router = express.Router();

// Get all projects
router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get a specific project
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query("SELECT * FROM projects WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Create a new project
router.post("/", async (req, res) => {
  const {
    name,
    description,
    color = "#3B82F6",
  }: CreateProjectRequest = req.body;

  if (!name) {
    return res.status(400).json({ error: "Project name is required" });
  }

  const id = uuidv4();

  try {
    const result = await query(
      "INSERT INTO projects (id, name, description, color) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, name, description, color]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update a project
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;

  try {
    const result = await query(
      "UPDATE projects SET name = COALESCE($2, name), description = COALESCE($3, description), color = COALESCE($4, color), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id, name, description, color]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete a project
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      "DELETE FROM projects WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
