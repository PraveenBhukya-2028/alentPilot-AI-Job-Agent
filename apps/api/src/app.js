import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import auth from "./routes/auth.js";
import jobs from "./routes/jobs.js";
import applications from "./routes/applications.js";
import resumes from "./routes/resumes.js";
import ai from "./routes/ai.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(",") || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "ai-job-agent-api", timestamp: new Date().toISOString() }));
app.use("/api/auth", auth);
app.use("/api/jobs", jobs);
app.use("/api/applications", applications);
app.use("/api/resumes", resumes);
app.use("/api/ai", ai);
app.use((err, _req, res, _next) => {
  if (err.name === "ZodError") return res.status(400).json({ error: "Please check the submitted information.", details: err.issues });
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});
export default app;
