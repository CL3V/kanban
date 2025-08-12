"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Project, Board, Task } from "@/types";
import { ApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { KanbanColumn } from "@/components/kanban-column";
import { TaskCard } from "@/components/task-card";
import { CreateTaskModal } from "@/components/create-task-modal";
import { EditTaskModal } from "@/components/edit-task-modal";
import {
  ArrowLeft,
  Filter,
  Search,
  Users,
  Settings,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const COLUMNS = [
  {
    id: "todo",
    title: "To Do",
    color:
      "bg-gray-50 border-gray-200 dark:bg-slate-800/50 dark:border-slate-600",
    headerColor: "text-gray-800 dark:text-gray-200",
  },
  {
    id: "in-progress",
    title: "In Progress",
    color:
      "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700",
    headerColor: "text-blue-800 dark:text-blue-300",
  },
  {
    id: "in-review",
    title: "In Review",
    color:
      "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700",
    headerColor: "text-amber-800 dark:text-amber-300",
  },
  {
    id: "done",
    title: "Done",
    color:
      "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700",
    headerColor: "text-green-800 dark:text-green-300",
  },
] as const;

export default function BoardPage() {
  const params = useParams();
  const projectId = params.id as string;
  const boardId = params.boardId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const loadBoardData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectData, boardData, tasksData] = await Promise.all([
        ApiClient.getProject(projectId),
        ApiClient.getBoard(boardId),
        ApiClient.getTasks(boardId),
      ]);
      setProject(projectData as Project);
      setBoard(boardData as Board);
      setTasks(tasksData as Task[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load board data"
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, boardId]);

  useEffect(() => {
    if (projectId && boardId) {
      loadBoardData();
    }
  }, [projectId, boardId, loadBoardData]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showFilters]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((task) => task.id === active.id);
    if (!activeTask) return;

    const overColumn = over.id as Task["status"];
    const activeColumn = activeTask.status;

    if (activeColumn === overColumn) return;

    // Optimistically update UI
    const newTasks = tasks.map((task) =>
      task.id === activeTask.id ? { ...task, status: overColumn } : task
    );
    setTasks(newTasks);

    try {
      // Update task position and status on backend
      await ApiClient.updateTask(activeTask.id, {
        status: overColumn,
        position: getNewPosition(overColumn, newTasks),
      });
    } catch (err) {
      // Revert on error
      setTasks(tasks);
      console.error("Failed to update task:", err);
    }
  };

  const getNewPosition = (status: Task["status"], updatedTasks: Task[]) => {
    const statusTasks = updatedTasks.filter((task) => task.status === status);
    return statusTasks.length > 0
      ? Math.max(...statusTasks.map((t) => t.position)) + 1
      : 1;
  };

  const handleCreateTask = (status: Task["status"]) => {
    setIsCreateTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleTaskCreated = () => {
    loadBoardData();
  };

  const handleTaskUpdated = () => {
    loadBoardData();
    setEditingTask(null);
  };

  const handleTaskDeleted = () => {
    loadBoardData();
    setEditingTask(null);
  };

  const handleDeleteBoard = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this board? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await ApiClient.deleteBoard(boardId);
      // Redirect to project page after deletion
      window.location.href = `/projects/${projectId}`;
    } catch (err) {
      console.error("Failed to delete board:", err);
      alert("Failed to delete board");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    // Search filter
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Priority filter
    const matchesPriority =
      filterPriority.length === 0 || filterPriority.includes(task.priority);

    // Assignee filter
    const matchesAssignee =
      filterAssignee.length === 0 ||
      (task.assignee && filterAssignee.includes(task.assignee)) ||
      (filterAssignee.includes("unassigned") && !task.assignee);

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const getTasksByStatus = (status: Task["status"]) => {
    return filteredTasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project || !board) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || "Board not found"}</p>
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${projectId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {project.name}
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {board.name}
              </h1>
              {board.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {board.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-56 bg-white/80 dark:bg-slate-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="relative" ref={filterRef}>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-slate-800/80 relative"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {(filterPriority.length > 0 || filterAssignee.length > 0) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
              {/* Filter Dropdown */}
              {showFilters && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Priority
                      </label>
                      <div className="space-y-2">
                        {["low", "medium", "high", "urgent"].map((priority) => (
                          <label key={priority} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filterPriority.includes(priority)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterPriority([
                                    ...filterPriority,
                                    priority,
                                  ]);
                                } else {
                                  setFilterPriority(
                                    filterPriority.filter((p) => p !== priority)
                                  );
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {priority}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Assignee
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filterAssignee.includes("unassigned")}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilterAssignee([
                                  ...filterAssignee,
                                  "unassigned",
                                ]);
                              } else {
                                setFilterAssignee(
                                  filterAssignee.filter(
                                    (a) => a !== "unassigned"
                                  )
                                );
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Unassigned
                          </span>
                        </label>
                        {Array.from(
                          new Set(tasks.map((t) => t.assignee).filter(Boolean))
                        ).map((assignee) => (
                          <label key={assignee} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filterAssignee.includes(assignee!)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterAssignee([
                                    ...filterAssignee,
                                    assignee!,
                                  ]);
                                } else {
                                  setFilterAssignee(
                                    filterAssignee.filter((a) => a !== assignee)
                                  );
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {assignee}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFilterPriority([]);
                          setFilterAssignee([]);
                        }}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowFilters(false)}
                        className="flex-1"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-slate-800/80"
            >
              <Users className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-slate-800/80"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 bg-white/80 dark:bg-slate-800/80"
              onClick={handleDeleteBoard}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCorners}
        >
          <div className="h-full overflow-x-auto">
            <div className="flex gap-6 p-6 min-w-max h-[calc(100vh-180px)]">
              {COLUMNS.map((column) => {
                const columnTasks = getTasksByStatus(column.id);
                return (
                  <SortableContext
                    key={column.id}
                    items={columnTasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <KanbanColumn
                      id={column.id}
                      title={column.title}
                      color={column.color}
                      headerColor={column.headerColor}
                      tasks={columnTasks}
                      onCreateTask={() => handleCreateTask(column.id)}
                      onEditTask={handleEditTask}
                    />
                  </SortableContext>
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {activeId ? (
              <TaskCard
                task={tasks.find((task) => task.id === activeId)!}
                onEdit={() => {}}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSuccess={handleTaskCreated}
        boardId={boardId}
      />

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={handleTaskUpdated}
          onDelete={handleTaskDeleted}
          task={editingTask}
        />
      )}
    </div>
  );
}
