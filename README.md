# IntoreAI — Frontend

**IntoreAI** is an AI-powered talent screening platform that ranks job applicants against job requirements using a transparent, explainable scoring engine, then enriches shortlists with AI-generated recruiter reasoning.

This repository contains the **frontend** (Next.js recruiter + applicant UI). The API, scoring engine, and resume parser live in a separate repository: **intore-ai-backend**.

## Tech stack

- **Next.js 15** + **React 19** + **Tailwind CSS 4**
- **UI Style** glass-morphism M3 design tokens
- Communicates with the backend API over HTTP only

## Project structure

```text
intore-ai-frontend/
├── app/              # App Router pages (recruiter + applicant)
├── lib/              # API client + shared UI types
├── components/       # Shared components (e.g. Toast)
├── public/           # Static assets
├── stitch/           # Static UI prototypes (references)
└── docs/             # Product specs + submission references
```

## Getting started

```bash
npm install
npm run dev    # Web on http://localhost:3000
```

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Backend

The Node.js API is maintained in the **intore-ai-backend** repository. Run it (default port 4000) so the UI has endpoints to talk to.