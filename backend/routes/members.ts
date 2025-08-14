import express from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../database/postgres-db";
import { ProjectMember, User } from "../types";

const router = express.Router();

// Get all members of a project
router.get("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await query(
      `SELECT 
        pm.id, pm.project_id, pm.user_id, pm.role, 
        pm.created_at, pm.updated_at,
        u.name, u.email, u.avatar,
        u.created_at as user_created_at, u.updated_at as user_updated_at
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY u.name ASC`,
      [projectId]
    );

    const members = result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      user_id: row.user_id,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
      },
    }));

    res.json(members);
  } catch (error) {
    console.error("Error fetching project members:", error);
    res.status(500).json({ error: "Failed to fetch project members" });
  }
});

// Add a member to a project
router.post("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;
  const { user_id, role = "member" } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Check if user exists
    const userResult = await query("SELECT id FROM users WHERE id = $1", [
      user_id,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if project exists
    const projectResult = await query("SELECT id FROM projects WHERE id = $1", [
      projectId,
    ]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user is already a member
    const existingResult = await query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
      [projectId, user_id]
    );

    if (existingResult.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "User is already a member of this project" });
    }

    // Add user to project
    const id = uuidv4();
    const result = await query(
      "INSERT INTO project_members (id, project_id, user_id, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, projectId, user_id, role]
    );

    // Return the created membership with user info
    const memberResult = await query(
      `SELECT 
        pm.id, pm.project_id, pm.user_id, pm.role, 
        pm.created_at, pm.updated_at,
        u.name, u.email, u.avatar,
        u.created_at as user_created_at, u.updated_at as user_updated_at
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.id = $1`,
      [id]
    );

    const row = memberResult.rows[0];
    const member = {
      id: row.id,
      project_id: row.project_id,
      user_id: row.user_id,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
      },
    };

    res.status(201).json(member);
  } catch (error) {
    console.error("Error adding project member:", error);
    res.status(500).json({ error: "Failed to add project member" });
  }
});

// Update a project member's role
router.put("/:memberId", async (req, res) => {
  const { memberId } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Role is required" });
  }

  try {
    const result = await query(
      "UPDATE project_members SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [role, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project member not found" });
    }

    // Return updated member with user info
    const memberResult = await query(
      `SELECT 
        pm.id, pm.project_id, pm.user_id, pm.role, 
        pm.created_at, pm.updated_at,
        u.name, u.email, u.avatar,
        u.created_at as user_created_at, u.updated_at as user_updated_at
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.id = $1`,
      [memberId]
    );

    const row = memberResult.rows[0];
    const member = {
      id: row.id,
      project_id: row.project_id,
      user_id: row.user_id,
      role: row.role,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
      },
    };

    res.json(member);
  } catch (error) {
    console.error("Error updating project member:", error);
    res.status(500).json({ error: "Failed to update project member" });
  }
});

// Remove a member from a project
router.delete("/:memberId", async (req, res) => {
  const { memberId } = req.params;

  try {
    const result = await query(
      "DELETE FROM project_members WHERE id = $1 RETURNING id",
      [memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project member not found" });
    }

    res.json({ message: "Project member removed successfully" });
  } catch (error) {
    console.error("Error removing project member:", error);
    res.status(500).json({ error: "Failed to remove project member" });
  }
});

// Get all users (for adding to projects)
router.get("/users", async (req, res) => {
  try {
    const result = await query("SELECT * FROM users ORDER BY name ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create a new user
router.post("/users", async (req, res) => {
  const { name, email, avatar } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const id = uuidv4();

  try {
    const result = await query(
      "INSERT INTO users (id, name, email, avatar) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, name, email, avatar]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

export default router;
