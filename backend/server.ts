import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./database/postgres-db";
import projectRoutes from "./routes/projects";
import boardRoutes from "./routes/boards";
import taskRoutes from "./routes/tasks";
import columnRoutes from "./routes/columns";
import memberRoutes from "./routes/members";

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ], // Allow dev ports
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

  // Routes (always register, even if DB fails)
  app.use("/api/projects", projectRoutes);
  app.use("/api/boards", boardRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/columns", columnRoutes);
  app.use("/api/members", memberRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Database status check
  app.get("/api/db-status", async (req, res) => {
    try {
      const { query } = await import("./database/postgres-db");
      await query("SELECT 1");
      res.json({
        status: "Connected",
        database: "AWS DSQL",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.json({
        status: "Disconnected",
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`🌐 Frontend should connect from http://localhost:3002`);
  });
};

startServer();

export default app;
