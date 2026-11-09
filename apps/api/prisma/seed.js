import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const jobs = [
  { title: "Frontend Engineer (React)", company: "Northstar Digital", location: "London, UK", employment: "Full-time", remote: true, salary: "£45,000–£55,000", source: "Demo data", skills: ["React", "TypeScript", "JavaScript", "Testing"], description: "Build accessible, high-performance React and TypeScript interfaces. Work with product and design teams, integrate REST APIs, write unit tests and improve frontend performance." },
  { title: "React Developer", company: "Finbridge", location: "Canary Wharf, London", employment: "Full-time", remote: false, salary: "£42,000–£52,000", source: "Demo data", skills: ["React", "Redux", "CSS", "REST APIs"], description: "Develop customer-facing financial products using React, Redux and modern CSS. Collaborate in an agile team and contribute to code reviews and automated testing." },
  { title: "Full Stack JavaScript Engineer", company: "Cedar Labs", location: "Hybrid · London", employment: "Full-time", remote: true, salary: "£50,000–£62,000", source: "Demo data", skills: ["Next.js", "Node.js", "PostgreSQL", "TypeScript"], description: "Deliver end-to-end product features with Next.js, Node.js and PostgreSQL. Design APIs, build reusable components and monitor production quality." },
  { title: "Junior Data Analyst", company: "Bright Metrics", location: "London, UK", employment: "Full-time", remote: false, salary: "£30,000–£36,000", source: "Demo data", skills: ["SQL", "Python", "Pandas", "Power BI"], description: "Transform data into insights using SQL and Python. Prepare datasets, validate metrics and communicate findings to stakeholders." },
  { title: "AI Product Engineer", company: "Orbit Works", location: "Remote · UK", employment: "Full-time", remote: true, salary: "£48,000–£60,000", source: "Demo data", skills: ["TypeScript", "OpenAI API", "React", "Node.js"], description: "Build AI-assisted product experiences, integrate LLM APIs safely, evaluate output quality and create reliable React interfaces." }
];

for (const job of jobs) {
  await prisma.job.upsert({
    where: { id: `demo-${job.company.toLowerCase().replaceAll(" ", "-")}` },
    update: job,
    create: { id: `demo-${job.company.toLowerCase().replaceAll(" ", "-")}`, ...job }
  });
}
console.log(`Seeded ${jobs.length} demo jobs.`);
await prisma.$disconnect();
