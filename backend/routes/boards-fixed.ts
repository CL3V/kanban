import express from "express";
import { v4 as uuidv4 } from "uuid";
import { boards, columns, tasks } from "../database/s3-db";
import { Board, CreateBoardRequest } from "../types";

const router = express.Router();

// Get all boards for a project
router.get("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const allBoards = await boards.findAll();
    const projectBoards = allBoards.filter(
      (board) => board.project_id === projectId
    );
    res.json(projectBoards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});

// Get board by ID
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

// Create a new board
router.post("/", async (req, res) => {
  try {
    const { name, description, project_id }: CreateBoardRequest = req.body;

    if (!name || !project_id) {
      return res
        .status(400)
        .json({ error: "Name and project_id are required" });
    }

    const newBoard: Board = {
      id: uuidv4(),
      name,
      description,
      project_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const board = await boards.create(newBoard);
    res.status(201).json(board);
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ error: "Failed to create board" });
  }
});

// Update board
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const existingBoard = await boards.findById(id);
    if (!existingBoard) {
      return res.status(404).json({ error: "Board not found" });
    }

    const updatedBoard = {
      ...existingBoard,
      name: name !== undefined ? name : existingBoard.name,
      description:
        description !== undefined ? description : existingBoard.description,
      updated_at: new Date().toISOString(),
    };

    const board = await boards.update(id, updatedBoard);
    res.json(board);
  } catch (error) {
    console.error("Error updating board:", error);
    res.status(500).json({ error: "Failed to update board" });
  }
});

// Delete board
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const board = await boards.findById(id);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Delete all tasks in this board first
    const allTasks = await tasks.findAll();
    const boardTasks = allTasks.filter((task) => task.board_id === id);
    await Promise.all(boardTasks.map((task) => tasks.delete(task.id)));

    // Delete all columns in this board
    const allColumns = await columns.findAll();
    const boardColumns = allColumns.filter((column) => column.board_id === id);
    await Promise.all(boardColumns.map((column) => columns.delete(column.id)));

    // Delete the board
    await boards.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ error: "Failed to delete board" });
  }
});

// Get all tasks for a board
router.get("/:id/tasks", async (req, res) => {
  const { id } = req.params;

  try {
    const board = await boards.findById(id);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    const allTasks = await tasks.findAll();
    const boardTasks = allTasks.filter((task) => task.board_id === id);
    res.json(boardTasks);
  } catch (error) {
    console.error("Error fetching board tasks:", error);
    res.status(500).json({ error: "Failed to fetch board tasks" });
  }
});

export default router;
