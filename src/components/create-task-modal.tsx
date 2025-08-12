"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { CreateTaskRequest, User, ProjectMember } from "@/types";
import { X, User as UserIcon } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  boardId: string;
  projectId: string;
  initialColumnId?: string;
}

interface MemberWithUser extends ProjectMember {
  user: User;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  boardId,
  projectId,
  initialColumnId = "",
}: CreateTaskModalProps) {
  const [formData, setFormData] = useState<CreateTaskRequest>({
    board_id: boardId,
    title: "",
    description: "",
    column_id: initialColumnId,
    priority: "medium",
    assignee_id: "",
  });
  const [projectMembers, setProjectMembers] = useState<MemberWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
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

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectMembers();
    }
  }, [isOpen, projectId, fetchProjectMembers]);

  useEffect(() => {
    if (isOpen && initialColumnId) {
      setFormData((prev) => ({ ...prev, column_id: initialColumnId }));
    }
  }, [isOpen, initialColumnId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await ApiClient.createTask(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        board_id: boardId,
        title: "",
        description: "",
        column_id: initialColumnId,
        priority: "medium",
        assignee_id: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateTaskRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl border-gray-200 dark:border-gray-700 animate-in zoom-in duration-200">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Task
          </CardTitle>
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
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter task title..."
                className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
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
                className="w-full h-20 resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading || !formData.title.trim()}
              >
                {loading ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
