import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./database/db";
import projectRoutes from "./routes/projects";
import boardRoutes from "./routes/boards";
import taskRoutes from "./routes/tasks";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
