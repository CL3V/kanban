export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  board_id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "in-review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface CreateBoardRequest {
  project_id: string;
  name: string;
  description?: string;
}

export interface CreateTaskRequest {
  board_id: string;
  title: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  assignee?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  position?: number;
}
