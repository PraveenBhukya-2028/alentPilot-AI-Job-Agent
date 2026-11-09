import OpenAI from "openai";

const client = () => process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export function scoreJob(resumeText, job) {
  const resume = (resumeText || "").toLowerCase();
  const terms = [...new Set([...(job.skills || []), ...job.title.toLowerCase().split(/\W+/)])].filter(Boolean);
  const matched = terms.filter(t => resume.includes(t.toLowerCase()));
  const score = terms.length ? Math.round((matched.length / terms.length) * 100) : 0;
  return { score, matched, missing: terms.filter(t => !matched.includes(t)) };
}

export async function generateText({ system, prompt }) {
  const ai = client();
  if (!ai) return null;
  const result = await ai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0.4,
    messages: [{ role: "system", content: system }, { role: "user", content: prompt }]
  });
  return result.choices[0]?.message?.content || "";
}
