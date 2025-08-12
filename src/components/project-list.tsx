"use client";

import { useState, useEffect } from "react";
import { Project } from "@/types";
import { ApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectListSkeleton } from "@/components/ui/skeleton";
import {
  Plus,
  FolderOpen,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface ProjectListProps {
  onCreateProject: () => void;
  onEditProject?: (project: Project) => void;
}

export function ProjectList({
  onCreateProject,
  onEditProject,
}: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

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

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getProjects();
      setProjects(data as Project[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    projectName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${projectName}"? This action cannot be undone and will delete all boards and tasks in this project.`
      )
    ) {
      return;
    }

    try {
      setDeletingProject(projectId);
      await ApiClient.deleteProject(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
      setOpenDropdown(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeletingProject(null);
    }
  };

  const handleEditProject = (project: Project) => {
    setOpenDropdown(null);
    if (onEditProject) {
      onEditProject(project);
    }
  };

  const toggleDropdown = (projectId: string) => {
    setOpenDropdown(openDropdown === projectId ? null : projectId);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Loading your projects...
            </p>
          </div>
        </div>
        <ProjectListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadProjects} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your Kanban projects and boards
          </p>
        </div>
        <Button
          onClick={onCreateProject}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-16 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent>
            <FolderOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-6" />
            <CardTitle className="text-2xl mb-3 text-gray-900 dark:text-white">
              No projects yet
            </CardTitle>
            <CardDescription className="mb-6 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Create your first project to get started with organizing your
              tasks and workflows
            </CardDescription>
            <Button
              onClick={onCreateProject}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group hover:shadow-xl transition-all duration-300 h-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:scale-[1.02] hover:-translate-y-1 relative"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-800"
                      style={{ backgroundColor: project.color }}
                    />
                    <CardTitle className="text-lg truncate text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.name}
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
                        toggleDropdown(project.id);
                      }}
                      disabled={deletingProject === project.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>

                    {openDropdown === project.id && (
                      <div className="absolute right-0 top-9 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-32">
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditProject(project);
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
                            handleDeleteProject(project.id, project.name);
                          }}
                          disabled={deletingProject === project.id}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingProject === project.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {project.description && (
                  <Link href={`/projects/${project.id}`}>
                    <CardDescription className="line-clamp-2 text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                      {project.description}
                    </CardDescription>
                  </Link>
                )}
              </CardHeader>
              <Link href={`/projects/${project.id}`}>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created {formatDate(project.created_at)}
                    </div>
                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        →
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
