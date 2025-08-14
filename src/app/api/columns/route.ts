import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/columns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const columnId = url.searchParams.get("id");

    if (!columnId) {
      return NextResponse.json(
        { error: "Column ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/columns/${columnId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating column:", error);
    return NextResponse.json(
      { error: "Failed to update column" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const columnId = url.searchParams.get("id");

    if (!columnId) {
      return NextResponse.json(
        { error: "Column ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/columns/${columnId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    // Backend returns 204 No Content; normalize to JSON for the client
    if (response.status === 204) {
      return NextResponse.json({ success: true });
    }

    // Fallback in case backend returns a body
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(
      Object.keys(data).length ? data : { success: true }
    );
  } catch (error) {
    console.error("Error deleting column:", error);
    return NextResponse.json(
      { error: "Failed to delete column" },
      { status: 500 }
    );
  }
}
