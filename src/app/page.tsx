"use client";

import { useState } from "react";
import { ProjectList } from "@/components/project-list";
import { CreateProjectModal } from "@/components/create-project-modal";

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleProjectCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProjectList key={refreshTrigger} onCreateProject={handleCreateProject} />
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}
