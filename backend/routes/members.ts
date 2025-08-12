import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database/db";
import { ProjectMember, User } from "../types";

const router = express.Router();

// Get all members of a project
router.get("/project/:projectId", (req, res) => {
  const { projectId } = req.params;

  db.all(
    `SELECT 
      pm.id, pm.project_id, pm.user_id, pm.role, 
      pm.created_at, pm.updated_at,
      u.name, u.email, u.avatar,
      u.created_at as user_created_at, u.updated_at as user_updated_at
     FROM project_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = ?
     ORDER BY u.name ASC`,
    [projectId],
    (err, rows: any[]) => {
      if (err) {
        console.error("Error fetching project members:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch project members" });
      }

      const members = rows.map((row) => ({
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
    }
  );
});

// Add a member to a project
router.post("/project/:projectId", (req, res) => {
  const { projectId } = req.params;
  const { user_id, role = "member" } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  // Check if user exists
  db.get("SELECT id FROM users WHERE id = ?", [user_id], (err, user) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({ error: "Failed to verify user" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if project exists
    db.get(
      "SELECT id FROM projects WHERE id = ?",
      [projectId],
      (err, project) => {
        if (err) {
          console.error("Error checking project:", err);
          return res.status(500).json({ error: "Failed to verify project" });
        }

        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }

        // Check if user is already a member
        db.get(
          "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
          [projectId, user_id],
          (err, existing) => {
            if (err) {
              console.error("Error checking existing membership:", err);
              return res
                .status(500)
                .json({ error: "Failed to check membership" });
            }

            if (existing) {
              return res
                .status(409)
                .json({ error: "User is already a member of this project" });
            }

            // Add user to project
            const id = uuidv4();
            const now = new Date().toISOString();

            db.run(
              "INSERT INTO project_members (id, project_id, user_id, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
              [id, projectId, user_id, role, now, now],
              function (err) {
                if (err) {
                  console.error("Error adding project member:", err);
                  return res
                    .status(500)
                    .json({ error: "Failed to add project member" });
                }

                // Return the created membership with user info
                db.get(
                  `SELECT 
                  pm.id, pm.project_id, pm.user_id, pm.role, 
                  pm.created_at, pm.updated_at,
                  u.name, u.email, u.avatar,
                  u.created_at as user_created_at, u.updated_at as user_updated_at
                 FROM project_members pm
                 JOIN users u ON pm.user_id = u.id
                 WHERE pm.id = ?`,
                  [id],
                  (err, row: any) => {
                    if (err) {
                      console.error("Error fetching created member:", err);
                      return res
                        .status(500)
                        .json({ error: "Failed to fetch created member" });
                    }

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
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// Update a project member's role
router.put("/:memberId", (req, res) => {
  const { memberId } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: "Role is required" });
  }

  const updated_at = new Date().toISOString();

  db.run(
    "UPDATE project_members SET role = ?, updated_at = ? WHERE id = ?",
    [role, updated_at, memberId],
    function (err) {
      if (err) {
        console.error("Error updating project member:", err);
        return res
          .status(500)
          .json({ error: "Failed to update project member" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Project member not found" });
      }

      // Return updated member with user info
      db.get(
        `SELECT 
          pm.id, pm.project_id, pm.user_id, pm.role, 
          pm.created_at, pm.updated_at,
          u.name, u.email, u.avatar,
          u.created_at as user_created_at, u.updated_at as user_updated_at
         FROM project_members pm
         JOIN users u ON pm.user_id = u.id
         WHERE pm.id = ?`,
        [memberId],
        (err, row: any) => {
          if (err) {
            console.error("Error fetching updated member:", err);
            return res
              .status(500)
              .json({ error: "Failed to fetch updated member" });
          }

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
        }
      );
    }
  );
});

// Remove a member from a project
router.delete("/:memberId", (req, res) => {
  const { memberId } = req.params;

  db.run(
    "DELETE FROM project_members WHERE id = ?",
    [memberId],
    function (err) {
      if (err) {
        console.error("Error removing project member:", err);
        return res
          .status(500)
          .json({ error: "Failed to remove project member" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Project member not found" });
      }

      res.json({ message: "Project member removed successfully" });
    }
  );
});

// Get all users (for adding to projects)
router.get("/users", (req, res) => {
  db.all("SELECT * FROM users ORDER BY name ASC", (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(rows);
  });
});

// Create a new user
router.post("/users", (req, res) => {
  const { name, email, avatar } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    "INSERT INTO users (id, name, email, avatar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, name, email, avatar, now, now],
    function (err) {
      if (err) {
        console.error("Error creating user:", err);
        return res.status(500).json({ error: "Failed to create user" });
      }

      const user = {
        id,
        name,
        email,
        avatar,
        created_at: now,
        updated_at: now,
      };

      res.status(201).json(user);
    }
  );
});

export default router;
