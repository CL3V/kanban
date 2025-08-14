import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProjectMembers } from "@/components/project-members";

type MembersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectMembersPage({ params }: MembersPageProps) {
  const { id: projectId } = await params;

  return (
    <div className="min-h-[calc(100vh-64px)] py-6">
      <div className="mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Project Members
          </h1>
          <Link href={`/projects/${projectId}`}>
            <Button variant="outline" size="sm">
              Back to Project
            </Button>
          </Link>
        </div>
        <ProjectMembers projectId={projectId} />
      </div>
    </div>
  );
}
