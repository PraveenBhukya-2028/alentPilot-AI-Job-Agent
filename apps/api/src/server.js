import "dotenv/config";
import app from "./app.js";
import { prisma } from "./lib/prisma.js";

const port = Number(process.env.PORT || 8080);
const server = app.listen(port, () => console.log(`AI Job Agent API running on http://localhost:${port}`));

async function shutdown() {
  console.log("Shutting down...");
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
