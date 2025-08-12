"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task-card";
import { Task } from "@/types";
import { Plus, MoreHorizontal } from "lucide-react";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  headerColor: string;
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

export function KanbanColumn({
  id,
  title,
  color,
  headerColor,
  tasks,
  onCreateTask,
  onEditTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-80 flex-shrink-0 h-full">
      <Card
        className={`flex flex-col h-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 ${
          isOver ? "ring-2 ring-blue-400 dark:ring-blue-500" : ""
        }`}
      >
        <CardHeader className="pb-3 flex-shrink-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className={`text-sm font-semibold ${headerColor}`}>
                {title}
              </CardTitle>
              <span className="bg-white/80 dark:bg-slate-700/80 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                {tasks.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-full"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </Button>
          </div>
        </CardHeader>

        <CardContent
          className="flex-1 overflow-y-auto p-3 max-h-[calc(100vh-280px)] min-h-[400px]"
          style={{ scrollbarWidth: "thin" }}
        >
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
                  Click "Add a task" to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>

        <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateTask}
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
