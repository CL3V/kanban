import express from "express";
import { v4 as uuidv4 } from "uuid";
import { tasks } from "../database/s3-db";
import { Task } from "../types";

const router = express.Router();

// Get all tasks for a board
router.get("/board/:boardId", async (req, res) => {
  const { boardId } = req.params;

  try {
    const allTasks = await tasks.findAll();
    const boardTasks = allTasks
      .filter((task) => task.board_id === boardId)
      .sort((a, b) => a.position - b.position);

    res.json(boardTasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get all tasks for a column
router.get("/column/:columnId", async (req, res) => {
  const { columnId } = req.params;

  try {
    const allTasks = await tasks.findAll();
    const columnTasks = allTasks
      .filter((task) => task.column_id === columnId)
      .sort((a, b) => a.position - b.position);

    res.json(columnTasks);
  } catch (error) {
    console.error("Error fetching column tasks:", error);
    res.status(500).json({ error: "Failed to fetch column tasks" });
  }
});

// Get task by ID
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

// Create a new task
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      board_id,
      column_id,
      priority = "medium",
      assignee_id,
      position,
    } = req.body;

    if (!title || !board_id || !column_id) {
      return res
        .status(400)
        .json({ error: "Title, board_id, and column_id are required" });
    }

    // If position not provided, set it to the end of the column
    let taskPosition = position;
    if (taskPosition === undefined || taskPosition === null) {
      const allTasks = await tasks.findAll();
      const columnTasks = allTasks.filter((t) => t.column_id === column_id);
      taskPosition = columnTasks.length;
    }

    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      board_id,
      column_id,
      priority,
      assignee_id,
      position: taskPosition,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const task = await tasks.create(newTask);
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Update task
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, assignee_id, position, column_id } =
    req.body;

  try {
    const existingTask = await tasks.findById(id);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updatedTask = {
      ...existingTask,
      title: title !== undefined ? title : existingTask.title,
      description:
        description !== undefined ? description : existingTask.description,
      priority: priority !== undefined ? priority : existingTask.priority,
      assignee_id:
        assignee_id !== undefined ? assignee_id : existingTask.assignee_id,
      position: position !== undefined ? position : existingTask.position,
      column_id: column_id !== undefined ? column_id : existingTask.column_id,
      updated_at: new Date().toISOString(),
    };

    const task = await tasks.update(id, updatedTask);
    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete task
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const task = await tasks.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await tasks.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Move task to different column/position
router.patch("/:id/move", async (req, res) => {
  const { id } = req.params;
  const { column_id, position } = req.body;

  try {
    if (column_id === undefined || position === undefined) {
      return res
        .status(400)
        .json({ error: "column_id and position are required" });
    }

    const existingTask = await tasks.findById(id);
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updatedTask = {
      ...existingTask,
      column_id,
      position,
      updated_at: new Date().toISOString(),
    };

    const task = await tasks.update(id, updatedTask);
    res.json(task);
  } catch (error) {
    console.error("Error moving task:", error);
    res.status(500).json({ error: "Failed to move task" });
  }
});

// Reorder tasks in a column
router.patch("/column/:columnId/reorder", async (req, res) => {
  const { columnId } = req.params;
  const { taskIds } = req.body;

  try {
    if (!Array.isArray(taskIds)) {
      return res.status(400).json({ error: "taskIds must be an array" });
    }

    // Update positions for all tasks in the column
    const updatePromises = taskIds.map(async (taskId, index) => {
      const task = await tasks.findById(taskId);
      if (task && task.column_id === columnId) {
        const updatedTask = {
          ...task,
          position: index,
          updated_at: new Date().toISOString(),
        };
        return tasks.update(taskId, updatedTask);
      }
    });

    await Promise.all(updatePromises);
    res.json({ success: true });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    res.status(500).json({ error: "Failed to reorder tasks" });
  }
});

export default router;
