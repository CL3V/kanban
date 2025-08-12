import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getDatabase } from "@/lib/database";
import { v4 as uuidv4 } from "uuid";

// Initialize database
initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const tasks = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM tasks WHERE board_id = ? ORDER BY position ASC, created_at DESC",
        [params.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, status, priority, assignee, position } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const taskId = uuidv4();
    const now = new Date().toISOString();

    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO tasks (id, board_id, title, description, status, priority, assignee, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          taskId,
          params.id,
          title,
          description || null,
          status || "todo",
          priority || "medium",
          assignee || null,
          position || 0,
          now,
          now,
        ],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });

    const task = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM tasks WHERE id = ?", [taskId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
