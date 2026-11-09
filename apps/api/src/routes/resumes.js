import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import pdf from "pdf-parse";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { generateText } from "../services/ai.js";

const router = Router();
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({ destination: uploadDir, filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`) }),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 8) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === "application/pdf")
});

router.get("/", requireAuth, async (req, res, next) => {
  try { const resumes = await prisma.resume.findMany({ where: { userId: req.user.sub }, select: { id: true, fileName: true, summary: true, createdAt: true }, orderBy: { createdAt: "desc" } }); res.json({ resumes }); }
  catch (e) { next(e); }
});
router.post("/upload", requireAuth, upload.single("resume"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: "Upload a PDF resume (maximum 8 MB)." });
  try {
    const parsed = await pdf(fs.readFileSync(req.file.path));
    const extractedText = parsed.text.trim();
    if (extractedText.length < 80) return res.status(422).json({ error: "We couldn't extract enough text. Please upload a text-based PDF." });
    let summary = null;
    try { summary = await generateText({ system: "You are a concise professional CV reviewer. Do not invent experience or qualifications.", prompt: `Summarise this CV in 5 bullets and identify its strongest skills:\n${extractedText.slice(0, 12000)}` }); } catch {}
    const resume = await prisma.resume.create({ data: { userId: req.user.sub, fileName: req.file.originalname, mimeType: req.file.mimetype, extractedText, summary } });
    res.status(201).json({ resume: { id: resume.id, fileName: resume.fileName, summary: resume.summary, createdAt: resume.createdAt } });
  } catch (e) { next(e); }
  finally { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); }
});
export default router;
