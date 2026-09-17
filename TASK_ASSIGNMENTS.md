# IntoreAI Frontend — Task Assignments & Development Roadmap

**Project:** IntoreAI — AI-Powered Talent Screening Platform (Frontend)
**Date:** September 17, 2026
**Team:** 3 Frontend Developers
**Related repo:** Backend tasks live in **intore-ai-backend** (FS Dev 1–3). Fullstack devs contribute to both.

---

## Current Status: Phase 1 MVP (Frontend, Completed)

- Recruiter dashboard, job CRUD, applicant ranking, talent pool, archive
- Applicant dashboard, job browsing, application submission, profile upload, challenge participation
- Anonymized candidate screening views with AI reasoning display
- ProofHire challenge participation UI (6 challenge types)
- Auth flows (register/login) wiring to backend JWT API
- Glass-morphism M3 design tokens + Tailwind-based styling
- Notifications & interview scheduling UI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + React 19 + Tailwind CSS 4 |
| UI Style | Glass-morphism M3 design tokens |
| Backend integration | HTTP via `NEXT_PUBLIC_API_BASE_URL` (backend repo: intore-ai-backend, port 4000) |

---

## TASK ASSIGNMENTS (Frontend)

---

### FRONTEND DEV 1 — Recruiter Experience

| # | Task | Description | Priority | Deadline |
|---|------|-------------|----------|----------|
| 1 | Wire admin nav in recruiter layout | Uncomment admin navigation link in `app/recruiter/layout.tsx` and ensure route works | **High** | 1 week |
| 2 | Build 360° scorecard UI | Unified candidate view combining resume score breakdown, ProofHire results, interview notes — one page per candidate | **High** | 1 week |
| 3 | Build multi-interviewer comparison view | Side-by-side panel showing scores/notes from different interviewers for the same candidate | Medium | 2 weeks |
| 4 | Build candidate prep toggle | Recruiter can enable/disable prep mode per job and share prep link with candidates | Medium | 2 weeks |
| 5 | Add export/download reports | CSV and PDF export for screening results, applicant lists, and scorecards | Medium | 2 weeks |
| 6 | Build org profile settings | Company info, team members, branding settings page | Low | 3 weeks |

---

### FRONTEND DEV 2 — Applicant Experience

| # | Task | Description | Priority | Deadline |
|---|------|-------------|----------|----------|
| 1 | Build candidate prep mode UI | Practice view showing question bank filtered by role — applicant can practice answers | **High** | 1 week |
| 2 | Build application status tracker | Visual pipeline showing: Applied → Screened → Shortlisted → Interview → Decision with color-coded stages | **High** | 1 week |
| 3 | Improve ProofHire challenge UI | Add countdown timer, progress indicator, auto-save draft every 30s, better mobile layout | Medium | 2 weeks |
| 4 | Add saved/bookmarked jobs | applicants can bookmark jobs and view them in a "Saved Jobs" tab | Medium | 2 weeks |
| 5 | Build notifications center | Dedicated notifications page with mark-as-read, unread count badge, filter by type | Medium | 2 weeks |
| 6 | Responsive mobile pass | Audit and fix all applicant pages for mobile (320px–768px) | Medium | 2 weeks |

---

### FRONTEND DEV 3 — Design System & Polish

| # | Task | Description | Priority | Deadline |
|---|------|-------------|----------|----------|
| 1 | Replace inline styles with design system | Audit all pages, replace inline `style={{}}` with Tailwind utility classes using existing glass tokens from `globals.css` | **High** | 1 week |
| 2 | Build reusable component library | Extract and document: Button, Card, Modal, Badge, Table, Toast, Avatar, Dropdown, Tabs | **High** | 1 week |
| 3 | Add loading skeletons | Skeleton placeholders for: job lists, applicant cards, dashboard widgets, profile data | Medium | 2 weeks |
| 4 | Add dark mode toggle | Use existing CSS variable system to implement a theme switcher (light/dark) persisted in localStorage | Medium | 2 weeks |
| 5 | Build responsive sidebar nav | Collapsible sidebar with icon-only mode on tablet, hamburger menu on mobile | Medium | 2 weeks |
| 6 | Add page transitions | Smooth route transitions using framer-motion's `AnimatePresence` and `motion.div` | Low | 3 weeks |

---

## Frontend Development Timeline

### Week 1 (Sep 17–23) — Critical Fixes & Foundation

| Dev | Tasks | Deliverables |
|-----|-------|-------------|
| FE Dev 1 | Wire admin nav, build 360° scorecard UI | Working admin panel, unified candidate view |
| FE Dev 2 | Build prep mode UI, application status tracker | Applicant practice feature, visual status pipeline |
| FE Dev 3 | Replace inline styles, build component library | Consistent glass-morphism design, reusable components |

### Week 2 (Sep 24–30) — Feature Expansion

| Dev | Tasks |
|-----|-------|
| FE Dev 1 | Multi-interviewer comparison, prep toggle, export reports |
| FE Dev 2 | ProofHire timer/autosave, saved jobs, notifications center |
| FE Dev 3 | Loading skeletons, dark mode, responsive sidebar |

### Week 3+ (Oct 1+) — Stretch Goals & Polish

| Dev | Tasks |
|-----|-------|
| FE Dev 1 | Org profile settings |
| FE Dev 2 | Responsive mobile pass |
| FE Dev 3 | Page transitions, final polish |

---

## Known Bugs to Fix Immediately

1. **Admin nav hidden** — `app/recruiter/layout.tsx` admin link is commented out (FE Dev 1 #1)
2. Backend bugs (notification route conflict, etc.) tracked in **intore-ai-backend**

---

## Verification

```bash
npm install
npm run build        # passes (22 routes)
npm run dev          # Web on :3000
```

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` in `.env.local` (see `.env.example`).

## Repository

```
intore-ai-frontend/
├── app/              # App Router pages (recruiter + applicant)
├── lib/              # API client + shared UI types
├── components/       # Shared components (e.g. Toast)
├── public/           # Static assets
├── stitch/           # Static UI prototypes (references)
└── docs/             # Specs + submission references
```

**Run locally:**
```bash
npm install
npm run dev        # Web on :3000
```