import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getDatabase } from "@/lib/database";

// Initialize database
initDatabase();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, status, priority, assignee, position } = body;

    const db = getDatabase();
    const now = new Date().toISOString();

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push("priority = ?");
      values.push(priority);
    }
    if (assignee !== undefined) {
      updates.push("assignee = ?");
      values.push(assignee);
    }
    if (position !== undefined) {
      updates.push("position = ?");
      values.push(position);
    }

    updates.push("updated_at = ?");
    values.push(now, params.id);

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`,
        values,
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });

    const task = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM tasks WHERE id = ?", [params.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run("DELETE FROM tasks WHERE id = ?", [params.id], (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
