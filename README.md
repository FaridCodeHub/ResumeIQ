# ResumeIQ — AI-Powered Resume Analyzer & Career Recommendation System

ResumeIQ is a full-stack web application designed to help job seekers evaluate, optimize, and tailor their resumes using deterministic scoring rules and Google Gemini AI analysis. Built with React, TypeScript, Material UI, Node.js, Express, and PostgreSQL, the system supports resume management, job description matching, ATS readiness assessment, skill gap detection, and personalized career recommendations.

> **Current status:** Full-stack application implemented (Frontend, Backend API, PostgreSQL Database, and Google Gemini AI integration)  
> **Project type:** Academic / Software Engineering Project (CSE 0613226 — Software Engineering and System Analysis Lab)  
> **Application type:** Full-stack responsive web application

---

## Table of Contents

- [Project Overview](#project-overview)
- [Implemented Features](#implemented-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [System Architecture & Data Flow](#system-architecture--data-flow)
- [Database Schema](#database-schema)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints Overview](#api-endpoints-overview)
- [Security Implementation](#security-implementation)
- [Future Improvements](#future-improvements)

---

## Project Overview

Job seekers frequently struggle to determine whether their resumes effectively communicate their skills or align with specific job requirements and Applicant Tracking Systems (ATS). ResumeIQ addresses this challenge by combining local document text extraction, structured skill normalization against a curated skill catalog, deterministic scoring logic, and Google Gemini AI semantic analysis.

### Target Users

- **University Students & Fresh Graduates:** Preparing resumes for internships and entry-level roles.
- **Job Seekers & Professionals:** Tailoring resumes against specific job descriptions and identifying skill gaps.
- **Administrators:** Managing the canonical skill catalog, reviewing newly discovered skills, and auditing system changes.

---

## Implemented Features

Based on the current codebase (`ResumeIQ-main`), the following capabilities are implemented:

| Feature | Status | Implementation Details |
| :--- | :--- | :--- |
| **User Authentication & Sessions** | Implemented | JWT-based authentication (`jsonwebtoken`), bcrypt password hashing, and database-backed session tracking (`auth_sessions`). |
| **Role-Based Access Control** | Implemented | Supports `user` and `admin` roles via authentication middleware (`auth.middleware.ts`). |
| **Resume Upload & Management** | Implemented | Supports PDF and DOCX files (up to 5 MB) via `multer` disk storage (`backend/storage/resumes/`), metadata storage, and deletion. |
| **Text Extraction & Preprocessing** | Implemented | Server-side text extraction (`pdf-parse` / `mammoth`) and normalization/cleaning (`text-preprocessing.service.ts`), alongside client-side preview utilities (`pdfjs-dist`, `mammoth`). |
| **Job Description Management** | Implemented | Users can create, view, edit, and delete target job descriptions (`job.controller.ts`) for role-specific matching. |
| **AI-Powered Resume Analysis** | Implemented | Integrates `@google/genai` (`gemini-analysis.service.ts`) using structured JSON schema validation (`analysis.schema.ts`). Supports both general resume analysis and job-specific matching. |
| **Deterministic Scoring Engine** | Implemented | Combines AI insights with structured scoring (`scoring.service.ts`) for overall match score, ATS score, keyword score, and formatting score. |
| **Skill Normalization & Catalog** | Implemented | Matches extracted skills against a normalized PostgreSQL skill catalog (`skills`, `skill_aliases`) with automatic queueing of unknown skills for admin review. |
| **ATS, Skill Gap & Career Insights** | Implemented | Stores and displays detailed ATS metrics, missing/matched skills (`skill_gaps`), improvement suggestions (`recommendations`), and career path suggestions (`career_recommendations`). |
| **Analysis History & Dashboard** | Implemented | Persists past analyses in PostgreSQL (`analysis` and related tables) with full retrieval on the frontend (`AnalysisHistory.tsx`, `ResumeAnalysis.tsx`, `DashboardHome.tsx`). |
| **User AI Settings (BYOK)** | Implemented | Allows users to configure custom Gemini API keys encrypted at rest (`api-key-encryption.service.ts`, `user_ai_settings`). |
| **Admin Skill Review & Audit Logs** | Implemented | Admin endpoints to approve/reject/merge pending skills and record administrative actions (`admin_audit_logs`). |
| **Rate Limiting** | Implemented | Protects analysis endpoints against abuse (`analysis-rate-limit.middleware.ts`). |

*Note: Frontend placeholder files currently exist for standalone views (`ATSAnalysis.tsx`, `CareerRecommendations.tsx`, `SkillGapAnalysis.tsx`, `Settings.tsx`), while comprehensive analysis results—including ATS scores, skill gaps, and career recommendations—are rendered within `ResumeAnalysis.tsx` and `NewAnalysis.tsx`.*

---

## Technology Stack

### Frontend (`frontend/`)
- **React 19** & **TypeScript** — Component-based UI and static typing
- **Vite** — Development server and production bundler
- **Material UI (MUI v7)** & **Emotion** — Responsive UI components and styling
- **React Router DOM** — Client-side routing and protected routes
- **Axios** — HTTP client with JWT interceptor (`src/services/api.ts`)
- **pdfjs-dist** & **mammoth** — Client-side document parsing utilities

### Backend (`backend/`)
- **Node.js** & **Express.js** — RESTful API server
- **TypeScript** — Strongly typed backend services and controllers
- **PostgreSQL (`pg`)** — Relational database connection pooling and SQL queries
- **Google GenAI SDK (`@google/genai`)** — Integration with Google Gemini models
- **Multer** — Multipart file upload handling
- **JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`** — Authentication and password hashing
- **CORS & Dotenv** — Cross-origin resource sharing and environment management

### Database (`database/`)
- **PostgreSQL** — Relational schema with incremental SQL migrations (`001` through `012`)

---

## Project Structure

```text
ResumeIQ-main/
├── README.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── storage/
│   │   └── resumes/                  # Uploaded PDF/DOCX file storage
│   └── src/
│       ├── server.ts                 # Express app entry point & route mounting
│       ├── config/                   # Auth, DB pool, Gemini client, and Multer upload configs
│       ├── controllers/              # Request handlers (auth, resume, job, analysis, skill-catalog, user-ai-settings)
│       ├── middleware/               # JWT auth guard & analysis rate limiter
│       ├── routes/                   # Express route definitions
│       ├── services/
│       │   ├── auth.service.ts       # Registration, login, session management
│       │   ├── resume.service.ts     # Resume CRUD and file operations
│       │   └── analysis/             # Orchestrator, Gemini AI, scoring, skill normalization, encryption, audit
│       ├── utils/                    # Password hashing and JWT token helpers
│       └── validators/               # Input validation rules
├── database/
│   ├── schema.sql                    # Base schema
│   ├── schemaFinal.sql               # Consolidated final database schema
│   ├── sampleJob.sql                 # Sample job description seed data
│   └── migrations/                   # Incremental SQL migrations (001 to 012)
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── vercel.json                   # SPA routing rewrite rules for Vercel
    └── src/
        ├── App.tsx                   # Landing page and root component
        ├── main.tsx                  # React DOM entry point
        ├── components/               # ProtectedRoute, DashboardLayout, Sidebar, Topbar, common UI
        ├── context/                  # AuthContext for user session state
        ├── pages/                    # DashboardHome, MyResumes, JobDescriptions, NewAnalysis, ResumeAnalysis, AnalysisHistory, Auth pages
        ├── routes/                   # AppRoutes configuration
        ├── services/                 # Axios API client (api.ts)
        └── utils/                    # Browser-side resume parser utility
```

---

## System Architecture & Data Flow

1. **Authentication:** Users register or log in via `/api/auth`. The backend hashes passwords with `bcryptjs`, creates a record in `auth_sessions`, and issues a signed JWT stored by the frontend `AuthContext`.
2. **Resume & Job Ingestion:** Authenticated users upload PDF/DOCX resumes (`/api/resumes`) and optionally create target job descriptions (`/api/jobs`).
3. **Analysis Orchestration (`analysis-orchestrator.service.ts`):**
   - Extracts and cleans raw text from the stored resume file (`text-preprocessing.service.ts`).
   - Resolves the active Gemini API key (user's encrypted personal key in `user_ai_settings` or the server's default `GEMINI_API_KEY`).
   - Sends structured prompts to Google Gemini (`gemini-analysis.service.ts`) and validates the returned JSON structure (`analysis.schema.ts`).
   - Normalizes extracted skills against the PostgreSQL `skills` and `skill_aliases` tables (`skill-normalization.service.ts`), logging unrecognized terms to `skill_review_queue`.
   - Computes deterministic match, ATS, keyword, and formatting scores (`scoring.service.ts`).
4. **Persistence & Visualization:** Results are persisted across `analysis`, `ats_analysis`, `skill_gaps`, `recommendations`, and `career_recommendations`, then rendered in the React dashboard.

---

## Database Schema

The PostgreSQL database (`database/schemaFinal.sql` and `database/migrations/`) includes the following core tables:

- `users` & `auth_sessions` — User accounts, roles (`user`, `admin`), and active session tokens.
- `resumes` & `resume_skills` — Uploaded resume metadata, file paths, extracted text, and mapped skills.
- `job_descriptions` & `job_skills` — User-defined target roles and required skills.
- `skills`, `skill_aliases`, `skill_review_queue`, & `skill_review_decisions` — Canonical skill taxonomy and administrative review workflow.
- `analysis` — Master analysis records linking users, resumes, optional job descriptions, and overall match scores.
- `ats_analysis`, `skill_gaps`, `recommendations`, & `career_recommendations` — Detailed breakdown tables linked via foreign keys to `analysis`.
- `user_ai_settings` — Encrypted per-user Gemini API keys and model preferences.
- `admin_audit_logs` — Audit trail for administrative actions.

---

## Prerequisites

- **Node.js** (v18+ recommended) and **npm**
- **PostgreSQL** (v14+ recommended)
- **Google Gemini API Key** (from Google AI Studio)

---

## Installation and Setup

### 1. Database Setup

Create a PostgreSQL database (e.g., `resumeiq`) and execute the consolidated schema script:

```bash
psql -U postgres -d resumeiq -f database/schemaFinal.sql
```

*(Optionally, load `database/sampleJob.sql` for sample job descriptions.)*

### 2. Backend Setup

Navigate to the `backend` directory, install dependencies, and start the development server:

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (see [Environment Variables](#environment-variables)), then run:

```bash
npm run dev
```

The backend API runs by default on `http://localhost:5000`.

### 3. Frontend Setup

Open a new terminal, navigate to the `frontend` directory, install dependencies, and start Vite:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server runs by default on `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file in `backend/` with the following configuration:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/resumeiq
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
API_KEY_ENCRYPTION_SECRET=your_32_byte_encryption_secret_for_user_keys
CLIENT_URL=http://localhost:5173
```

*(Note: Never commit `.env` files or real API keys to version control.)*

---

## API Endpoints Overview

All protected routes require a `Bearer <token>` header.

- **Auth (`/api/auth`)** — `POST /register`, `POST /login`, `POST /logout`, `GET /me`
- **Resumes (`/api/resumes`)** — `POST /upload`, `GET /`, `GET /:id`, `DELETE /:id`
- **Jobs (`/api/jobs`)** — `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
- **Analysis (`/api/analysis`)** — `POST /run`, `GET /history`, `GET /:id`
- **User AI Settings (`/api/user-ai-settings`)** — `GET /`, `PUT /`, `DELETE /`
- **Skill Catalog (`/api/skills`)** — Endpoints for querying canonical skills and admin review queue management
- **Admin Audit (`/api/admin/audit-logs`)** — Endpoint for viewing administrative audit trails

---

## Security Implementation

- **Server-Side Secret Isolation:** The primary `GEMINI_API_KEY` remains strictly on the Node.js backend.
- **Encrypted User API Keys:** User-supplied Gemini API keys are encrypted before database storage (`api-key-encryption.service.ts`).
- **Authentication & Session Validation:** Passwords are salted and hashed with `bcryptjs`; JWTs are verified against active database records in `auth_sessions`.
- **Upload Restrictions:** Multer enforces file type filtering (PDF/DOCX) and file size limits on the server.
- **Rate Limiting:** Dedicated middleware throttles AI analysis requests per user/IP.

---

## Future Improvements

- Complete dedicated standalone UI views for `ATSAnalysis.tsx`, `CareerRecommendations.tsx`, `SkillGapAnalysis.tsx`, and `Settings.tsx`.
- Implement automated unit and integration test suites for backend services and frontend components.
- Add OCR support for scanned image-based PDF resumes.
- Provide downloadable PDF/DOCX analysis reports and side-by-side resume version comparison.