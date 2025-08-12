import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getDatabase } from "@/lib/database";
import { v4 as uuidv4 } from "uuid";

// Ensure DB is ready in serverless environments
initDatabase();

export async function GET() {
  try {
    const db = getDatabase();
    const users = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM users ORDER BY name ASC", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, avatar } = await request.json();
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO users (id, name, email, avatar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [id, name, email, avatar || null, now, now],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });

    return NextResponse.json(
      { id, name, email, avatar, created_at: now, updated_at: now },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
