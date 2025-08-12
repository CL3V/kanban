import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: projectId, userId } = await params;

    // First, find the member ID by project and user ID
    const membersResponse = await fetch(
      `${BACKEND_URL}/members/project/${projectId}`
    );

    if (!membersResponse.ok) {
      return NextResponse.json(
        { error: "Failed to find member" },
        { status: 404 }
      );
    }

    const members = await membersResponse.json();
    const member = members.find(
      (m: { user_id: string; id: string }) => m.user_id === userId
    );

    if (!member) {
      return NextResponse.json(
        { error: "Member not found in this project" },
        { status: 404 }
      );
    }

    // Delete the member using their member ID
    const response = await fetch(`${BACKEND_URL}/members/${member.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
