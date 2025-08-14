import express from "express";
import { boards, columns, tasks } from "../database/s3-db";

const router = express.Router();

// Get all boards
router.get("/", async (req, res) => {
  try {
    const allBoards = await boards.findAll();
    res.json(allBoards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});

// Get a specific board
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const board = await boards.findById(id);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    res.json(board);
  } catch (error) {
    console.error("Error fetching board:", error);
    res.status(500).json({ error: "Failed to fetch board" });
  }
});

// Get boards for a specific project
router.get("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const projectBoards = await boards.findByProjectId(projectId);
    res.json(projectBoards);
  } catch (error) {
    console.error("Error fetching project boards:", error);
    res.status(500).json({ error: "Failed to fetch project boards" });
  }
});

// Create a new board
router.post("/", async (req, res) => {
  const { project_id, name, description } = req.body;

  if (!project_id || !name) {
    return res.status(400).json({
      error: "Project ID and name are required",
    });
  }

  try {
    const newBoard = await boards.create({
      project_id,
      name,
      description: description || "",
    });

    res.status(201).json(newBoard);
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
    const updatedBoard = await boards.update(id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    });

    if (!updatedBoard) {
      return res.status(404).json({ error: "Board not found" });
    }

    res.json(updatedBoard);
  } catch (error) {
    console.error("Error updating board:", error);
    res.status(500).json({ error: "Failed to update board" });
  }
});

// Delete a board
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await boards.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Board not found" });
    }

    res.json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ error: "Failed to delete board" });
  }
});

// Get all tasks for a board (with column information)
router.get("/:id/tasks", async (req, res) => {
  const { id } = req.params;

  try {
    // First verify board exists
    const board = await boards.findById(id);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Get all tasks for this board
    const boardTasks = await tasks.findByBoardId(id);

    res.json(boardTasks);
  } catch (error) {
    console.error("Error fetching board tasks:", error);
    res.status(500).json({ error: "Failed to fetch board tasks" });
  }
});

export default router;
