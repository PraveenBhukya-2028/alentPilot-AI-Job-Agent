# TalentPilot — AI Job Agent

**An AI-powered UK job search and application assistant.**

TalentPilot is a full-stack job-search workspace designed to help candidates discover relevant opportunities, analyse their skills, prepare tailored CV content, practise interviews, and manage job applications through a single platform.

The goal is to simplify the job-search journey — from finding an opportunity to tracking an application.

---

## Project Status

**Portfolio Project | Full-Stack MVP**

TalentPilot currently includes:

- User authentication and MySQL database integration.
- Live UK job search using the Adzuna API.
- Keyword, location and employment-type filters.
- CV upload and PDF text extraction.
- CV-to-job skill matching and analysis.
- AI-assisted CV and interview preparation capabilities.
- Application tracking and management.
- Apply Now functionality with external application links.

The Apply Now feature opens the external job application page and saves the opportunity in the application tracker. It does not automatically complete or submit employer application forms.

---

## Key Features

### 1. Job Discovery
- Live job search integration using the Adzuna API.
- Search opportunities using keywords and locations.
- Filter jobs based on employment type.
- Discover UK job opportunities.
- View job descriptions, company information and original listing links.

### 2. CV Analysis and Skill Matching
- Upload CVs in PDF format.
- Extract text from uploaded resumes.
- Analyse candidate skills against job requirements.
- Calculate transparent CV-to-job skill overlap.
- Identify matching skills and potential skill gaps.
- Support job-specific CV improvement.

### 3. Apply Now
- Open the original external job application page.
- Access the employer's application process.
- Save opportunities to the application tracker.
- Keep track of jobs you are interested in.

### 4. Application Tracker
- Manage saved job opportunities.
- Track application statuses.
- Maintain a centralised application pipeline.
- Manage applications associated with your account.

### 5. Interview Preparation
- Generate interview practice questions.
- Prepare for technical and general interviews.
- Use optional AI-powered interview preparation.

### 6. Dashboard
- Dark, responsive SaaS-style interface.
- Centralised job-search workspace.
- Quick access to resumes, job opportunities and applications.

### 7. Security
- Email and password authentication.
- Password hashing using bcrypt.
- JWT-based authentication.
- API rate limiting.
- Helmet security headers.
- CORS configuration and request validation.

---

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0 |
| ORM | Prisma |
| Authentication | JWT, bcrypt |
| Job Search API | Adzuna API |
| AI Integration | OpenAI API (optional) |
| Resume Processing | PDF text extraction |
| Development Tools | Git, GitHub, VS Code, Postman |

---

## System Architecture

```text
                 USER
                   |
                   v
          React + Vite Frontend
                   |
                   | HTTP / JSON
                   | Bearer JWT
                   v
             Express API
                   |
        +----------+-----------+
        |          |           |
        v          v           v
      MySQL     Adzuna       OpenAI
     Database    API       (Optional)
        |
        v
    Prisma ORM

Additional Services:
- Authentication
- Resume PDF Processing
- CV Analysis and Skill Matching
- Interview Preparation
- Application Tracking
```

---

## Application Workflow

```text
       Discover Jobs
             |
             v
       Search & Filter
             |
             v
        Analyse CV
             |
             v
       Match Job Skills
             |
             v
       Prepare CV
             |
             v
          Apply Now
             |
             v
    External Application Page
             |
             v
     Track Saved Application
```

---

## Project Structure

```text
ai-job-agent/
|
├── apps/
│   |
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.js
│   │   |
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── server.js
│   │   |
│   │   └── test/
│   |
│   └── web/
│       ├── src/
│       │   ├── App.jsx
│       │   ├── api.js
│       │   └── styles.css
│       |
│       └── index.html
|
├── .env.example
├── .gitignore
├── README.md
├── package.json
└── package-lock.json
```

---

## Requirements

Before running the project, install:

- Node.js 20.11+ (Node.js 22 LTS recommended).
- npm 10+.
- MySQL Server 8.0+.
- Git.
- Adzuna API credentials for live job search.
- OpenAI API key (optional).

MySQL Workbench is optional but useful for database management.

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/PraveenBhukya-2028/alentPilot-AI-Job-Agent.git
```

Navigate to the project:

```bash
cd TalentPilot-AI-Job-Agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create your local environment file:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

Configure the required database credentials, JWT secret and API credentials using the environment variable names defined in `.env.example` and the API configuration.

Never commit your actual `.env` files.

### 4. Create MySQL Database

Start your MySQL Server.

Open MySQL Workbench and execute:

