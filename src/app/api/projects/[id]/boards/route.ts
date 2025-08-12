import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getDatabase } from "@/lib/database";
import { v4 as uuidv4 } from "uuid";

// Ensure DB initialized in serverless
initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // project id
    const db = getDatabase();

    const boards = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM boards WHERE project_id = ? ORDER BY created_at DESC",
        [id],
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // project id
    const { name, description } = await request.json();

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
        [boardId, id, name, description || null, now, now],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });

    return NextResponse.json(
      {
        id: boardId,
        project_id: id,
        name,
        description,
        created_at: now,
        updated_at: now,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500 }
    );
  }
}
