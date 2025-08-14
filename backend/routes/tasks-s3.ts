import express from "express";
import { tasks } from "../database/s3-db";

const router = express.Router();

// Get all tasks
router.get("/", async (req, res) => {
  try {
    const allTasks = await tasks.findAll();
    res.json(allTasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get a specific task
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const task = await tasks.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// Get tasks for a specific column
router.get("/column/:columnId", async (req, res) => {
  const { columnId } = req.params;

  try {
    const columnTasks = await tasks.findByColumnId(columnId);
    res.json(columnTasks);
  } catch (error) {
    console.error("Error fetching column tasks:", error);
    res.status(500).json({ error: "Failed to fetch column tasks" });
  }
});

// Create a new task
router.post("/", async (req, res) => {
  const {
    column_id,
    title,
    description,
    priority = "medium",
    assigned_to,
    due_date,
    position,
  } = req.body;

  if (!column_id || !title) {
    return res.status(400).json({
      error: "Column ID and title are required",
    });
  }

  try {
    // If no position provided, get the next available position
    let finalPosition = position;
    if (finalPosition === undefined || finalPosition === null) {
      const existingTasks = await tasks.findByColumnId(column_id);
      finalPosition =
        existingTasks.length > 0
          ? Math.max(...existingTasks.map((t) => t.position)) + 1
          : 0;
    }

    const newTask = await tasks.create({
      column_id,
      title,
      description: description || "",
      position: finalPosition,
      priority,
      assigned_to,
      due_date,
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update a task
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    column_id,
    title,
    description,
    priority,
    assigned_to,
    due_date,
    position,
  } = req.body;

  try {
    const updatedTask = await tasks.update(id, {
      ...(column_id !== undefined && { column_id }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(priority !== undefined && { priority }),
      ...(assigned_to !== undefined && { assigned_to }),
      ...(due_date !== undefined && { due_date }),
      ...(position !== undefined && { position }),
    });

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete a task
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await tasks.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
