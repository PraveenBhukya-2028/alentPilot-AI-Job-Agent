import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { generateText, scoreJob } from "../services/ai.js";

const router = Router();

function buildInterviewFallback(role, level) {
  const r = role.toLowerCase();
  const frontend = /front.?end|react|javascript|typescript|ui|web developer/.test(r);
  const data = /data|analyst|sql|python|machine learning/.test(r);
  const backend = /back.?end|node|api|software engineer|full.?stack/.test(r);
  const domain = frontend ? [
    ["How does React reconciliation work, and why are stable keys important?", "Explain rendering, keys, component identity, and a practical bug caused by unstable keys."],
    ["How would you improve the performance of a slow React page?", "Describe profiling first, then render reduction, memoisation where justified, code splitting, list virtualisation, and measurement."],
    ["How do you manage server state versus local UI state?", "Compare a query/cache approach with component state or context; cover loading, errors, invalidation, and ownership."],
    ["How would you make a form accessible and robust?", "Cover semantic labels, keyboard use, validation, focus management, error messages, and automated/manual testing."],
    ["A page works locally but fails after deployment. How would you investigate?", "Check reproduction, environment variables, network/console errors, build configuration, API/CORS, and rollback/monitoring."],
    ["A product designer requests a complex interaction with an unclear specification. What do you do?", "Clarify user outcome, edge cases, accessibility, agree acceptance criteria, prototype, and communicate trade-offs."],
    ["Tell me about a time you received difficult feedback.", "Use STAR; explain the feedback, your response, concrete change, and outcome without blaming others."],
    ["How do you balance delivery speed with code quality?", "Discuss prioritisation, small increments, tests for risk, review, technical debt visibility, and stakeholder communication."]
  ] : data ? [
    ["How would you investigate a SQL query that suddenly became slow?", "Use execution plans, indexes, row counts, joins, statistics, and before/after measurements."],
    ["How do you handle missing, duplicate, or inconsistent data?", "Explain profiling, business rules, documented cleaning, validation checks, and preserving raw data."],
    ["What is the difference between an inner join and a left join?", "Explain row retention and give an example where unmatched records matter."],
    ["How would you explain a confidence interval to a non-technical stakeholder?", "Explain uncertainty and interpretation in plain language; avoid claiming it is a probability for a fixed parameter."],
    ["A dashboard metric drops sharply overnight. What steps do you take?", "Validate source freshness, pipeline changes, definitions, segmentation, and communicate confirmed findings."],
    ["Two teams define the same KPI differently. How would you resolve it?", "Agree a business definition, owner, grain, filters, source of truth, and document/version it."],
    ["Tell me about a time your analysis changed a decision.", "Use STAR and quantify impact only where evidence supports it."],
    ["How do you prioritise multiple urgent data requests?", "Assess impact, deadline, effort, dependencies, and agree priorities transparently."]
  ] : [
    ["Describe the architecture of a recent application or system you worked on.", "Explain components, data flow, key decisions, trade-offs, and your personal contribution."],
    ["How do you design and validate a reliable REST API?", "Cover resource design, validation, status codes, auth, pagination, errors, and tests."],
    ["How would you diagnose a production performance issue?", "Establish impact, inspect metrics/logs/traces, isolate bottlenecks, mitigate, then prevent recurrence."],
    ["How do you approach automated testing for a new feature?", "Choose unit/integration/end-to-end boundaries, test critical paths and failure cases, and keep tests deterministic."],
    ["A dependent service becomes unavailable during a key workflow. What do you do?", "Discuss timeouts, retries with backoff, idempotency, graceful degradation, alerting, and user communication."],
    ["A teammate proposes an approach you disagree with. How do you handle it?", "Compare evidence and trade-offs, invite discussion, document the decision, and commit once agreed."],
    ["Tell me about a project that did not go as planned.", "Use STAR; own your part, explain recovery, lessons, and what changed afterwards."],
    ["How do you estimate and communicate delivery risks?", "Break work down, state assumptions/dependencies, provide ranges, surface risks early, and update stakeholders."]
  ];
  const levelNote = level === "Junior" ? "For a junior-level answer, focus on fundamentals, a clear example, and what you learned." : level === "Senior" ? "For a senior-level answer, include architecture, trade-offs, mentoring, ownership, and measurable outcomes." : "For a mid-level answer, show independent delivery, sound trade-offs, testing, and collaboration.";
  return `Practice set for: ${role} (${level})\n\n${domain.map((q, i) => `${i + 1}. ${q[0]}\n   Strong answer should cover: ${q[1]}`).join("\n\n")}\n\nPreparation tip: ${levelNote}\n\nNote: These are locally generated practice prompts, not AI-generated or an assessment of your answers.`;
}

const SKILL_TERMS = [
  "react", "next.js", "javascript", "typescript", "redux", "html", "css", "bootstrap",
  "node.js", "express", "mongodb", "mysql", "postgresql", "sql", "python", "pandas",
  "pyspark", "snowflake", "dbt", "power bi", "rest api", "graphql", "git", "webpack",
  "microfrontend", "module federation", "jest", "vitest", "cypress", "playwright",
  "accessibility", "a11y", "docker", "aws", "azure", "agile", "figma"
];

