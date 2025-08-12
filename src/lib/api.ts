const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Projects
  static async getProjects() {
    return this.request("/projects");
  }

  static async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  static async createProject(data: {
    name: string;
    description?: string;
    color?: string;
  }) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateProject(
    id: string,
    data: { name?: string; description?: string; color?: string }
  ) {
    return this.request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async deleteProject(id: string) {
    return this.request(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  // Boards
  static async getBoards(projectId: string) {
    return this.request(`/boards/project/${projectId}`);
  }

  static async getBoard(id: string) {
    return this.request(`/boards/${id}`);
  }

  static async createBoard(data: {
    project_id: string;
    name: string;
    description?: string;
  }) {
    return this.request("/boards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateBoard(
    id: string,
    data: { name?: string; description?: string }
  ) {
    return this.request(`/boards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async deleteBoard(id: string) {
    return this.request(`/boards/${id}`, {
      method: "DELETE",
    });
  }

  // Tasks
  static async getTasks(boardId: string) {
    return this.request(`/tasks/board/${boardId}`);
  }

  static async getTask(id: string) {
    return this.request(`/tasks/${id}`);
  }

  static async createTask(data: {
    board_id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee?: string;
  }) {
    return this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assignee?: string;
      position?: number;
    }
  ) {
    return this.request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async reorderTasks(
    tasks: { id: string; position: number; status?: string }[]
  ) {
    return this.request("/tasks/reorder/positions", {
      method: "PUT",
      body: JSON.stringify({ tasks }),
    });
  }

  static async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, {
      method: "DELETE",
    });
  }
}
