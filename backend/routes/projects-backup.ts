import express from "express";
import { v4 as uuidv4 } from "uuid";
import { projects, boards } from "../database/s3-db";
import { Project, CreateProjectRequest } from "../types";

const router = express.Router();

// Get all projects
router.get("/", async (req, res) => {
  try {
    const allProjects = await projects.findAll();
    res.json(allProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get project by ID
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

// Get boards for a project
router.get("/:id/boards", async (req, res) => {
  const { id } = req.params;

  try {
    const project = await projects.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const allBoards = await boards.findAll();
    const projectBoards = allBoards.filter((board) => board.project_id === id);
    res.json(projectBoards);
  } catch (error) {
    console.error("Error fetching project boards:", error);
    res.status(500).json({ error: "Failed to fetch project boards" });
  }
});

// Create a new project
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      color = "#3B82F6",
    }: CreateProjectRequest = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const newProject: Project = {
      id: uuidv4(),
      name,
      description,
      color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const project = await projects.create(newProject);
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update project
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;

  try {
    const existingProject = await projects.findById(id);
    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    const updatedProject = {
      ...existingProject,
      name: name !== undefined ? name : existingProject.name,
      description:
        description !== undefined ? description : existingProject.description,
      color: color !== undefined ? color : existingProject.color,
      updated_at: new Date().toISOString(),
    };

    const project = await projects.update(id, updatedProject);
    res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const project = await projects.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Delete all boards and their related data for this project
    const allBoards = await boards.findAll();
    const projectBoards = allBoards.filter((board) => board.project_id === id);

    // Note: In a full implementation, we'd also delete columns and tasks
    // For now, just delete the boards
    await Promise.all(projectBoards.map((board) => boards.delete(board.id)));

    // Delete the project
    await projects.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
