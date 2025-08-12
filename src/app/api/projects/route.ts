import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getDatabase } from "@/lib/database";
import { v4 as uuidv4 } from "uuid";

// Initialize database
initDatabase();

export async function GET() {
  try {
    const db = getDatabase();
    const projects = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM projects ORDER BY created_at DESC", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const projectId = uuidv4();
    const now = new Date().toISOString();

    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO projects (id, name, description, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [projectId, name, description || null, color || "#3B82F6", now, now],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });

    const project = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM projects WHERE id = ?", [projectId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
