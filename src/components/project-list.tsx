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
import { Plus, FolderOpen, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface ProjectListProps {
  onCreateProject: () => void;
}

export function ProjectList({ onCreateProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
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
    <div className="space-y-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer h-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:scale-[1.02] hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-800"
                      style={{ backgroundColor: project.color }}
                    />
                    <CardTitle className="text-xl truncate text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </CardTitle>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-3 text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
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
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
