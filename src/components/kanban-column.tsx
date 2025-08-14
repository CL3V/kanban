"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task-card";
import { Task } from "@/types";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface KanbanColumnProps {
  id: string;
  title: string;
  headerColor: string;
  accentColor?: string;
  tasks: Task[];
  onCreateTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteColumn: (columnId: string) => void;
}

function KanbanColumnBase({
  id,
  title,
  headerColor,
  accentColor,
  tasks,
  onCreateTask,
  onEditTask,
  onDeleteColumn,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-80 flex-shrink-0 h-full">
      <Card
        className={`flex flex-col h-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 ${
          isOver ? "ring-2 ring-blue-400 dark:ring-blue-500" : ""
        }`}
        style={
          accentColor ? { borderTop: `3px solid ${accentColor}` } : undefined
        }
      >
        <CardHeader className="pb-3 flex-shrink-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {accentColor && (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                  aria-hidden
                />
              )}
              <CardTitle className={`text-sm font-semibold ${headerColor}`}>
                {title}
              </CardTitle>
              <span className="bg-white/80 dark:bg-slate-700/80 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                {tasks.length}
              </span>
            </div>
            <DropdownMenu
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-full"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </Button>
              }
            >
              <DropdownMenuItem
                destructive
                onClick={() => onDeleteColumn(id)}
                disabled={tasks.length > 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete column
              </DropdownMenuItem>
              {tasks.length > 0 && (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                  Cannot delete column with tasks
                </div>
              )}
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-3 max-h-[calc(100vh-280px)] min-h-[400px] scrollbar-thin scrollbar-thumb-brand scrollbar-track-brand scrollbar-color-brand">
          <div ref={setNodeRef} className="space-y-3 h-full">
            <SortableContext
              items={tasks.map((task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(task)}
                />
              ))}
            </SortableContext>

            {tasks.length === 0 && (
              <div className="text-center text-gray-400 dark:text-gray-500 py-12">
                <p className="text-sm font-medium">No tasks yet</p>
                <p className="text-xs mt-1">
                  Click &ldquo;Add a task&rdquo; to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateTask(id)}
            className="w-full justify-start text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add a task
          </Button>
        </div>
      </Card>
    </div>
  );
}

function areEqual(prev: KanbanColumnProps, next: KanbanColumnProps) {
  if (
    prev.id !== next.id ||
    prev.title !== next.title ||
    prev.headerColor !== next.headerColor ||
    prev.accentColor !== next.accentColor
  ) {
    return false;
  }
  // Compare tasks by id and position to avoid re-rendering columns whose task list hasn't changed
  if (prev.tasks.length !== next.tasks.length) return false;
  for (let i = 0; i < prev.tasks.length; i++) {
    const a = prev.tasks[i];
    const b = next.tasks[i];
    if (a.id !== b.id || a.position !== b.position) return false;
  }
  return true;
}

export const KanbanColumn = memo(KanbanColumnBase, areEqual);
