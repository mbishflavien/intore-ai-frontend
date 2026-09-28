# Changelog

All notable changes to IntoreAI (backend **and** frontend) are documented here.

## [Unreleased]

### Infra — Week 1 Mugisha #3: web container
- **`Dockerfile`** (new, multi-stage node:20-alpine, `NEXT_PUBLIC_API_BASE_URL` build-arg) + **`package.json`** gains `npm start` (`next start`) for production serving. Consumed by the backend repo's `docker-compose.yml` (`../intore-ai-frontend` build context).

### Frontend — Week 2 Friend: skeletons, dark mode, responsive sidebar

#### Friend #3 — Loading skeletons (rollout complete)
- New `DashboardSkeleton` (stat widgets + panels) and `TableSkeleton` (header + rows, `rows` prop) in `components/ui/Skeleton.tsx`; barrel export updated; base `Skeleton` shimmer now dark-aware.
- All remaining full-page spinners replaced with contextual skeletons + headings (`aria-busy`): recruiter dashboard/jobs/job-detail/applicants/talent/archive, applicant dashboard/challenges/training/training-detail. Button-level spinners (login, save, resume parse) intentionally kept.

#### Friend #4 — Dark mode toggle (persisted)
- `lib/theme.tsx` ThemeProvider (light/dark, localStorage `intore-theme`, OS preference default, `color-scheme` sync) + no-FOUC boot script in `app/layout.tsx`.
- `components/ThemeToggle.tsx` (Sun/Moon, 44px, `aria-pressed`) mounted in both recruiter and applicant headers.
- Tailwind v4 class-based dark variant (`@custom-variant dark`); `app/globals.css` dark layer: dark aura gradient, dark glass-card/panel/pillar + secondary/ghost buttons, slate text-ramp remap so existing pages adapt without rewrites. Accent colors unchanged (contrast-safe both themes).

#### Friend #5 — Responsive collapsible sidebar
- New `lib/use-sidebar.ts` (persisted collapsed state, mobile drawer + scroll lock) and `components/AppSidebar.tsx` shared by both layouts.
- Desktop (lg+): icon pillar ↔ labeled rail toggle (persisted); tablet/mobile (<lg): hamburger in header opens slide-over drawer with overlay + Escape close (`role=dialog`, `aria-modal`), labels always shown in drawer.
- Main content padding now responsive (`px-4 → sm:px-6 → lg:pl-36/72`) instead of fixed `pl-36`; headers adapt (`mx-4/px-4` on mobile, dark surfaces).

### Frontend — Week 2 Sam: ProofHire timer/autosave, saved jobs, notifications center

#### Sam #3 — ProofHire challenge UI (`app/proofhire/applicant/jobs/[id]/page.tsx`)
- Countdown timer (challenge `timeLimit` or 60-min fallback, deadline persisted per job in localStorage so refresh keeps time), red urgency under 5 min, auto-submit once at zero.
- Dual progress bars: time-elapsed + assessment progress (loaded → editing → draft saved → evaluated), `role=progressbar` + `aria-live` status.
- Autosave every 30s when dirty (server draft + localStorage backup on every cycle), local backup restored on reload, server copy wins when present, offline-backup badge, `beforeunload` guard for unsaved work.
- Mobile: sticky bottom Save/Submit bar on small screens, responsive type scale, desktop actions hidden on mobile.

#### Sam #4 — Saved/bookmarked jobs (`lib/saved-jobs.ts`, `app/applicant/jobs/page.tsx`)
- localStorage bookmark store (`intore_saved_jobs_v1`, ids only, cross-tab `intore:saved-jobs` events); bookmark toggle (44px target, `aria-pressed`) on every job tile.
- All/Saved tabs with counts, search now covers title + location + skills, `JobListSkeleton` loading, empty states per tab.

#### Sam #5 — Notifications center (`app/applicant/notifications/page.tsx`, new `/applicant/notifications`)
- Full-page center: All/Unread/type filters with counts, newest-first, per-item Mark-as-read (`POST /api/notifications/:id/read`) + Mark-all-read, optimistic updates with rollback, `CardSkeleton` loading, empty states.
- Deep links: job notifications → job page, interview invites → applications; sidebar gains Notifications entry; bell badge/polling unchanged.
- `lib/api.ts` gains `notifications.markOne(id, token)`.

### Frontend — Guided apply flow (profile + resume enforced)

