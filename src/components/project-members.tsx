"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api";
import { User, ProjectMember } from "@/types";
import {
  UserPlus,
  Trash2,
  Crown,
  Shield,
  User as UserIcon,
  ChevronDown,
  X,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Image from "next/image";
import { Input } from "@/components/ui/input";

interface ProjectMembersProps {
  projectId: string;
  refreshTrigger?: number;
}

interface MemberWithUser extends ProjectMember {
  user: User;
}

export function ProjectMembers({
  projectId,
  refreshTrigger,
}: ProjectMembersProps) {
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [membersData, usersData] = await Promise.all([
        ApiClient.getProjectMembers(projectId) as Promise<MemberWithUser[]>,
        ApiClient.getUsers() as Promise<User[]>,
      ]);
      setMembers(membersData);
      setAllUsers(usersData);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [projectId, refreshTrigger, fetchData]);

  const handleAddMember = async (userId: string) => {
    try {
      setIsAddingMember(true);
      await ApiClient.addProjectMember(projectId, { user_id: userId });
      await fetchData(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (
      !confirm(`Are you sure you want to remove ${userName} from this project?`)
    ) {
      return;
    }

    try {
      setRemovingMember(userId);
      await ApiClient.removeProjectMember(projectId, userId);
      await fetchData(); // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemovingMember(null);
    }
  };

  const availableUsers = allUsers.filter(
    (user) => !members.some((member) => member.user_id === user.id)
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (error && !members.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600 dark:text-red-400">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Project Team{" "}
            <span className="text-gray-500 dark:text-gray-400">
              ({members.length})
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add people
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="members-section"
              className="border-gray-200 dark:border-gray-700 flex items-center gap-1"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  open ? "rotate-180" : "rotate-0"
                }`}
              />
              Team
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Members */}
            {members.length > 0 && (
              <div className="space-y-3" id="members-section" hidden={!open}>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Members
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {member.user.avatar ? (
                          <Image
                            src={member.user.avatar}
                            alt={member.user.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {member.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {member.user.name}
                            </span>
                            <span
                              className={`flex flex-row px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                member.role
                              )}`}
                            >
                              {getRoleIcon(member.role)}
                              <span className="ml-1 capitalize">
                                {member.role}
                              </span>
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {member.user.email}
                          </span>
                        </div>
                      </div>

                      {/* Remove Member Button */}
                      {member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveMember(member.user_id, member.user.name)
                          }
                          disabled={removingMember === member.user_id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {removingMember === member.user_id ? (
                            <LoadingSpinner />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableUsers.length === 0 && members.length === 0 && (
              <div className="text-center py-8">
                <UserIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No team members yet
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Add people to your workspace first, then assign them to this
                  project
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}
      </CardContent>

      {/* Add People Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Add people to project
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Input
                  placeholder="Search people..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div
                className="max-h-80 overflow-y-auto space-y-2 pr-1"
                style={{ scrollbarWidth: "thin" }}
              >
                {availableUsers
                  .filter((u) =>
                    (u.name + " " + u.email)
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </span>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          await handleAddMember(user.id);
                        }}
                        disabled={isAddingMember}
                        className="flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        Add
                      </Button>
                    </div>
                  ))}
                {availableUsers.filter((u) =>
                  (u.name + " " + u.email)
                    .toLowerCase()
                    .includes(search.toLowerCase())
                ).length === 0 && (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                    No people to add.
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