function buildTailorFallback(resumeText, jobDescription) {
  const cv = (resumeText || "").replace(/\s+/g, " ").trim();
  const jd = (jobDescription || "").replace(/\s+/g, " ").trim();
  const cvLower = cv.toLowerCase();
  const jdLower = jd.toLowerCase();

  const requiredSkills = SKILL_TERMS.filter(term => jdLower.includes(term));
  const matched = requiredSkills.filter(term => cvLower.includes(term));
  const missing = requiredSkills.filter(term => !matched.includes(term));
  const score = requiredSkills.length
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : null;

  const sentences = cv.split(/(?<=[.!?])\s+/).filter(Boolean);
  const evidence = matched
    .map(skill => {
      const sentence = sentences.find(s => s.toLowerCase().includes(skill));
      return sentence ? `- ${skill}: ${sentence.slice(0, 260)}` : `- ${skill}: listed in the CV text`;
    })
    .slice(0, 6);

  const roleWords = [...new Set((jdLower.match(/[a-z][a-z+#.]{3,}/g) || []))]
    .filter(w => !["with", "from", "that", "this", "will", "have", "your", "work", "team", "role", "using", "their", "about", "experience", "skills", "strong", "ability", "years"].includes(w));
  const missingTerms = missing.length ? missing.join(", ") : "No missing items found in the built-in skill list.";
  const skillScoreLine = score === null
    ? "A numeric skills score was not calculated because the job text did not contain recognised skills from the built-in list."
    : `Recognised-skill overlap: ${score}% (${matched.length} of ${requiredSkills.length} recognised job skills found in the CV text).`;

  return [
    "FREE CV-TO-JOB REVIEW (rule-based, not generative AI)",
    "",
    "1) Match summary",
    skillScoreLine,
    "This is a simple text comparison, not a hiring prediction or a full assessment of your experience.",
    "",
    "2) Relevant skills found in your CV",
    matched.length ? matched.join(", ") : "No recognised matching skills were found automatically. Review your CV wording and the job description manually.",
    "",
    "Evidence from your CV:",
    evidence.length ? evidence.join("\n") : "- No matching evidence sentence could be extracted.",
    "",
    "3) Potential gaps to review",
    missingTerms,
    "A missing keyword does not prove you lack the skill; it may simply be absent or phrased differently in your CV.",
    "",
    "4) Truthful CV improvement suggestions",
    "- Reorder your existing experience bullets so the most relevant, evidenced work appears first.",
    "- Where accurate, add the project context, your personal contribution, the tools used, and the outcome.",
    "- Use the exact technology terminology from the job description only when it genuinely describes your experience.",
    "- Do not add a skill, employer, qualification, date, or measurable result unless it is true and you can explain it.",
    "",
    "5) Interview topics to prepare",
    (matched.length ? matched : roleWords.slice(0, 5)).slice(0, 6).map((s, i) => `${i + 1}. Prepare a real project example involving ${s}. Explain the problem, your contribution, trade-offs, testing, and outcome.`).join("\n") || "Prepare examples covering the role's core responsibilities, collaboration, problem-solving, and learning.",
    "",
    "How this review was produced: local keyword matching only. No CV content was sent to an external AI service."
  ].join("\n");
}

router.post("/match/:jobId", requireAuth, async (req, res, next) => {
  try {
    const [job, resume] = await Promise.all([
      prisma.job.findUnique({ where: { id: req.params.jobId } }),
      prisma.resume.findFirst({ where: { userId: req.user.sub }, orderBy: { createdAt: "desc" } })
    ]);
    if (!job) return res.status(404).json({ error: "Job not found." });
    if (!resume) return res.status(400).json({ error: "Upload your CV first to calculate a match." });
    const match = scoreJob(resume.extractedText, job);
    res.json({ match, method: "transparent keyword overlap baseline" });
  } catch (e) { next(e); }
});
router.post("/tailor", requireAuth, async (req, res, next) => {
  try {
    const { jobDescription } = z.object({ jobDescription: z.string().min(50).max(12000) }).parse(req.body);
    const resume = await prisma.resume.findFirst({ where: { userId: req.user.sub }, orderBy: { createdAt: "desc" } });
    if (!resume) return res.status(400).json({ error: "Upload your CV first." });
    const result = await generateText({
      system: "You are an ethical UK CV coach. Never fabricate employers, dates, skills, metrics or qualifications. Clearly label suggestions and preserve factual accuracy.",
      prompt: `Analyse the match between this CV and job description. Return: 1) match summary, 2) relevant existing skills, 3) gaps, 4) suggested truthful CV bullet improvements, 5) interview topics. Do not write fabricated claims.\n\nCV:\n${resume.extractedText.slice(0, 10000)}\n\nJOB:\n${jobDescription}`
    });
    if (!result) {
      return res.json({
        result: buildTailorFallback(resume.extractedText, jobDescription),
        configured: false,
        source: "built-in-rule-based-review"
      });
    }
    res.json({ result, configured: true, source: "openai" });
  } catch (e) { next(e); }
});
router.post("/interview", requireAuth, async (req, res, next) => {
  try {
    const { role, level } = z.object({ role: z.string().min(2).max(120), level: z.string().default("Mid-level") }).parse(req.body);
    const result = await generateText({ system: "You are a supportive technical interview coach. Provide practical questions and concise evaluation criteria.", prompt: `Create 8 interview questions for a ${level} ${role} candidate. Include technical, practical scenario and behavioural questions. Add what a strong answer should cover.` });
    if (result) return res.json({ result, configured: true, source: "openai" });
    res.json({ result: buildInterviewFallback(role, level), configured: false, source: "built-in-question-bank" });
  } catch (e) { next(e); }
});
export default router;