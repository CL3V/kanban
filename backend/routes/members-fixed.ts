import express from "express";
import { v4 as uuidv4 } from "uuid";
import { users, projectMembers } from "../database/s3-db";
import { ProjectMember, User } from "../types";

const router = express.Router();

// Get all users (for general user listing)
router.get("/", async (req, res) => {
  try {
    const allUsers = await users.findAll();
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create a new user
router.post("/", async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const newUser: User = {
      id: uuidv4(),
      name,
      email,
      avatar,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const user = await users.create(newUser);
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Get all members of a project
router.get("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const members = await projectMembers.findByProjectId(projectId);
    const allUsers = await users.findAll();

    // Join members with user data
    const membersWithUsers = members.map((member) => {
      const user = allUsers.find((u) => u.id === member.user_id);
      return {
        ...member,
        user: user || null,
      };
    });

    res.json(membersWithUsers);
  } catch (error) {
    console.error("Error fetching project members:", error);
    res.status(500).json({ error: "Failed to fetch project members" });
  }
});

// Add a member to a project
router.post("/project/:projectId", async (req, res) => {
  const { projectId } = req.params;
  const { userId, role = "member" } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Check if user exists
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if membership already exists
    const existingMembers = await projectMembers.findByProjectId(projectId);
    const existingMember = existingMembers.find((m) => m.user_id === userId);

    if (existingMember) {
      return res
        .status(409)
        .json({ error: "User is already a member of this project" });
    }

    const newMember: ProjectMember = {
      id: uuidv4(),
      project_id: projectId,
      user_id: userId,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const member = await projectMembers.create(newMember);
    res.status(201).json({
      ...member,
      user,
    });
  } catch (error) {
    console.error("Error adding project member:", error);
    res.status(500).json({ error: "Failed to add project member" });
  }
});

// Update a member's role
router.put("/project/:projectId/user/:userId", async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;

  try {
    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    // Find the member
    const members = await projectMembers.findByProjectId(projectId);
    const member = members.find((m) => m.user_id === userId);

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const updatedMember = {
      ...member,
      role,
      updated_at: new Date().toISOString(),
    };

    const result = await projectMembers.update(member.id, updatedMember);
    const user = await users.findById(userId);

    res.json({
      ...result,
      user,
    });
  } catch (error) {
    console.error("Error updating project member:", error);
    res.status(500).json({ error: "Failed to update project member" });
  }
});

// Remove a member from a project
router.delete("/project/:projectId/user/:userId", async (req, res) => {
  const { projectId, userId } = req.params;

  try {
    // Find the member
    const members = await projectMembers.findByProjectId(projectId);
    const member = members.find((m) => m.user_id === userId);

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    await projectMembers.delete(member.id);
    res.status(204).send();
  } catch (error) {
    console.error("Error removing project member:", error);
    res.status(500).json({ error: "Failed to remove project member" });
  }
});

// Get a specific user by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await users.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update a user
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, avatar } = req.body;

  try {
    const existingUser = await users.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = {
      ...existingUser,
      name: name !== undefined ? name : existingUser.name,
      email: email !== undefined ? email : existingUser.email,
      avatar: avatar !== undefined ? avatar : existingUser.avatar,
      updated_at: new Date().toISOString(),
    };

    const user = await users.update(id, updatedUser);
    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete a user
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await users.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await users.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
