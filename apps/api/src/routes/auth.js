import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const credentials = z.object({ name: z.string().min(2).max(80).optional(), email: z.string().email(), password: z.string().min(8).max(100) });
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, location: u.location, headline: u.headline, skills: u.skills });
const sign = u => jwt.sign({ sub: u.id, email: u.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

router.post("/register", async (req, res, next) => {
  try {
    const data = credentials.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: "An account with this email already exists." });
    const user = await prisma.user.create({ data: { name: data.name || data.email.split("@")[0], email: data.email.toLowerCase(), passwordHash: await bcrypt.hash(data.password, 12) } });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = credentials.pick({ email: true, password: true }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) return res.status(401).json({ error: "Email or password is incorrect." });
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try { const user = await prisma.user.findUnique({ where: { id: req.user.sub } }); res.json({ user: publicUser(user) }); }
  catch (e) { next(e); }
});

export default router;
