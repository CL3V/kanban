export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
  updated_at: string;
}

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

export interface Column {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignee_id?: string;
  position: number;
  dueDate?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  avatar?: string;
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
  column_id?: string;
  title: string;
  description?: string;
  priority?: Task["priority"];
  assignee_id?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  position?: number;
}

export interface DraggedTask {
  id: string;
  position: number;
  column_id: string;
}

export interface CreateColumnRequest {
  board_id: string;
  name: string;
  color?: string;
}
