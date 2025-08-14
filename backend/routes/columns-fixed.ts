import express from "express";
import { v4 as uuidv4 } from "uuid";
import { columns, tasks } from "../database/s3-db";
import { Column } from "../types";

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
    const allColumns = await columns.findAll();
    const boardColumns = allColumns
      .filter((column) => column.board_id === boardId)
      .sort((a, b) => a.position - b.position);

    res.json(boardColumns);
  } catch (error) {
    console.error("Error fetching board columns:", error);
    res.status(500).json({ error: "Failed to fetch board columns" });
  }
});

// Get column by ID
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
  try {
    const { name, board_id, position, color } = req.body;

    if (!name || !board_id) {
      return res.status(400).json({ error: "Name and board_id are required" });
    }

    // If position not provided, set it to the end
    let columnPosition = position;
    if (columnPosition === undefined || columnPosition === null) {
      const allColumns = await columns.findAll();
      const boardColumns = allColumns.filter(
        (col) => col.board_id === board_id
      );
      columnPosition = boardColumns.length;
    }

    const newColumn: Column = {
      id: uuidv4(),
      name,
      board_id,
      position: columnPosition,
      color: color || "#6B7280", // Default gray color
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const column = await columns.create(newColumn);
    res.status(201).json(column);
  } catch (error) {
    console.error("Error creating column:", error);
    res.status(500).json({ error: "Failed to create column" });
  }
});

// Update column
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, position, color } = req.body;

  try {
    const existingColumn = await columns.findById(id);
    if (!existingColumn) {
      return res.status(404).json({ error: "Column not found" });
    }

    const updatedColumn = {
      ...existingColumn,
      name: name !== undefined ? name : existingColumn.name,
      position: position !== undefined ? position : existingColumn.position,
      color: color !== undefined ? color : existingColumn.color,
      updated_at: new Date().toISOString(),
    };

    const column = await columns.update(id, updatedColumn);
    res.json(column);
  } catch (error) {
    console.error("Error updating column:", error);
    res.status(500).json({ error: "Failed to update column" });
  }
});

// Delete column
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const column = await columns.findById(id);
    if (!column) {
      return res.status(404).json({ error: "Column not found" });
    }

    // Delete all tasks in this column first
    const allTasks = await tasks.findAll();
    const columnTasks = allTasks.filter((task) => task.column_id === id);
    await Promise.all(columnTasks.map((task) => tasks.delete(task.id)));

    // Delete the column
    await columns.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting column:", error);
    res.status(500).json({ error: "Failed to delete column" });
  }
});

// Reorder columns
router.patch("/reorder", async (req, res) => {
  try {
    const { columnIds } = req.body;

    if (!Array.isArray(columnIds)) {
      return res.status(400).json({ error: "columnIds must be an array" });
    }

    // Update positions for all columns
    const updatePromises = columnIds.map(async (columnId, index) => {
      const column = await columns.findById(columnId);
      if (column) {
        const updatedColumn = {
          ...column,
          position: index,
          updated_at: new Date().toISOString(),
        };
        return columns.update(columnId, updatedColumn);
      }
    });

    await Promise.all(updatePromises);
    res.json({ success: true });
  } catch (error) {
    console.error("Error reordering columns:", error);
    res.status(500).json({ error: "Failed to reorder columns" });
  }
});

export default router;
