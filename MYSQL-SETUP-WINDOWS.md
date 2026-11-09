# Windows MySQL setup

1. Ensure the Windows service `MySQL80` is Running.
2. Open MySQL Workbench and connect to `Local instance MySQL80`.
3. Run `CREATE DATABASE ai_job_agent;`.
4. In the project root, copy `.env.example` to `.env`:
   `Copy-Item .env.example .env`
5. Edit `.env` and set `DATABASE_URL` to:
   `DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/ai_job_agent"`
   Replace the placeholder with your MySQL password. URL-encode special characters in the password.
6. From the project root terminal run:
   `npm run db:generate`
   `npm run db:migrate -w apps/api -- --name init`
   `npm run db:seed`
   `npm run dev`

Frontend: http://localhost:5173
API health: http://localhost:8080/api/health

MySQL stores the `skills` fields as JSON arrays. The app code continues to read and write them as JavaScript arrays through Prisma.
