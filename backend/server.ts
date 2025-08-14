import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase, checkHealth } from "./database/s3-db";
import projectRoutes from "./routes/projects";
import boardRoutes from "./routes/boards";
import taskRoutes from "./routes/tasks";
import columnRoutes from "./routes/columns";
import memberRoutes from "./routes/members";

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
// Configurable CORS: allow explicit list from ALLOWED_ORIGINS, else fall back to dev defaults
const DEFAULT_DEV_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowList = ALLOWED_ORIGINS.length
        ? ALLOWED_ORIGINS
        : DEFAULT_DEV_ORIGINS;
      if (!origin) return callback(null, true); // server-to-server or curl
      if (allowList.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Initialize database
const startServer = async () => {
  try {
    console.log("Attempting to initialize database...");
    await initDatabase();
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error(
      "⚠️ Database initialization failed, but server will still start:",
      (error as Error).message
    );
    console.log("📝 The server will start without database connectivity");
    console.log("🔧 Please check your AWS DSQL credentials and connection");
  }

  // Simple test endpoint
  app.get("/test", (req, res) => {
    console.log("Test endpoint hit!");
    res.send("Server is working!");
  });

  // Routes (always register, even if DB fails)
  app.use("/api/projects", projectRoutes);
  app.use("/api/boards", boardRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/columns", columnRoutes);
  app.use("/api/members", memberRoutes);
  app.use("/api/users", memberRoutes); // Users are handled in members route

  // Health check
  app.get("/api/health", (req, res) => {
    console.log("Health check endpoint hit");
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Database status check
  app.get("/api/db-status", async (req, res) => {
    console.log("Database status endpoint hit");
    try {
      const healthCheck = await checkHealth();
      res.json({
        status:
          healthCheck.status === "connected" ? "Connected" : "Disconnected",
        database: "Local File Storage",
        message: healthCheck.message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.json({
        status: "Disconnected",
        database: "Local File Storage",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  const port = Number(PORT);
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`🌐 Frontend should connect from http://localhost:3002`);

    // Test if server is actually listening
    const address = server.address();
    console.log("Server address:", address);
    console.log("Server listening:", server.listening);
  });

  // Keep the process alive
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
    });
  });

  return server;
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

export default app;
