// If pointing to an external backend (e.g., http://localhost:3001),
// append "/api" to match backend route prefix. Otherwise default to Next.js local "/api".
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api`
  : "/api";
const IS_EXTERNAL_API = /^https?:\/\//i.test(API_BASE_URL);

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

    // Normalize empty responses (e.g., 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    // Some backends may send no body with 200; guard JSON parse
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
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
    return this.request(`/projects/${projectId}/boards`);
  }

  static async getBoard(id: string) {
    return this.request(`/boards/${id}`);
  }

  static async createBoard(data: {
    project_id: string;
    name: string;
    description?: string;
  }) {
    // Backend expects POST /boards with body containing project_id
    return this.request(`/boards`, {
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
    return this.request(`/boards/${boardId}/tasks`);
  }

  static async getTask(id: string) {
    return this.request(`/tasks/${id}`);
  }

  static async createTask(data: {
    board_id: string;
    column_id?: string;
    title: string;
    description?: string;
    priority?: string;
    assignee_id?: string;
  }) {
    // Backend accepts task creation at POST /tasks (not under /boards/:id)
    return this.request(`/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      column_id?: string;
      priority?: string;
      assignee_id?: string;
      position?: number;
    }
  ) {
    return this.request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, {
      method: "DELETE",
    });
  }

  // Users
  static async getUsers() {
    return this.request("/users");
  }

  static async createUser(data: {
    name: string;
    email: string;
    avatar?: string;
  }) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Project Members
  static async getProjectMembers(projectId: string) {
    // Backend route: GET /api/members/project/:projectId
    return this.request(`/members/project/${projectId}`);
  }

  static async addProjectMember(
    projectId: string,
    data: {
      user_id: string;
      role?: string;
    }
  ) {
    // Backend route: POST /api/members/project/:projectId with { userId, role }
    const payload = { userId: data.user_id, role: data.role };
    return this.request(`/members/project/${projectId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async removeProjectMember(projectId: string, userId: string) {
    // Backend route: DELETE /api/members/project/:projectId/user/:userId
    return this.request(`/members/project/${projectId}/user/${userId}`, {
      method: "DELETE",
    });
  }

  // Columns
  static async getColumns(boardId: string) {
    return this.request(`/columns/board/${boardId}`);
  }

  static async createColumn(data: {
    board_id: string;
    name: string;
    color?: string;
  }) {
    return this.request("/columns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateColumn(
    id: string,
    data: {
      name?: string;
      color?: string;
      position?: number;
    }
  ) {
    // When using Next.js local API, the proxy expects an id query param
    const endpoint = IS_EXTERNAL_API ? `/columns/${id}` : `/columns?id=${id}`;
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async deleteColumn(id: string) {
    // Use path param when talking to backend directly; query when using Next proxy
    const endpoint = IS_EXTERNAL_API ? `/columns/${id}` : `/columns?id=${id}`;
    return this.request(endpoint, {
      method: "DELETE",
    });
  }
}
