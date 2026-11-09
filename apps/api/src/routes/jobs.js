import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { scoreJob } from "../services/ai.js";

const router = Router();

// Live job search is proxied through the API so Adzuna credentials never reach the browser.
router.get("/live", requireAuth, async (req, res, next) => {
  try {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
      return res.status(503).json({ error: "Adzuna is not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to apps/api/.env." });
    }

    const what = String(req.query.q || "").trim().slice(0, 100);
    const where = String(req.query.location || "").trim().slice(0, 100);
    const employment = String(req.query.employment || "").trim();
    if (!what && !where) {
      return res.status(400).json({ error: "Enter a job title/keyword or a UK location to search live jobs." });
    }

    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "20",
      "content-type": "application/json",
      sort_by: "date"
    });
    if (what) params.set("what", what);
    if (where) params.set("where", where);
    if (employment === "full_time") params.set("full_time", "1");
    if (employment === "part_time") params.set("part_time", "1");

    const endpoint = `https://api.adzuna.com/v1/api/jobs/gb/search/1?${params.toString()}`;
    const response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) {
      const message = response.status === 429
        ? "Adzuna rate limit reached. Please wait before trying again."
        : `Adzuna could not complete the search (HTTP ${response.status}). Check your API access and try again.`;
      return res.status(response.status === 429 ? 429 : 502).json({ error: message });
    }

    const payload = await response.json();
    const resume = await prisma.resume.findFirst({ where: { userId: req.user.sub }, orderBy: { createdAt: "desc" } });
    const formatSalary = (min, max) => {
      if (min == null && max == null) return null;
      const money = value => `£${Number(value).toLocaleString("en-GB")}`;
      if (min != null && max != null) return `${money(min)}–${money(max)} per year`;
      return `${money(min ?? max)} per year`;
    };
    const jobs = (payload.results || []).map(ad => {
      const job = {
        id: `adzuna-${ad.id}`,
        externalId: String(ad.id),
        source: "Adzuna",
        title: ad.title || "Untitled role",
        company: ad.company?.display_name || "Company not listed",
        location: ad.location?.display_name || "United Kingdom",
        description: ad.description || "No description provided by the advertiser.",
        sourceUrl: ad.redirect_url || null,
        salary: formatSalary(ad.salary_min, ad.salary_max),
        employment: ad.contract_time === "part_time" ? "Part-time" : ad.contract_time === "full_time" ? "Full-time" : ad.contract_type || "Not specified",
        remote: false,
        skills: [],
        createdAt: ad.created || null
      };
      return { ...job, match: resume ? scoreJob(resume.extractedText, job) : null };
    });

    res.json({ jobs, count: jobs.length, total: payload.count ?? jobs.length, source: "Adzuna" });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return res.status(504).json({ error: "Adzuna search timed out. Please try again." });
    }
    next(error);
  }
});
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const location = (req.query.location || "").trim();
    const jobs = await prisma.job.findMany({
      where: { AND: [
        q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { company: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {},
        location ? { location: { contains: location, mode: "insensitive" } } : {}
      ] },
      orderBy: { createdAt: "desc" }, take: 100
    });
    const resume = await prisma.resume.findFirst({ where: { userId: req.user.sub }, orderBy: { createdAt: "desc" } });
    res.json({ jobs: jobs.map(j => ({ ...j, match: resume ? scoreJob(resume.extractedText, j) : null })) });
  } catch (e) { next(e); }
});
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, company, location, description, sourceUrl, salary, skills = [], remote = false } = req.body;
    if (![title, company, location, description].every(v => typeof v === "string" && v.trim())) return res.status(400).json({ error: "Title, company, location and description are required." });
    const job = await prisma.job.create({ data: { title, company, location, description, sourceUrl, salary, skills, remote, source: "User added" } });
    res.status(201).json({ job });
  } catch (e) { next(e); }
});
export default router;
