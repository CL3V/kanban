"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { UpdateTaskRequest, Task, User, ProjectMember, Column } from "@/types";
import { X, User as UserIcon, Trash2, Save } from "lucide-react";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
  task: Task;
  projectId: string;
  // Optional preloaded data to reduce perceived latency
  preload?: {
    members?: MemberWithUser[];
    columns?: Column[];
  };
}

interface MemberWithUser extends ProjectMember {
  user: User;
}

export function EditTaskModal({
  isOpen,
  onClose,
  onSuccess,
  onDelete,
  task,
  projectId,
  preload,
}: EditTaskModalProps) {
  const [formData, setFormData] = useState<UpdateTaskRequest>({
    title: task.title,
    description: task.description || "",
    column_id: task.column_id,
    priority: task.priority,
    assignee_id: task.assignee_id || "",
  });
  const [columns, setColumns] = useState<Column[]>([]);
  const [projectMembers, setProjectMembers] = useState<MemberWithUser[]>(
    preload?.members || []
  );
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      const members = (await ApiClient.getProjectMembers(
        projectId
      )) as MemberWithUser[];
      setProjectMembers(members);
    } catch (err) {
      console.error("Failed to fetch project members:", err);
      setProjectMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId]);

  const fetchColumns = useCallback(async () => {
    try {
      setLoadingColumns(true);
      const columnData = (await ApiClient.getColumns(
        task.board_id
      )) as Column[];
      setColumns(columnData);
    } catch (err) {
      console.error("Failed to fetch columns:", err);
      setColumns([]);
    } finally {
      setLoadingColumns(false);
    }
  }, [task.board_id]);

  useEffect(() => {
    if (!isOpen) return;
    if (projectId && (!preload?.members || preload.members.length === 0)) {
      fetchProjectMembers();
    }
    if (!preload?.columns || preload.columns.length === 0) {
      fetchColumns();
    } else {
      setColumns(preload.columns);
    }
  }, [isOpen, projectId, fetchProjectMembers, fetchColumns, preload]);

  useEffect(() => {
    // Update form data when task changes
    setFormData({
      title: task.title,
      description: task.description || "",
      column_id: task.column_id,
      priority: task.priority,
      assignee_id: task.assignee_id || "",
    });
  }, [task]);

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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Description
              </label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter task description..."
                className="w-full h-24 resize-none"
              />
            </div>

            {/* Column and Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Column
                </label>
                <select
                  value={formData.column_id}
                  onChange={(e) => handleChange("column_id", e.target.value)}
                  disabled={loadingColumns}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="">Select column</option>
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.name}
                    </option>
                  ))}
                </select>
                {loadingColumns && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Loading columns...
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange("priority", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                <UserIcon className="w-4 h-4 inline mr-1" />
                Assignee
              </label>
              <select
                value={formData.assignee_id || ""}
                onChange={(e) => handleChange("assignee_id", e.target.value)}
                disabled={loadingMembers}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">No assignee</option>
                {projectMembers.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user.name} ({member.user.email})
                  </option>
                ))}
              </select>
              {loadingMembers && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Loading project members...
                </p>
              )}
              {projectMembers.length === 0 && !loadingMembers && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No team members assigned to this project yet.
                </p>
              )}
            </div>

            {/* Task Metadata */}
            <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Information
              </h4>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
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
