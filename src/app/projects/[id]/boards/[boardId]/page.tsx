"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useReducer,
} from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
// (Sortable utilities are handled inside KanbanColumn)
import { Project, Board, Task, Column } from "@/types";
import { ApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { KanbanSkeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  Filter,
  Search,
  Settings,
  Trash2,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { EditBoardModal } from "@/components/edit-board-modal";

// Lazy-loaded client components to reduce initial bundle size
const KanbanColumn = dynamic(
  () => import("@/components/kanban-column").then((m) => m.KanbanColumn),
  {
    ssr: false,
    loading: () => (
      <div className="w-80 flex-shrink-0 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 h-[400px] animate-pulse" />
    ),
  }
);

const TaskCard = dynamic(
  () => import("@/components/task-card").then((m) => m.TaskCard),
  { ssr: false }
);

const CreateTaskModal = dynamic(
  () => import("@/components/create-task-modal").then((m) => m.CreateTaskModal),
  { ssr: false }
);

const EditTaskModal = dynamic(
  () => import("@/components/edit-task-modal").then((m) => m.EditTaskModal),
  { ssr: false }
);

const CreateColumnModal = dynamic(
  () =>
    import("@/components/create-column-modal").then((m) => m.CreateColumnModal),
  { ssr: false }
);

export default function BoardPage() {
  const params = useParams();
  const projectId = params.id as string;
  const boardId = params.boardId as string;

  type State = {
    project: Project | null;
    board: Board | null;
    columns: Column[];
    tasks: Task[];
    loading: boolean;
    error: string | null;
  };

  type Action =
    | { type: "LOAD_START" }
    | {
        type: "LOAD_SUCCESS";
        payload: {
          project: Project;
          board: Board;
          columns: Column[];
          tasks: Task[];
        };
      }
    | { type: "LOAD_ERROR"; payload: string }
    | { type: "SET_TASKS"; payload: Task[] }
    | { type: "SET_COLUMNS"; payload: Column[] };

  const initialState: State = {
    project: null,
    board: null,
    columns: [],
    tasks: [],
    loading: true,
    error: null,
  };

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case "LOAD_START":
        return { ...state, loading: true, error: null };
      case "LOAD_SUCCESS":
        return {
          ...state,
          loading: false,
          error: null,
          project: action.payload.project,
          board: action.payload.board,
          columns: action.payload.columns,
          tasks: action.payload.tasks,
        };
      case "LOAD_ERROR":
        return { ...state, loading: false, error: action.payload };
      case "SET_TASKS":
        return { ...state, tasks: action.payload };
      case "SET_COLUMNS":
        return { ...state, columns: action.payload };
      default:
        return state;
    }
  }

  const [{ project, board, columns, tasks, loading, error }, dispatch] =
    useReducer(reducer, initialState);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string>("");
  const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  type MemberWithUser = import("@/types").ProjectMember & {
    user: import("@/types").User;
  };
  const [preloadForModal, setPreloadForModal] = useState<{
    members?: MemberWithUser[];
    columns?: Column[];
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isEditBoardOpen, setIsEditBoardOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Configure sensors so dragging starts quickly without long-press
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Small movement activates drag; no press delay required
      activationConstraint: { distance: 3 },
    })
  );

  const loadBoardData = useCallback(async () => {
    try {
      dispatch({ type: "LOAD_START" });
      const [projectData, boardData, columnsData, tasksData] =
        await Promise.all([
          ApiClient.getProject(projectId),
          ApiClient.getBoard(boardId),
          ApiClient.getColumns(boardId),
          ApiClient.getTasks(boardId),
        ]);
      dispatch({
        type: "LOAD_SUCCESS",
        payload: {
          project: projectData as Project,
          board: boardData as Board,
          columns: columnsData as Column[],
          tasks: tasksData as Task[],
        },
      });
    } catch (err) {
      dispatch({
        type: "LOAD_ERROR",
        payload:
          err instanceof Error ? err.message : "Failed to load board data",
      });
    } finally {
      // loading handled via reducer
    }
  }, [projectId, boardId]);

  useEffect(() => {
    if (projectId && boardId) {
      loadBoardData();
    }
  }, [projectId, boardId, loadBoardData]);

  // Close filter dropdown when clicking outside
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((task) => task.id === active.id);
    if (!activeTask) return;

    // Determine the target column
    // If dropping over a task, find the task's column
    // If dropping over a column, use the column ID directly
    let overColumnId: string;
    const overTask = tasks.find((task) => task.id === over.id);

    if (overTask) {
      // Dropped over a task, use the task's column_id as the column
      overColumnId = overTask.column_id;
    } else {
      // Dropped over a column directly
      overColumnId = over.id as string;
    }

    const activeColumnId = activeTask.column_id;

    // Debug logging
    console.log("Drag end - active:", active.id, "over:", over.id);
    console.log("Active task:", activeTask);
    console.log("Over task:", overTask);
    console.log("Over column:", overColumnId, "Type:", typeof overColumnId);
    console.log("Active column:", activeColumnId);

    if (activeColumnId === overColumnId) return;

    // Optimistically update UI
    const newTasks = tasks.map((task) =>
      task.id === activeTask.id ? { ...task, column_id: overColumnId } : task
    );
    dispatch({ type: "SET_TASKS", payload: newTasks });

    try {
      // Update task column and position on backend
      const tasksInTargetColumn = newTasks.filter(
        (task) => task.column_id === overColumnId && task.id !== activeTask.id
      );
      const newPosition = tasksInTargetColumn.length;

      const updateData = {
        column_id: overColumnId,
        position: newPosition,
      };
      console.log("Sending update to API:", updateData);

      await ApiClient.updateTask(activeTask.id, updateData);
    } catch (err) {
      // Revert on error
      dispatch({ type: "SET_TASKS", payload: tasks });
      console.error("Failed to update task:", err);
    }
  };

  const handleCreateTask = useCallback((columnId: string) => {
    setCreateTaskColumnId(columnId);
    setIsCreateTaskModalOpen(true);
  }, []);

  const handleEditTask = (task: Task) => {
    // Preload columns from current state; members will still be fetched inside if not provided
    setPreloadForModal({ columns });
    setEditingTask(task);
  };

  const handleTaskCreated = useCallback(() => {
    loadBoardData();
  }, [loadBoardData]);

  const handleTaskUpdated = useCallback(() => {
    loadBoardData();
    setEditingTask(null);
  }, [loadBoardData]);

  const handleTaskDeleted = useCallback(() => {
    loadBoardData();
    setEditingTask(null);
  }, [loadBoardData]);

  const handleColumnCreated = useCallback(() => {
    loadBoardData();
  }, [loadBoardData]);

  const handleDeleteColumn = async (columnId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this column? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await ApiClient.deleteColumn(columnId);
      loadBoardData();
    } catch (err) {
      console.error("Failed to delete column:", err);
      alert("Failed to delete column. Make sure the column has no tasks.");
    }
  };

  // Note: grouping tasks by status is handled inline per column

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

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
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
          (task.assignee_id && filterAssignee.includes(task.assignee_id)) ||
          (filterAssignee.includes("unassigned") && !task.assignee_id);

        return matchesSearch && matchesPriority && matchesAssignee;
      }),
    [tasks, searchQuery, filterPriority, filterAssignee]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-24 rounded"></div>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="space-y-2">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-48 rounded"></div>
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-64 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanSkeleton />
        </div>
      </div>
    );
  }

  if (error || !project || !board) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || "Board not found"}</p>
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline">
            <ChevronLeft className="w-8 h-8 mr-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 shadow-sm flex-shrink-0 relative">
        <div className="mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/projects/${projectId}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <ChevronLeft className="w-8 h-8 mr-2" />
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
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg  p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                          Priority
                        </label>
                        <div className="space-y-2">
                          {["low", "medium", "high", "urgent"].map(
                            (priority) => (
                              <label
                                key={priority}
                                className="flex items-center"
                              >
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
                                        filterPriority.filter(
                                          (p) => p !== priority
                                        )
                                      );
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                  {priority}
                                </span>
                              </label>
                            )
                          )}
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
                            new Set(
                              tasks.map((t) => t.assignee_id).filter(Boolean)
                            )
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
                                      filterAssignee.filter(
                                        (a) => a !== assignee
                                      )
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
                onClick={() => setIsEditBoardOpen(true)}
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
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCorners}
        >
          <div
            className="h-[calc(100vh-180px)] overflow-x-scroll overflow-y-hidden scrollbar-thin scrollbar-thumb-brand scrollbar-track-brand scrollbar-color-brand"
            style={{ scrollbarGutter: "stable both-edges" }}
          >
            <div className="flex gap-6 p-6 min-w-max h-full">
              {columns.length > 0 ? (
                columns.map((column) => {
                  const columnTasks = filteredTasks.filter(
                    (task) => task.column_id === column.id
                  );
                  return (
                    <KanbanColumn
                      key={column.id}
                      id={column.id}
                      title={column.name}
                      headerColor="text-gray-800 dark:text-gray-200"
                      accentColor={column.color}
                      tasks={columnTasks}
                      onCreateTask={handleCreateTask}
                      onEditTask={handleEditTask}
                      onDeleteColumn={handleDeleteColumn}
                    />
                  );
                })
              ) : (
                <div className="w-80 flex-shrink-0 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No columns yet. Click &quot;Add Column&quot; to create your
                  first one.
                </div>
              )}

              {/* Create Column Button */}
              <div className="w-80 flex-shrink-0">
                <Button
                  variant="outline"
                  className="w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => setIsCreateColumnModalOpen(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Column
                </Button>
              </div>
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
        projectId={projectId}
        initialColumnId={createTaskColumnId}
      />

      <CreateColumnModal
        isOpen={isCreateColumnModalOpen}
        onClose={() => setIsCreateColumnModalOpen(false)}
        onSuccess={handleColumnCreated}
        boardId={boardId}
      />

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={handleTaskUpdated}
          onDelete={handleTaskDeleted}
          task={editingTask}
          projectId={projectId}
          preload={preloadForModal}
        />
      )}

      <EditBoardModal
        isOpen={isEditBoardOpen}
        onClose={() => setIsEditBoardOpen(false)}
        onSuccess={loadBoardData}
        board={board}
      />
    </div>
  );
}
