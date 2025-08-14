import express from "express";
import { projects } from "../database/s3-db";
import { CreateProjectRequest } from "../types";

const router = express.Router();

// Get all projects
router.get("/", async (req, res) => {
  try {
    const allProjects = await projects.findAll();
    // Sort by created_at descending (most recent first)
    const sortedProjects = allProjects.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    res.json(sortedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get a specific project
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const project = await projects.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
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

  try {
    const newProject = await projects.create({
      name,
      description: description || "",
      color,
    });

    res.status(201).json(newProject);
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
    const updatedProject = await projects.update(id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(color !== undefined && { color }),
    });

    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete a project
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await projects.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