- **`lib/profile.ts`** (new) — client mirror of the backend completeness validator (labels kept in sync).
- **`lib/types.ts`** — `TalentProfile` gains `resumeUploaded/resumeFileName/resumeUploadedAt`.
- **`app/applicant/jobs/[id]/page.tsx`** — one-click "Apply Now" replaced with "Start Application" + 4-step `ApplyWizard` (Profile checklist → Resume upload+parse → Review recruiter-view snapshot with skill match → Done/Assessment-next). Backend 400s surface inline; required ProofHire becomes a post-apply CTA instead of a blocker.
- **`app/applicant/profile/page.tsx`** — 5MB upload guard, resume stamped (`resumeUploaded`, file name, timestamp) on save, completeness banner in header.
- **`lib/api.ts` + `app/recruiter/layout.tsx`** — new `markRecruiterFeedRead` hitting `POST /api/recruiter/notifications/read-all` (pairs with the now read-only recruiter feed).

### Frontend — Week 1 High priorities (Sam + Friend)

#### Friend #2 — Reusable component library (new `components/ui/`)
- `Button` (primary/secondary/ghost/danger, sm/md/lg/icon, loading + `aria-busy`), `Card` (+Header/Title/Content), `Modal` (Escape-to-close, scrim, aria-modal), `Badge` (8 tones, color+text pairs), `Table` (accessible, empty state), `Toast` (aria-live polite, auto-dismiss), `Avatar`, `Dropdown`/`DropdownItem`, `Tabs` (tablist semantics), `Skeleton`/`JobListSkeleton`/`CardSkeleton` (Tailwind-only, no inline styles). Barrel export `components/ui/index.ts`.

#### Friend #1 — Inline styles → design system (92 → 3)
- Rewrote `app/page.tsx`, `app/proofhire/applicant/jobs/[id]/page.tsx`, `app/proofhire/applicant/job/[id]/questions/page.tsx` in glass-morphism (zero `style={{}}`, Lucide icons replacing emoji, a11y labels).
- `animationDelay` props → Tailwind `delay-*` classes (applicant/recruiter dashboards, login/register nebulae); static widths → arbitrary values; dropzone states → conditional Tailwind.
- Remaining 3 `style={{width}}` are data-driven progress bars (training %, score bars, parsing %) — standard practice (shadcn Progress uses the same pattern).

#### Sam #2 — Application status tracker (`app/applicant/applications/page.tsx`)
- 5-stage pipeline Applied → Screened → Shortlisted → Interview → Decision with color-coded nodes (emerald completed / sky pulsing current / slate upcoming / red failed) + sr-only state text.
- Stage resolution from `Application.status + screeningResult + proofScore` plus interview detection via `interview_scheduled` notifications; Decision reflects accepted/rejected.
- Stats header (total/active/shortlisted/offers), `Tabs` filter (All/Active/Shortlisted/Decisions), AI-fit + assessment chips, `Skeleton` loading, "How the pipeline works" + Prep Room CTA sidebar.

#### Sam #1 — Candidate prep mode UI (`app/applicant/prep/page.tsx`, new route `/applicant/prep`)
- Prep Room reusing training API: quick drills extracted from all module quizzes (role/skill search with datalist, level filter, A/B/C/D answering with instant right/wrong feedback + explanations + study links, streak + localStorage answer memory) + employer-challenge tab (filtered `listPracticeChallenges` → practice pages) + AI Mentor CTA.
- Wired into applicant sidebar (`ClipboardCheck`, "Prep Room") between Assessments and Learning Hub; linked from applications sidebar tip and ProofHire assessment page context.

#### Verified
- `npm run typecheck` passes; `npm run build` passes (23 routes, +1 `/applicant/prep`).

### Backend — `intore-ai-backend`

#### New: Applicant self-training (Upskill)

- **`packages/shared/src/index.ts`** — Added training & mentor domain types: `TrainingLevel`, `TrainingQuizQuestion`, `TrainingUnit`, `TrainingModule`, `TrainingProgress`, `TrainingRecommendation`, `PracticeChallengeLite`, `MentorTurn`/`MentorTurnRole`, `MentorQuizState`, `MentorSession`, `MentorChatRequest`, `MentorChatResponse`.
- **`api/src/trainingContent.ts`** (new) — Curated 13-track learning catalog: React & Next.js, TypeScript, Node.js, Python, SQL, Data Analysis, Machine Learning, DevOps, UI/UX Design, Product Management, React Native, QA, Digital Marketing. Each track has 3 units with lesson content, apply-it checklists, topic quizzes, and curated external resources. Includes `findTrainingModuleForSkill` skill → module resolution (works for related skill aliases like "REST APIs").
- **`api/src/training.ts`** (new) — Training service: module accessors, in-memory unit progress store, skill-gap recommendations derived from posted jobs, and the offline AI mentor coach engine with per-session state (lesson told → quiz posed → answer graded → next topic), plus JSON support logs.
- **`api/src/server.ts`** — New applicant-facing endpoints:
  - `GET /api/training` — list catalog.
  - `GET /api/training/:id` — module by id or slug (e.g. `react-nextjs`).
  - `GET /api/training/recommendations` — top 8 skill-gap recommendations (applicant auth).
  - `GET /api/training/progress` and `POST /api/training/progress/:moduleId` — read/update unit progress.
  - `GET /api/training/practice` — ProofHire challenges from published jobs with ProofHire enabled.
  - `GET /api/training/practice/:challengeId` — single challenge for the practice page.
  - `POST /api/training/practice/evaluate` — instant, non-recorded practice evaluation.
  - `POST /api/mentor/chat` — offline AI mentor (applicant auth).

