"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Task } from "@/types";
import {
  Flag,
  User,
  Calendar,
  MessageSquare,
  Paperclip,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  isDragging?: boolean;
}

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    color:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    icon: ArrowUp,
    iconColor: "text-red-600 dark:text-red-400",
  },
  urgent: {
    label: "Urgent",
    color:
      "bg-red-200 text-red-900 border-red-300 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700",
    icon: Flag,
    iconColor: "text-red-700 dark:text-red-300",
  },
  medium: {
    label: "Medium",
    color:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    icon: Minus,
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  low: {
    label: "Low",
    color:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    icon: ArrowDown,
    iconColor: "text-green-600 dark:text-green-400",
  },
};

export function TaskCard({ task, onEdit, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const PriorityIcon = priorityConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card
        className={`hover:shadow-lg transition-all duration-200 border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-md hover:shadow-xl hover:-translate-y-0.5 ${
          isDragging
            ? "rotate-2 shadow-2xl scale-105 opacity-90"
            : "hover:scale-[1.02]"
        }`}
      >
        <CardContent className="p-4 relative">
          {/* Click overlay for editing - higher z-index */}
          <div 
            className="absolute inset-0 cursor-pointer z-10 rounded-lg"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(task);
            }}
            onMouseDown={(e: React.MouseEvent) => {
              // Only handle left clicks for editing
              if (e.button === 0) {
                e.stopPropagation();
              }
            }}
          />
          
          {/* Task content - positioned below the click overlay */}
          <div className="relative z-0 pointer-events-none">
            {/* Task Title */}
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 leading-snug">
              {task.title}
            </h3>

          {/* Task Description */}
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Priority Badge */}
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant={
                task.priority === "high"
                  ? "priority-high"
                  : task.priority === "urgent"
                  ? "priority-critical"
                  : task.priority === "medium"
                  ? "priority-medium"
                  : "priority-low"
              }
            >
              <PriorityIcon className="w-3 h-3 mr-1" />
              {priorityConfig.label}
            </Badge>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              {/* Task ID */}
              <span className="font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-[10px]">
                #{task.id.slice(0, 6)}
              </span>

              {/* Attachments count (placeholder) */}
              <div className="flex items-center gap-1 opacity-60">
                <Paperclip className="w-3 h-3" />
                <span>0</span>
              </div>

              {/* Comments count (placeholder) */}
              <div className="flex items-center gap-1 opacity-60">
                <MessageSquare className="w-3 h-3" />
                <span>0</span>
              </div>
            </div>

            {/* Due date and assignee */}
            <div className="flex items-center gap-2">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span
                    className={
                      new Date(task.dueDate) < new Date()
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  >
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              )}

              {/* Assignee Avatar (placeholder) */}
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                <User className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          {/* End of task content */}
          </div>

          {/* Status indicator line */}
          <div
            className={`h-1 rounded-full mt-3 ${
              task.status === "todo"
                ? "bg-slate-300 dark:bg-slate-600"
                : task.status === "in-progress"
                ? "bg-blue-500"
                : task.status === "in-review"
                ? "bg-amber-500"
                : "bg-green-500"
            }`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
