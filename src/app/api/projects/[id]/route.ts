import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getDatabase } from "@/lib/database";

// Initialize database
initDatabase();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDatabase();
    const project = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM projects WHERE id = ?", [params.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