#### New: Demo seed data

- **`scripts/seed-demo.mjs`** (new) — Idempotent seed script (runs against the running API). Registers the two demo accounts plus **8 recruiters**, creates **3 ProofHire challenges** (coding, SQL, document), and publishes **14 real jobs** — a mix of Kigali/Rwanda (Rwanda FinServe, NuruPay, Ukwishyura Bank, Agaciro Agro, Inyenyeri Energy, Tamuka Fashion) and remote/global (Vista Remote, Atlantica Data). 3 jobs are wired with required/optional ProofHire assessments. Re-run after every backend restart (in-memory storage).
- **`README.md`** — Added "Demo data" section: seed command, credentials (all `demo1234`), and the in-memory reset caveat.
- **`.gitignore`** — Ignore `dev-api.log` / `dev-api.log.err` development logs.

### Frontend — `intore-ai-frontend`

#### New: Applicant self-training (Upskill)

- **`lib/types.ts`** — Training/mentor type additions mirroring the backend shared package.
- **`lib/api.ts`** — Added `api.training.*` (listModules, getModule, getProgress, markUnitComplete, getRecommendations, listPracticeChallenges, getPracticeChallenge, practiceEvaluate) and `api.mentor.chat` namespaces.
- **`app/applicant/layout.tsx`** — Sidebar now has **Learning Hub** (`/applicant/training`, GraduationCap) and **AI Mentor** (`/applicant/mentor`, Bot).
- **`app/applicant/page.tsx`** — Dashboard gains a 3-card **Upskill** section (Skill tracks, AI mentor, Practice).
- **`app/applicant/training/page.tsx`** (new) — **Learning Hub**: skill-gap "Recommended for your profile" modules (with Start CTAs / "Lesson soon" fallback), filterable 13-track library with level badges, lesson-count, time, and per-track progress bars; and a **Practice Zone** grid of real employer challenges (no-records, instant feedback badge). Signed-out visitors get a sign-in prompt.
- **`app/applicant/training/[id]/page.tsx`** (new) — Module detail: progress ring, expandable units with content + apply-it checklists + quizzes (immediate right/wrong feedback with explanations), "Mark unit complete" progress tracking, curated external resources, and AI Mentor CTAs seeded with the module's skill.
- **`app/applicant/mentor/page.tsx`** (new) — **AI Mentor** chat: skill picker (from catalog + General), coach lessons with inline quiz question buttons, correct-answer tracking, session reset, typing indicator.
- **`app/applicant/training/practice/[challengeId]/page.tsx`** (new) — Practice page: challenge brief, SQL/document tips, hints + references panels, code/document editor, instant non-recorded evaluation with score and strengths/gaps coach feedback; mentor help CTA.
- **`app/proofhire/applicant/jobs/[id]/page.tsx`** — Added "Practice this challenge without affecting your record" link into the training practice zone.

### Verified

- TypeScript strict typecheck passes in **both** repos (`npm run typecheck`).
- Live-tested vs `http://localhost:4000`: training catalog (13 modules), module-by-slug lookup, mentor chat (lesson + quiz), practice list (3 challenges), practice evaluate (score 92), recommendations (8, all resolve to a module), progress updates.
- Full application pipeline verified: ProofHire challenge evaluation (score 88 → passed) → application submitted with `proofHireStatus: passed` → recruiter screening returns shortlist (overall 69, proof 88, "Viable shortlist candidate").
- All new frontend routes render 200 on `http://localhost:3000`.

## [0.1.0] — Initial platform

- **Backend**: IntoreAI scoring engine, transparent/explainable screening, ProofHire challenges, JWT auth (HS256), MongoDB with in-memory fallback, local resume parser.
- **Frontend**: Next.js web app with design system, applicant and recruiter dashboards, ProofHire assessment UI.