import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const statuses = ["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];
router.get("/", requireAuth, async (req, res, next) => {
  try { const applications = await prisma.application.findMany({ where: { userId: req.user.sub }, include: { job: true }, orderBy: { updatedAt: "desc" } }); res.json({ applications }); }
  catch (e) { next(e); }
});
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = z.object({ jobId: z.string().optional(), company: z.string().min(1), role: z.string().min(1), status: z.enum(statuses).default("SAVED"), notes: z.string().optional(), matchScore: z.number().int().min(0).max(100).optional() }).parse(req.body);
    const application = await prisma.application.create({ data: { ...data, userId: req.user.sub, appliedAt: data.status === "APPLIED" ? new Date() : null } });
    res.status(201).json({ application });
  } catch (e) { next(e); }
});
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const data = z.object({ status: z.enum(statuses).optional(), notes: z.string().optional(), nextStep: z.string().optional() }).parse(req.body);
    const result = await prisma.application.updateMany({ where: { id: req.params.id, userId: req.user.sub }, data: { ...data, ...(data.status === "APPLIED" ? { appliedAt: new Date() } : {}) } });
    if (!result.count) return res.status(404).json({ error: "Application not found." });
    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    res.json({ application });
  } catch (e) { next(e); }
});
router.delete("/:id", requireAuth, async (req, res, next) => {
  try { const result = await prisma.application.deleteMany({ where: { id: req.params.id, userId: req.user.sub } }); if (!result.count) return res.status(404).json({ error: "Application not found." }); res.status(204).end(); }
  catch (e) { next(e); }
});
export default router;
