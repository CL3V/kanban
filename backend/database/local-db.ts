import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Data directory for local file storage
const DATA_DIR = path.join(process.cwd(), "data");

// Data structure interfaces
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

export interface KanbanColumn {
  id: string;
  board_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description?: string;
  position: number;
  priority: "low" | "medium" | "high";
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Helper functions for file operations
const ensureDataDir = async (): Promise<void> => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

const getFilePath = (collection: string): string => {
  return path.join(DATA_DIR, `${collection}.json`);
};

const readCollection = async <T>(collection: string): Promise<T[]> => {
  try {
    await ensureDataDir();
    const filePath = getFilePath(collection);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
};

const writeCollection = async <T>(
  collection: string,
  data: T[]
): Promise<void> => {
  await ensureDataDir();
  const filePath = getFilePath(collection);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

const findById = async <T extends { id: string }>(
  collection: string,
  id: string
): Promise<T | null> => {
  const items = await readCollection<T>(collection);
  return items.find((item) => item.id === id) || null;
};

const create = async <T extends { id: string }>(
  collection: string,
  item: T
): Promise<T> => {
  const items = await readCollection<T>(collection);
  items.push(item);
  await writeCollection(collection, items);
  return item;
};

const update = async <T extends { id: string }>(
  collection: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> => {
  const items = await readCollection<T>(collection);
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) return null;

  items[index] = { ...items[index], ...updates };
  await writeCollection(collection, items);
  return items[index];
};

const deleteItem = async <T extends { id: string }>(
  collection: string,
  id: string
): Promise<boolean> => {
  const items = await readCollection<T>(collection);
  const initialLength = items.length;
  const filtered = items.filter((item) => item.id !== id);

  if (filtered.length === initialLength) return false;

  await writeCollection(collection, filtered);
  return true;
};

// Database operations
export const initDatabase = async (): Promise<void> => {
  try {
    await ensureDataDir();

    // Create empty collections if they don't exist
    const collections = [
      "projects",
      "boards",
      "columns",
      "tasks",
      "users",
      "project-members",
    ];

    for (const collection of collections) {
      try {
        await readCollection(collection);
      } catch {
        await writeCollection(collection, []);
      }
    }

    console.log("✅ Local file storage initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize local storage:", error);
    throw error;
  }
};

// CRUD operations for each entity
export const projects = {
  async findAll(): Promise<Project[]> {
    return readCollection<Project>("projects");
  },

  async findById(id: string): Promise<Project | null> {
    return findById<Project>("projects", id);
  },

  async create(
    data: Omit<Project, "id" | "created_at" | "updated_at">
  ): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      ...data,
      id: randomUUID(),
      created_at: now,
      updated_at: now,
    };

    return create("projects", project);
  },

  async update(
    id: string,
    data: Partial<Omit<Project, "id" | "created_at">>
  ): Promise<Project | null> {
    return update<Project>("projects", id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<Project>("projects", id);
  },
};

export const boards = {
  async findAll(): Promise<Board[]> {
    return readCollection<Board>("boards");
  },

  async findById(id: string): Promise<Board | null> {
    return findById<Board>("boards", id);
  },

  async findByProjectId(projectId: string): Promise<Board[]> {
    const allBoards = await readCollection<Board>("boards");
    return allBoards.filter((board) => board.project_id === projectId);
  },

  async create(
    data: Omit<Board, "id" | "created_at" | "updated_at">
  ): Promise<Board> {
    const now = new Date().toISOString();
    const board: Board = {
      ...data,
      id: randomUUID(),
      created_at: now,
      updated_at: now,
    };

    return create("boards", board);
  },

  async update(
    id: string,
    data: Partial<Omit<Board, "id" | "created_at">>
  ): Promise<Board | null> {
    return update<Board>("boards", id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<Board>("boards", id);
  },
};

export const columns = {
  async findAll(): Promise<KanbanColumn[]> {
    return readCollection<KanbanColumn>("columns");
  },

  async findById(id: string): Promise<KanbanColumn | null> {
    return findById<KanbanColumn>("columns", id);
  },

  async findByBoardId(boardId: string): Promise<KanbanColumn[]> {
    const allColumns = await readCollection<KanbanColumn>("columns");
    return allColumns
      .filter((column) => column.board_id === boardId)
      .sort((a, b) => a.position - b.position);
  },

  async create(
    data: Omit<KanbanColumn, "id" | "created_at" | "updated_at">
  ): Promise<KanbanColumn> {
    const now = new Date().toISOString();
    const column: KanbanColumn = {
      ...data,
      id: randomUUID(),
      created_at: now,
      updated_at: now,
    };

    return create("columns", column);
  },

  async update(
    id: string,
    data: Partial<Omit<KanbanColumn, "id" | "created_at">>
  ): Promise<KanbanColumn | null> {
    return update<KanbanColumn>("columns", id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<KanbanColumn>("columns", id);
  },
};

export const tasks = {
  async findAll(): Promise<Task[]> {
    return readCollection<Task>("tasks");
  },

  async findById(id: string): Promise<Task | null> {
    return findById<Task>("tasks", id);
  },

  async findByColumnId(columnId: string): Promise<Task[]> {
    const allTasks = await readCollection<Task>("tasks");
    return allTasks
      .filter((task) => task.column_id === columnId)
      .sort((a, b) => a.position - b.position);
  },

  async findByBoardId(boardId: string): Promise<Task[]> {
    const allTasks = await readCollection<Task>("tasks");
    const boardColumns = await columns.findByBoardId(boardId);
    const columnIds = boardColumns.map((col) => col.id);

    return allTasks.filter((task) => columnIds.includes(task.column_id));
  },

  async create(
    data: Omit<Task, "id" | "created_at" | "updated_at">
  ): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      ...data,
      id: randomUUID(),
      created_at: now,
      updated_at: now,
    };

    return create("tasks", task);
  },

  async update(
    id: string,
    data: Partial<Omit<Task, "id" | "created_at">>
  ): Promise<Task | null> {
    return update<Task>("tasks", id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<Task>("tasks", id);
  },
};

export const users = {
  async findAll(): Promise<User[]> {
    return readCollection<User>("users");
  },

  async findById(id: string): Promise<User | null> {
    return findById<User>("users", id);
  },

  async create(
    data: Omit<User, "id" | "created_at" | "updated_at">
  ): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      ...data,
      id: randomUUID(),
      created_at: now,
      updated_at: now,
    };

    return create("users", user);
  },

  async update(
    id: string,
    data: Partial<Omit<User, "id" | "created_at">>
  ): Promise<User | null> {
    return update<User>("users", id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<User>("users", id);
  },
};

export const projectMembers = {
  async findAll(): Promise<ProjectMember[]> {
    return readCollection<ProjectMember>("project-members");
  },

  async findById(id: string): Promise<ProjectMember | null> {
    return findById<ProjectMember>("project-members", id);
  },

  async findByProjectId(projectId: string): Promise<ProjectMember[]> {
    const allMembers = await readCollection<ProjectMember>("project-members");
    return allMembers.filter((member) => member.project_id === projectId);
  },

  async findByUserId(userId: string): Promise<ProjectMember[]> {
    const allMembers = await readCollection<ProjectMember>("project-members");
    return allMembers.filter((member) => member.user_id === userId);
  },

  async create(
    data: Omit<ProjectMember, "id" | "created_at">
  ): Promise<ProjectMember> {
    const member: ProjectMember = {
      ...data,
      id: randomUUID(),
      created_at: new Date().toISOString(),
    };

    return create("project-members", member);
  },

  async delete(id: string): Promise<boolean> {
    return deleteItem<ProjectMember>("project-members", id);
  },
};

// Health check function for the database
export const checkHealth = async (): Promise<{
  status: string;
  message: string;
}> => {
  try {
    await ensureDataDir();

    return {
      status: "connected",
      message: "Local file storage is accessible",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown storage error",
    };
  }
};
