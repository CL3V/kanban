"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Project, Board } from "@/types";
import { ApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Plus, LayoutGrid, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CreateBoardModal } from "@/components/create-board-modal";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectData, boardsData] = await Promise.all([
        ApiClient.getProject(projectId),
        ApiClient.getBoards(projectId),
      ]);
      setProject(projectData as Project);
      setBoards(boardsData as Board[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load project data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = () => {
    setIsCreateBoardModalOpen(true);
  };

  const handleBoardCreated = () => {
    loadProjectData(); // Refresh the boards list
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || "Project not found"}</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Projects
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-gray-600 mt-1">{project.description}</p>
                )}
              </div>
            </div>
          </div>
          <Button onClick={handleCreateBoard}>
            <Plus className="w-4 h-4 mr-2" />
            New Board
          </Button>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Boards</p>
                  <p className="text-2xl font-semibold">{boards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-lg font-semibold">
                    {formatDate(project.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-lg font-semibold">
                    {formatDate(project.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boards */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Boards</h2>
          {boards.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <LayoutGrid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <CardTitle className="text-xl mb-2">No boards yet</CardTitle>
                <CardDescription className="mb-4">
                  Create your first board to start organizing tasks
                </CardDescription>
                <Button onClick={handleCreateBoard}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Board
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/projects/${projectId}/boards/${board.id}`}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{board.name}</CardTitle>
                      {board.description && (
                        <CardDescription className="line-clamp-2">
                          {board.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        Created {formatDate(board.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <CreateBoardModal
          isOpen={isCreateBoardModalOpen}
          onClose={() => setIsCreateBoardModalOpen(false)}
          onSuccess={handleBoardCreated}
          projectId={projectId}
        />
      </div>
    </div>
  );
}
