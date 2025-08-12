import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${BACKEND_URL}/boards/${id}`);

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description } = await request.json();
    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run(
        "UPDATE boards SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [name || null, description || null, id],
        function (err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    const updatedBoard = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM boards WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("Error updating board:", error);
    return NextResponse.json(
      { error: "Failed to update board" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDatabase();

    // First delete all tasks in this board
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM tasks WHERE board_id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    // Then delete the board
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM boards WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    return NextResponse.json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("Error deleting board:", error);
    return NextResponse.json(
      { error: "Failed to delete board" },
      { status: 500 }
    );
  }
}
