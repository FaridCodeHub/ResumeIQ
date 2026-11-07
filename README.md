# ResumeIQ --- AI-Powered Resume Analyzer

ResumeIQ is an academic and portfolio project for building a responsive
web application that helps job seekers understand and improve their
resumes. The planned product combines resume parsing, structured
analysis, and AI-assisted recommendations.

> **Current status:** Frontend prototype in development\
> **Project type:** Academic / portfolio project\
> **Application type:** Responsive web application

## Table of Contents

-   [Project Overview](#project-overview)
-   [Problem Statement](#problem-statement)
-   [Project Objectives](#project-objectives)
-   [Current Implementation Status](#current-implementation-status)
-   [Planned Features](#planned-features)
-   [Technology Stack](#technology-stack)
-   [Project Structure](#project-structure)
-   [Prerequisites](#prerequisites)
-   [Installation and Setup](#installation-and-setup)
-   [How Resume Parsing Currently
    Works](#how-resume-parsing-currently-works)
-   [Architecture and Future Backend](#architecture-and-future-backend)
-   [Environment Variables and
    Security](#environment-variables-and-security)
-   [Development Workflow](#development-workflow)
-   [Testing](#testing)
-   [Database Design](#database-design)
-   [Deployment](#deployment)
-   [Documentation](#documentation)
-   [Future Improvements](#future-improvements)
-   [Contributing](#contributing)
-   [License](#license)

------------------------------------------------------------------------

## Project Overview

ResumeIQ aims to help job seekers evaluate their resumes, identify
relevant skills, and improve how they present their qualifications. The
intended product may also compare resume content against a user-provided
job description and provide actionable feedback.

### Target Users

-   University students preparing for internships.
-   Fresh graduates entering the job market.
-   Job seekers improving their resumes.
-   Professionals updating their career profiles.

## Problem Statement

Job seekers may find it difficult to determine whether their resumes
clearly communicate their qualifications or match the requirements of a
particular role. Common challenges include identifying missing or
underrepresented skills, improving resume structure, and tailoring
content to a job opportunity.

ResumeIQ aims to address these challenges through structured resume
analysis and, in a later stage, AI-assisted recommendations.

## Project Objectives

The project aims to:

1.  Build a responsive, user-friendly resume analysis application.
2.  Accept supported resume file formats.
3.  Extract readable text from uploaded resumes.
4.  Analyze resume content using structured and AI-assisted techniques.
5.  Identify skills and potential gaps relative to job requirements.
6.  Provide actionable improvement suggestions.
7.  Compare resume content with a user-provided job description, if
    included in the approved requirements.
8.  Maintain a secure and maintainable architecture.

The final scope should remain aligned with the approved project
presentation, data-flow diagram, and ER diagram.

## Current Implementation Status

This table reflects the implementation completed so far. A feature is
not marked complete merely because it appears in the planned design.

  -----------------------------------------------------------------------
  Feature                 Current status          Notes
  ----------------------- ----------------------- -----------------------
  React + TypeScript      Implemented             Created with Vite
  frontend scaffold                               

  Material UI components  Implemented             MUI and its Emotion
                                                  dependencies are
                                                  installed

  Responsive homepage     Implemented             Initial landing page
                                                  and feature sections

  Navigation to upload    Implemented             Homepage buttons switch
  page                                            to the upload view

  Resume upload interface Implemented             Includes file selection
                                                  and drag-and-drop

  File type validation    Implemented             Accepts PDF and DOCX
                                                  extensions

  File size validation    Implemented             Maximum 5 MB in the
                                                  current frontend

  PDF text extraction     Implemented and tested  Uses `pdfjs-dist`;
                          locally                 current working version
                                                  is `4.10.38`

  DOCX text extraction    Implemented in code     Uses `mammoth`; should
                                                  be tested with sample
                                                  DOCX files

  Display extracted text  Implemented             Extracted text is
                                                  displayed for
                                                  inspection

  AI-powered analysis     Not implemented         No AI provider is
                                                  connected yet

  Resume score and        Not implemented         To be developed after
  feedback                                        parsing is stable

  Backend API             Not implemented         Current upload and
                                                  parsing flow runs in
                                                  the browser

  Database                Not implemented         Must follow the
                                                  approved ER diagram

  Authentication and      Not confirmed           Implement only if
  saved history                                   required by the
                                                  approved project scope

  Automated tests         Not yet documented as   Add tests as features
                          run                     are developed
  -----------------------------------------------------------------------

**Important:** File validation in the browser improves usability, but it
is not a substitute for server-side validation if uploads are later sent
to a backend.

## Planned Features

The following are future capabilities, subject to the approved project
requirements:

-   Structured resume analysis.
-   Identification of skills and resume sections.
-   Interpretable resume scoring, if required.
-   AI-generated improvement suggestions.
-   Comparison with a job description.
-   Results dashboard.
-   Backend API and database integration.
-   Authentication and analysis history, if required.

## Technology Stack

### Frontend currently in use

  Technology          Purpose
  ------------------- -------------------------------------------------
  React               Component-based user interface
  TypeScript          Static typing
  Vite                Development server and build tooling
  Material UI (MUI)   UI components and responsive layouts
  Emotion             Styling engine used by MUI
  `pdfjs-dist`        Extract text from PDF documents in the browser
  `mammoth`           Extract text from DOCX documents in the browser
  npm                 Dependency management

### Planned backend

The backend has not yet been initialized. The current plan in this
README is provisional and must be confirmed against the approved
diagrams and project requirements.

  Technology       Intended purpose
  ---------------- ----------------------------------------------------
  Node.js          JavaScript runtime
  Express.js       API and request handling
  AI service/API   AI-assisted analysis, after a provider is selected
  Database         Persistent data, based on the approved ER diagram

Do not put private AI API keys in frontend code. Any secret API
credentials must be kept on the server.

## Project Structure

The current working frontend structure is approximately:

``` text
ResumeIQ/
├── README.md
└── frontend/
    ├── public/
    ├── src/
    │   ├── pages/
    │   │   └── ResumeUpload.tsx
    │   ├── utils/
    │   │   └── resumeParser.ts
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    └── vite.config.ts
```

This is the current frontend-focused structure, not the final
architecture. More folders and files may be added as the project grows.
The backend and documentation directories should be added only when
those parts are implemented.

## Prerequisites

Install the following:

-   Node.js and npm.
-   Visual Studio Code.
-   Git (recommended).
-   A modern web browser.

Verify your installations:

``` bash
node -v
npm -v
git --version
```

## Installation and Setup

### 1. Open the project

Open the existing `ResumeIQ` directory in VS Code.

### 2. Move into the frontend directory

From the project root, run:

``` bash
cd frontend
```

**Run frontend npm commands from `ResumeIQ/frontend`, not from the root
`ResumeIQ` directory.** The current `package.json` is inside `frontend`.

### 3. Install dependencies

If dependencies have not been installed yet:

``` bash
npm install
```

The frontend uses Material UI, PDF.js, and Mammoth. If you need to
install the current dependencies manually, use:

``` bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
npm install pdfjs-dist@4.10.38 mammoth
```

Keep `package-lock.json` in version control so the project can reproduce
the installed dependency versions.

### 4. Start the development server

From inside `frontend`, run:

``` bash
npm run dev
```

Vite will print a local development address, usually
`http://localhost:5173/`. Open the address shown in your terminal.

To start the frontend from the project root without changing
directories, you can run:

``` bash
npm --prefix frontend run dev
```

### 5. Available quality checks

From `frontend`, run:

``` bash
npm run lint
npm run build
```

These commands run the scripts configured in `frontend/package.json`.
Fix any reported errors before proceeding.

### 6. Backend setup

The backend has not yet been implemented. Backend installation,
environment variables, database configuration, and API startup
instructions will be added after the backend stack and interfaces are
confirmed.

## How Resume Parsing Currently Works

The current frontend flow is:

1.  The user opens the upload page from the homepage.
2.  The user selects or drops a PDF or DOCX file.
3.  The frontend checks the file extension/type and enforces a 5 MB
    limit.
4.  `resumeParser.ts` extracts text in the browser:
    -   PDF: `pdfjs-dist` version `4.10.38`.
    -   DOCX: `mammoth`.
5.  The extracted text is shown on the page so the user can inspect it.

This is **text extraction only**. It does not yet assess resume quality,
calculate a validated score, compare against a job description, or call
an AI model.

Scanned PDFs may contain images rather than selectable text. OCR support
would be needed to extract text from those files. Complex PDF layouts
may also produce text in an order that differs from the visual layout.

## Architecture and Future Backend

The current working flow is frontend-only:

``` text
User
  |
  v
React + TypeScript + Material UI
  |
  v
Local file validation and browser-based text extraction
  |
  v
Display extracted resume text
```

A future backend-based architecture may look like this, subject to the
approved project diagrams:

``` text
User
  |
  v
React Frontend
  |
  | HTTP / REST API
  v
Backend API
  |             |
  v             v
Database     Resume parsing / AI service
```

### Frontend responsibilities

-   Render the responsive interface.
-   Provide file selection and validation feedback.
-   Display extracted text and, later, analysis results.
-   Communicate with backend API endpoints once they exist.

### Planned backend responsibilities

-   Validate requests and uploaded files on the server.
-   Coordinate parsing and AI analysis.
-   Apply business rules.
-   Access the database where required.
-   Return structured results to the frontend.

### Database responsibilities

The final schema must follow the approved Entity-Relationship Diagram
(ERD). Do not treat a proposed schema as implemented until it has been
created and tested.

## Environment Variables and Security

The current frontend text-extraction flow does not require an AI API key
or database connection.

When a backend is introduced, its environment configuration may include
values such as:

``` dotenv
PORT=5000
DATABASE_URL=
AI_API_KEY=
```

These are examples only, not a finalized configuration.

Security rules:

-   Never commit real API keys, passwords, or tokens.
-   Never expose private AI API keys in frontend variables or browser
    code.
-   Keep server-side secrets in backend environment variables.
-   Use `.env.example` to document variable names without real
    credentials.
-   Exclude actual `.env` files from version control.
-   Validate file types and sizes on the server if files are uploaded to
    a backend.
-   Handle resumes as personal data; minimize storage and define
    retention/deletion rules before adding persistent uploads.

## Development Workflow

Recommended workflow:

1.  Review the approved project requirements and diagrams.
2.  Build and test one frontend feature at a time.
3.  Keep PDF and DOCX parsing stable with representative test files.
4.  Add structured resume analysis after text extraction is reliable.
5.  Initialize the backend and database according to the approved
    design.
6.  Integrate AI through a backend service if required.
7.  Connect the frontend to backend APIs.
8.  Test complete user flows and responsive layouts.
9.  Update this README when implementation changes.
10. Commit stable changes to version control.

## Testing

Testing should cover, as applicable:

-   Homepage and upload-page navigation.
-   Responsive layouts on desktop and mobile.
-   Unsupported file extensions and oversized files.
-   Valid text-based PDF files.
-   DOCX files.
-   Empty or unreadable documents.
-   PDFs with multiple pages and unusual layouts.
-   Error handling when extraction fails.
-   Backend endpoints, AI analysis, and database operations once
    implemented.

Do not describe tests as passing unless they have actually been run. PDF
text extraction has been tested locally with the provided PDF. DOCX and
broader automated test coverage still need verification.

## Database Design

No database has been implemented yet. The final database choice,
entities, attributes, keys, relationships, constraints, and
initialization process must be based on the approved ER diagram and
project requirements.

## Deployment

Deployment instructions will be added after the application and backend
are ready for deployment. The eventual guide should cover frontend
hosting, backend hosting, production environment variables, database
hosting, API connectivity, build commands, and security configuration.

## Documentation

Keep project documentation aligned with the implementation and approved
academic materials. Potential documents include:

-   Developer setup guide.
-   API documentation after the backend is implemented.
-   Approved data-flow diagram.
-   Approved ER diagram.
-   Architecture diagrams, if required.

## Future Improvements

Potential improvements, subject to the approved scope:

-   Structured resume-section and skill analysis.
-   AI-generated recommendations.
-   Job description matching.
-   OCR support for scanned resumes.
-   Exportable analysis reports.
-   Resume version comparison.
-   Improved accessibility and automated testing.

## Contributing

This is an academic and portfolio project. Before committing changes:

1.  Verify that the frontend starts successfully.
2.  Run the available lint and build commands.
3.  Test the affected functionality.
4.  Update relevant documentation.
5.  Do not commit credentials or private resume files.

## License

A license has not yet been selected. Confirm the project ownership,
university requirements, and intended distribution before adding one.

------------------------------------------------------------------------

**ResumeIQ --- Making resume improvement more accessible through
AI-assisted analysis.**
