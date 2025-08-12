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
    const boards = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM boards WHERE project_id = ? ORDER BY created_at DESC",
        [params.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    return NextResponse.json(
      { error: "Failed to fetch boards" },
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Board name is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const boardId = uuidv4();
    const now = new Date().toISOString();

    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO boards (id, project_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [boardId, params.id, name, description || null, now, now],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });

    const board = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM boards WHERE id = ?", [boardId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500 }
    );
  }
}
