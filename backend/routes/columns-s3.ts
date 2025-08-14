import express from "express";
import { columns } from "../database/s3-db";

const router = express.Router();

// Get all columns
router.get("/", async (req, res) => {
  try {
    const allColumns = await columns.findAll();
    res.json(allColumns);
  } catch (error) {
    console.error("Error fetching columns:", error);
    res.status(500).json({ error: "Failed to fetch columns" });
  }
});

// Get columns for a specific board
router.get("/board/:boardId", async (req, res) => {
  const { boardId } = req.params;

  try {
    const boardColumns = await columns.findByBoardId(boardId);
    res.json(boardColumns);
  } catch (error) {
    console.error("Error fetching board columns:", error);
    res.status(500).json({ error: "Failed to fetch board columns" });
  }
});

// Get a specific column
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const column = await columns.findById(id);
    if (!column) {
      return res.status(404).json({ error: "Column not found" });
    }
    res.json(column);
  } catch (error) {
    console.error("Error fetching column:", error);
    res.status(500).json({ error: "Failed to fetch column" });
  }
});

// Create a new column
router.post("/", async (req, res) => {
  const { board_id, name, position } = req.body;

  if (!board_id || !name) {
    return res.status(400).json({
      error: "Board ID and name are required",
    });
  }

  try {
    // If no position provided, get the next available position
    let finalPosition = position;
    if (finalPosition === undefined || finalPosition === null) {
      const existingColumns = await columns.findByBoardId(board_id);
      finalPosition =
        existingColumns.length > 0
          ? Math.max(...existingColumns.map((c) => c.position)) + 1
          : 0;
    }

    const newColumn = await columns.create({
      board_id,
      name,
      position: finalPosition,
    });

    res.status(201).json(newColumn);
  } catch (error) {
    console.error("Error creating column:", error);
    res.status(500).json({ error: "Failed to create column" });
  }
});

// Update a column
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, position } = req.body;

  try {
    const updatedColumn = await columns.update(id, {
      ...(name !== undefined && { name }),
      ...(position !== undefined && { position }),
    });

    if (!updatedColumn) {
      return res.status(404).json({ error: "Column not found" });
    }

    res.json(updatedColumn);
  } catch (error) {
    console.error("Error updating column:", error);
    res.status(500).json({ error: "Failed to update column" });
  }
});

// Delete a column
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await columns.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Column not found" });
    }

    res.json({ message: "Column deleted successfully" });
  } catch (error) {
    console.error("Error deleting column:", error);
    res.status(500).json({ error: "Failed to delete column" });
  }
});

export default router;
