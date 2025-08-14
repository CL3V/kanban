import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config();

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "kanban-app-data";
const DATA_PREFIX = "kanban-data/";

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
  position: number;
  priority: "low" | "medium" | "high" | "urgent";
  assignee_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

// Helper functions for S3 operations
const getObjectKey = (collection: string, id?: string): string => {
  return id
    ? `${DATA_PREFIX}${collection}/${id}.json`
    : `${DATA_PREFIX}${collection}/`;
};

const getObjectFromS3 = async <T>(
  collection: string,
  id: string
): Promise<T | null> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: getObjectKey(collection, id),
    });

    const response = await s3Client.send(command);
    if (!response.Body) return null;

    const bodyString = await response.Body.transformToString();
    return JSON.parse(bodyString) as T;
  } catch (error: any) {
    if (error.name === "NoSuchKey") return null;
    throw error;
  }
};

const putObjectToS3 = async <T>(
  collection: string,
  id: string,
  data: T
): Promise<void> => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: getObjectKey(collection, id),
    Body: JSON.stringify(data, null, 2),
    ContentType: "application/json",
  });

  await s3Client.send(command);
};

const listObjectsFromS3 = async <T>(collection: string): Promise<T[]> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: getObjectKey(collection),
    });

    const response = await s3Client.send(command);
    if (!response.Contents) return [];

    const objects: T[] = [];
    for (const obj of response.Contents) {
      if (obj.Key && obj.Key.endsWith(".json")) {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: obj.Key,
        });

        const objResponse = await s3Client.send(getCommand);
        if (objResponse.Body) {
          const bodyString = await objResponse.Body.transformToString();
          objects.push(JSON.parse(bodyString));
        }
      }
    }

    return objects;
  } catch (error) {
    console.error(`Error listing objects from ${collection}:`, error);
    return [];
  }
};

const deleteObjectFromS3 = async (
  collection: string,
  id: string
): Promise<void> => {
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: getObjectKey(collection, id),
  });

  await s3Client.send(command);
};