```sql
CREATE DATABASE ai_job_agent;
```

Configure your database connection string:

```env
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/ai_job_agent"
```

Replace the placeholder with your own MySQL password.

If your database password contains URL-reserved characters, URL-encode them.

### 5. Configure Adzuna API

Create an Adzuna developer account and obtain your API credentials.

Configure the credentials in the backend environment using the variable names expected by the application.

The Adzuna integration is used for live job discovery.

Never expose API credentials in frontend code or commit them to GitHub.

### 6. Configure OpenAI (Optional)

Add your OpenAI API key to the backend environment if you want to enable the optional AI-powered features.

Keep the API key server-side.

### 7. Prepare Database

Generate Prisma Client:

```bash
npm run db:generate
```

Run database migrations:

```bash
npm run db:migrate -w apps/api -- --name init
```

Seed demo data:

```bash
npm run db:seed
```

### 8. Start the Application

Run the development environment:

```bash
npm run dev
```

Application URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- API Health: http://localhost:8080/api/health

Register an account and start exploring TalentPilot.

---

## Useful Development Commands

```bash
# Start frontend and backend
npm run dev

# Build frontend
npm run build

# Run tests
npm test

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate -w apps/api -- --name descriptive_change

# Seed database
npm run db:seed
```

---

## API Overview

All backend routes are prefixed with `/api`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | API health check |
| POST | `/auth/register` | Register account |
| POST | `/auth/login` | User login |
| GET | `/auth/me` | Get current user |
| GET / POST | `/jobs` | Search and add jobs |
| GET | `/jobs/live` | Live Adzuna job search |
| GET / POST | `/applications` | List and create applications |
| PATCH / DELETE | `/applications/:id` | Update and delete applications |
| GET | `/resumes` | List resume metadata |
| POST | `/resumes/upload` | Upload and parse PDF |
| POST | `/ai/tailor` | CV and job analysis |
| POST | `/ai/interview` | Interview preparation |
| POST | `/ai/match/:jobId` | Calculate skill overlap |

---

## Data Privacy and Security

- Passwords are hashed using bcrypt.
- JWT-based authentication is used for protected API routes.
- Environment files containing secrets are excluded through `.gitignore`.
- API credentials must remain on the backend.
- Resume text is stored in MySQL for matching and analysis.
- Uploaded PDF files are processed temporarily.
- OpenAI requests may send CV text and job descriptions to the configured provider.
- Users should be informed and provide appropriate consent before personal data is processed by external AI providers.

Before public deployment, implement appropriate data retention, deletion, export, access controls and privacy notices.

---

## Job Data and External Integrations

TalentPilot uses the Adzuna API to discover live job opportunities.

The application preserves external job listing links so candidates can continue the application process on the relevant employer or job-board website.

TalentPilot does not scrape websites, bypass access controls or automatically submit job applications.

External API usage is subject to the provider's terms, rate limits and availability.

---

## Future Enhancements

The following features are planned for future development:

- [ ] AI-powered job-specific CV tailoring.
- [ ] Advanced job matching and recommendation engine.
- [ ] Improved duplicate job detection.
- [ ] Job alerts and saved search preferences.
- [ ] Enhanced application analytics dashboard.
- [ ] Interview preparation with job-specific questions.
- [ ] Email notifications and application reminders.
- [ ] Automated job application workflow with user approval.
- [ ] Deployment to a cloud hosting platform.
- [ ] Automated testing and CI/CD pipeline.

---

## Production Readiness

Before launching publicly:

- [ ] Implement secure HttpOnly cookie authentication and CSRF protection.
- [ ] Add email verification and password reset.
- [ ] Implement account deletion and data export.
- [ ] Add structured logging and monitoring.
- [ ] Add stronger file validation and malware scanning.
- [ ] Add integration and end-to-end tests.
- [ ] Configure HTTPS and production secrets management.
- [ ] Configure database backups and recovery procedures.
- [ ] Review UK GDPR obligations and privacy requirements.

---

## Deployment

Potential deployment options:

| Component | Suggested Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render / Railway |
| Database | Managed MySQL |
| Source Control | GitHub |

Configure production environment variables through the hosting provider's secret management system.

Set `VITE_API_URL` to the deployed API URL and configure `WEB_ORIGIN` to the deployed frontend origin.

Run production database migrations using Prisma's deployment migration workflow.

---

## License

MIT License.

---

## Author

**TalentPilot — AI Job Agent**

An independent full-stack portfolio project focused on improving the UK job-search and application experience.

**Built with React.js, Node.js, Express, MySQL, Prisma and Adzuna API.**
