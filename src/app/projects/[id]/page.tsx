"use client";

import { useState, useEffect, useCallback } from "react";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  ChevronLeft,
  Plus,
  LayoutGrid,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CreateBoardModal } from "@/components/create-board-modal";
import { EditBoardModal } from "@/components/edit-board-modal";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isEditBoardOpen, setIsEditBoardOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const loadProjectData = useCallback(async () => {
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
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId, loadProjectData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target || !(event.target as Element).closest(".relative")) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openDropdown]);

  const handleCreateBoard = () => {
    setIsCreateBoardModalOpen(true);
  };

  const handleBoardCreated = () => {
    loadProjectData(); // Refresh the boards list
  };

  const handleEditBoard = (board: Board) => {
    setSelectedBoard(board);
    setIsEditBoardOpen(true);
  };

  const handleDeleteBoard = async (boardId: string, boardName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${boardName}"? This action cannot be undone and will delete all tasks in this board.`
      )
    ) {
      return;
    }

    try {
      setDeletingBoard(boardId);
      await ApiClient.deleteBoard(boardId);
      setBoards(boards.filter((b) => b.id !== boardId));
      setOpenDropdown(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete board");
    } finally {
      setDeletingBoard(null);
    }
  };

  const toggleDropdown = (boardId: string) => {
    setOpenDropdown(openDropdown === boardId ? null : boardId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading project..." />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || "Project not found"}</p>
        <Link href="/">
          <Button variant="outline">
            <ChevronLeft className="w-8 h-8 mr-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-8 h-8 mr-2" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <div>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                {project.description && (
                  <p className="text-gray-600 mt-1">{project.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/projects/${projectId}/members`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                Members
              </Button>
            </Link>
            <Button size="sm" onClick={handleCreateBoard} className="gap-2">
              <Plus className="w-4 h-4" />
              New Board
            </Button>
          </div>
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

        {/* Members moved to dedicated page; use the header button to navigate */}

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
                <Card
                  key={board.id}
                  className="hover:shadow-md transition-shadow h-full relative group"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/projects/${projectId}/boards/${board.id}`}
                        className="flex-1 min-w-0"
                      >
                        <CardTitle className="text-lg hover:text-blue-600 transition-colors">
                          {board.name}
                        </CardTitle>
                      </Link>

                      {/* Dropdown Menu */}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleDropdown(board.id);
                          }}
                          disabled={deletingBoard === board.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>

                        {openDropdown === board.id && (
                          <div className="absolute right-0 top-9 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-32">
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditBoard(board);
                                setOpenDropdown(null);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteBoard(board.id, board.name);
                              }}
                              disabled={deletingBoard === board.id}
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingBoard === board.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {board.description && (
                      <Link href={`/projects/${projectId}/boards/${board.id}`}>
                        <CardDescription className="line-clamp-2">
                          {board.description}
                        </CardDescription>
                      </Link>
                    )}
                  </CardHeader>
                  <Link href={`/projects/${projectId}/boards/${board.id}`}>
                    <CardContent>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        Created {formatDate(board.created_at)}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
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
        <EditBoardModal
          isOpen={isEditBoardOpen}
          onClose={() => setIsEditBoardOpen(false)}
          onSuccess={loadProjectData}
          board={selectedBoard}
        />
      </div>
    </div>
  );
}
