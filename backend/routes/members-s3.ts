import express from "express";
import { users, projectMembers } from "../database/s3-db";

const router = express.Router();

// Get all users
router.get("/users", async (req, res) => {
  try {
    const allUsers = await users.findAll();
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get a specific user
router.get("/users/:id", async (req, res) => {
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

// Create a new user
router.post("/users", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      error: "Name and email are required",
    });
  }

  try {
    const newUser = await users.create({
      name,
      email,
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update a user
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const updatedUser = await users.update(id, {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete a user
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await users.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get project members
router.get("/projects/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const members = await projectMembers.findByProjectId(projectId);

    // Get user details for each member
    const membersWithUserInfo = await Promise.all(
      members.map(async (member) => {
        const user = await users.findById(member.user_id);
        return {
          ...member,
          user: user || null,
        };
      })
    );

    res.json(membersWithUserInfo);
  } catch (error) {
    console.error("Error fetching project members:", error);
    res.status(500).json({ error: "Failed to fetch project members" });
  }
});

// Add a member to a project
router.post("/projects/:projectId/users/:userId", async (req, res) => {
  const { projectId, userId } = req.params;
  const { role = "member" } = req.body;

  try {
    // Check if user exists
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already a member
    const existingMembers = await projectMembers.findByProjectId(projectId);
    const alreadyMember = existingMembers.some(
      (member) => member.user_id === userId
    );

    if (alreadyMember) {
      return res
        .status(400)
        .json({ error: "User is already a member of this project" });
    }

    const newMember = await projectMembers.create({
      project_id: projectId,
      user_id: userId,
      role,
    });

    res.status(201).json({
      ...newMember,
      user,
    });
  } catch (error) {
    console.error("Error adding project member:", error);
    res.status(500).json({ error: "Failed to add project member" });
  }
});

// Remove a member from a project
router.delete("/projects/:projectId/users/:userId", async (req, res) => {
  const { projectId, userId } = req.params;

  try {
    const members = await projectMembers.findByProjectId(projectId);
    const memberToRemove = members.find(
      (member) => member.project_id === projectId && member.user_id === userId
    );

    if (!memberToRemove) {
      return res
        .status(404)
        .json({ error: "Member not found in this project" });
    }

    await projectMembers.delete(memberToRemove.id);

    res.json({ message: "Member removed from project successfully" });
  } catch (error) {
    console.error("Error removing project member:", error);
    res.status(500).json({ error: "Failed to remove project member" });
  }
});

export default router;
