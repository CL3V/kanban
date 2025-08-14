"use client";

import { useState } from "react";
import { ProjectList } from "@/components/project-list";
import { UserList } from "@/components/user-list";
import { CreateProjectModal } from "@/components/create-project-modal";
import { CreateUserModal } from "@/components/create-user-modal";
import { EditProjectModal } from "@/components/edit-project-modal";
import { Project } from "@/types";

export default function Home() {
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateProject = () => {
    setIsCreateProjectModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
  };

  const handleCreateUser = () => {
    setIsCreateUserModalOpen(true);
  };

  const handleProjectCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleProjectUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleUserCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <UserList
          key={`users-${refreshTrigger}`}
          onCreateUser={handleCreateUser}
          refreshTrigger={refreshTrigger}
        />
        <ProjectList
          key={`projects-${refreshTrigger}`}
          onCreateProject={handleCreateProject}
          onEditProject={handleEditProject}
        />
      </div>

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSuccess={handleProjectCreated}
      />

      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={handleProjectUpdated}
          project={editingProject}
        />
      )}

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSuccess={handleUserCreated}
      />
    </div>
  );
}
