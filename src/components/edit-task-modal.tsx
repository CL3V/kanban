"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { UpdateTaskRequest, Task } from "@/types";
import { X, User, Trash2, Save } from "lucide-react";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
  task: Task;
}

export function EditTaskModal({
  isOpen,
  onClose,
  onSuccess,
  onDelete,
  task,
}: EditTaskModalProps) {
  const [formData, setFormData] = useState<UpdateTaskRequest>({
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    assignee: task.assignee || "",
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await ApiClient.updateTask(task.id, formData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      await ApiClient.deleteTask(task.id);
      onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      setDeleting(false);
    }
  };

  const handleChange = (field: keyof UpdateTaskRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto shadow-2xl border-gray-200 dark:border-gray-700 animate-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Task
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ID: {task.id} • Created: {formatDate(task.created_at)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Task Title *
              </label>
              <Input
                type="text"
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter task title..."
                className="w-full"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Description
              </label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter task description..."
                className="w-full h-24 resize-none"
              />
            </div>

            {/* Status and Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange("priority", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Assignee
              </label>
              <Input
                type="text"
                value={formData.assignee || ""}
                onChange={(e) => handleChange("assignee", e.target.value)}
                placeholder="Enter assignee email or name..."
                className="w-full"
              />
            </div>

            {/* Task Metadata */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Task Information
              </h4>
              <div className="space-y-1 text-xs text-gray-600">
                <p>Position: #{task.position}</p>
                <p>Created: {formatDate(task.created_at)}</p>
                <p>Updated: {formatDate(task.updated_at)}</p>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded border">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || loading}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>

              <div className="flex-1" />

              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading || deleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || deleting || !formData.title?.trim()}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