// Database operations
export const initDatabase = async (): Promise<void> => {
  try {
    // Check if we can access the S3 bucket
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${DATA_PREFIX}health-check.json`,
    });

    try {
      await s3Client.send(command);
    } catch (error: any) {
      if (error.name === "NotFound" || error.name === "NoSuchKey") {
        // Create a health check file
        await putObjectToS3("", "health-check", {
          status: "healthy",
          initialized_at: new Date().toISOString(),
        });
      } else {
        throw error;
      }
    }

    console.log("✅ S3 storage initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize S3 storage:", error);
    throw error;
  }
};

// CRUD operations for each entity
export const projects = {
  async findAll(): Promise<Project[]> {
    return listObjectsFromS3<Project>("projects");
  },

  async findById(id: string): Promise<Project | null> {
    return getObjectFromS3<Project>("projects", id);
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

    await putObjectToS3("projects", project.id, project);
    return project;
  },

  async update(
    id: string,
    data: Partial<Omit<Project, "id" | "created_at">>
  ): Promise<Project | null> {
    const existing = await getObjectFromS3<Project>("projects", id);
    if (!existing) return null;

    const updated: Project = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    await putObjectToS3("projects", id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const existing = await getObjectFromS3<Project>("projects", id);
      if (!existing) return false;

      await deleteObjectFromS3("projects", id);
      return true;
    } catch (error) {
      return false;
    }
  },
};

export const boards = {
  async findAll(): Promise<Board[]> {
    return listObjectsFromS3<Board>("boards");
  },

  async findById(id: string): Promise<Board | null> {
    return getObjectFromS3<Board>("boards", id);
  },

  async findByProjectId(projectId: string): Promise<Board[]> {
    const allBoards = await listObjectsFromS3<Board>("boards");
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

    await putObjectToS3("boards", board.id, board);
    return board;
  },

  async update(
    id: string,
    data: Partial<Omit<Board, "id" | "created_at">>
  ): Promise<Board | null> {
    const existing = await getObjectFromS3<Board>("boards", id);
    if (!existing) return null;

    const updated: Board = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    await putObjectToS3("boards", id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const existing = await getObjectFromS3<Board>("boards", id);
      if (!existing) return false;

      await deleteObjectFromS3("boards", id);
      return true;
    } catch (error) {
      return false;
    }
  },
};

export const columns = {
  async findAll(): Promise<KanbanColumn[]> {
    return listObjectsFromS3<KanbanColumn>("columns");
  },

  async findById(id: string): Promise<KanbanColumn | null> {
    return getObjectFromS3<KanbanColumn>("columns", id);
  },

  async findByBoardId(boardId: string): Promise<KanbanColumn[]> {
    const allColumns = await listObjectsFromS3<KanbanColumn>("columns");
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

    await putObjectToS3("columns", column.id, column);
    return column;
  },

  async update(
    id: string,
    data: Partial<Omit<KanbanColumn, "id" | "created_at">>
  ): Promise<KanbanColumn | null> {
    const existing = await getObjectFromS3<KanbanColumn>("columns", id);
    if (!existing) return null;

    const updated: KanbanColumn = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    await putObjectToS3("columns", id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const existing = await getObjectFromS3<KanbanColumn>("columns", id);
      if (!existing) return false;

      await deleteObjectFromS3("columns", id);
      return true;
    } catch (error) {
      return false;
    }
  },
};

export const tasks = {
  async findAll(): Promise<Task[]> {
    return listObjectsFromS3<Task>("tasks");
  },

  async findById(id: string): Promise<Task | null> {
    return getObjectFromS3<Task>("tasks", id);
  },

  async findByColumnId(columnId: string): Promise<Task[]> {
    const allTasks = await listObjectsFromS3<Task>("tasks");
    return allTasks
      .filter((task) => task.column_id === columnId)
      .sort((a, b) => a.position - b.position);
  },

  async findByBoardId(boardId: string): Promise<Task[]> {
    const allTasks = await listObjectsFromS3<Task>("tasks");
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

    await putObjectToS3("tasks", task.id, task);
    return task;
  },

  async update(
    id: string,
    data: Partial<Omit<Task, "id" | "created_at">>
  ): Promise<Task | null> {
    const existing = await getObjectFromS3<Task>("tasks", id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    await putObjectToS3("tasks", id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const existing = await getObjectFromS3<Task>("tasks", id);
      if (!existing) return false;

      await deleteObjectFromS3("tasks", id);
      return true;
    } catch (error) {
      return false;
    }
  },
};

export const users = {
  async findAll(): Promise<User[]> {
    return listObjectsFromS3<User>("users");
  },

  async findById(id: string): Promise<User | null> {
    return getObjectFromS3<User>("users", id);
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

    await putObjectToS3("users", user.id, user);
    return user;
  },

  async update(
    id: string,
    data: Partial<Omit<User, "id" | "created_at">>
  ): Promise<User | null> {
    const existing = await getObjectFromS3<User>("users", id);
    if (!existing) return null;

    const updated: User = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    await putObjectToS3("users", id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const existing = await getObjectFromS3<User>("users", id);
      if (!existing) return false;

      await deleteObjectFromS3("users", id);
      return true;
    } catch (error) {
      return false;
    }
  },
};

export const projectMembers = {
  async findAll(): Promise<ProjectMember[]> {
    return listObjectsFromS3<ProjectMember>("project-members");
  },

  async findById(id: string): Promise<ProjectMember | null> {
    return getObjectFromS3<ProjectMember>("project-members", id);
  },

  async findByProjectId(projectId: string): Promise<ProjectMember[]> {
    const allMembers = await listObjectsFromS3<ProjectMember>(
      "project-members"
    );
    return allMembers.filter((member) => member.project_id === projectId);
  },

  async findByUserId(userId: string): Promise<ProjectMember[]> {
    const allMembers = await listObjectsFromS3<ProjectMember>(
      "project-members"
    );
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

    await putObjectToS3("project-members", member.id, member);
    return member;
  },

  async update(
    id: string,
    data: Partial<Omit<ProjectMember, "id" | "created_at">>
  ): Promise<ProjectMember | null> {
    const existing = await getObjectFromS3<ProjectMember>(
      "project-members",
      id
    );
    if (!existing) return null;
    const updated: ProjectMember = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    await putObjectToS3("project-members", id, updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    try {
      const existing = await getObjectFromS3<ProjectMember>(
        "project-members",
        id
      );
      if (!existing) return false;

      await deleteObjectFromS3("project-members", id);
      return true;
    } catch (error) {
      return false;
    }
  },
};

// Health check function for the database
export const checkHealth = async (): Promise<{
  status: string;
  message: string;
}> => {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${DATA_PREFIX}health-check.json`,
      })
    );

    return {
      status: "connected",
      message: "S3 storage is accessible",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown S3 error",
    };
  }
};
