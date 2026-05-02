import dotenv from "dotenv";

// Load environment variables FIRST, before any other imports
dotenv.config();

import path from "path";
import express from "express";
import cors from "cors";
import multer from "multer";
import eventDetailsRoutes from "./routes/eventDetailsRoutes.js";
import ideaDetailsRoutes from "./routes/ideaDetailsRoutes.js";
import prototypeDetailsRoutes from "./routes/prototypeDetailsRoutes.js";
import businessDetailsRoutes from "./routes/businessDetailsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { runMigrations } from "./utils/runMigrations.js";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_request, response) => {
  response.send("Event details backend is running.");
});

app.use("/api/auth", authRoutes);
app.use("/api/event-details", eventDetailsRoutes);
app.use("/api/idea-details", ideaDetailsRoutes);
app.use("/api/prototype-details", prototypeDetailsRoutes);
app.use("/api/business-details", businessDetailsRoutes);

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    response.status(400).json({ message: error.message });
    return;
  }

  response.status(500).json({ message: error.message || "Internal server error" });
});

const startServer = async () => {
  await runMigrations();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
