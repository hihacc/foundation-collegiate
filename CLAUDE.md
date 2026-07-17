# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

Website for The Foundation Collegiate, a coaching institute in North Karachi, Pakistan. Public marketing site (courses, faculty, notices, gallery, admissions form, student result checker) plus an admin dashboard. Built with Next.js 16 (App Router) + React 19, Tailwind CSS v4, and Supabase (Postgres, Auth, Storage). Deployed to Cloudflare Workers via OpenNext.

## Commands

```bash
npm run dev          # Dev server (next dev --turbopack) at localhost:3000
npm run build        # Production build via opennextjs-cloudflare (invokes `npx next build` internally)
npm run preview      # Build + preview locally on the Cloudflare workerd runtime
npm run deploy       # Build + deploy to Cloudflare Workers
npm run lint         # ESLint (eslint .)
npm run type-check   # tsc --noEmit
```

There is no test suite. Use `npm run lint` and `npm run type-check` to validate changes.

Do not run plain `next build` for deployment artifacts — the Cloudflare worker is built by `opennextjs-cloudflare build` (see `open-next.config.ts`, which sets `buildCommand` to avoid recursion). Cloudflare config lives in `wrangler.jsonc`; build output goes to `.open-next/` (generated, don't edit).

## Environment

Copy `.env.example` to `.env.local`. Requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, and rate-limit tuning (`RESULT_MAX_ATTEMPTS`, `RESULT_LOCKOUT_MINUTES`).

## Architecture

**Data layer — Supabase, no API routes.** There are no Next.js API routes or server actions; pages talk to Supabase directly from the client using the anon-key browser client (`src/lib/supabase/client.ts`, which exports a shared `supabase` instance). A cookie-based server client exists in `src/lib/supabase/server.ts` but most pages are `'use client'`. Data access is therefore governed by Supabase RLS policies — the full schema (settings, students, teachers, results, pins, admissions, messages, gallery, notices, courses, downloads, testimonials, events, analytics, result_attempts, etc.) is in `database.sql` at the repo root, intended to be run in the Supabase SQL Editor. Keep `database.sql` in sync when changing tables.

**Routing split — public vs admin.**
- Public pages live directly under `src/app/` (about, courses, faculty, notices, gallery, admissions, results, contact, faqs, downloads, privacy, terms).
- Admin lives at `src/app/admin/` — `/admin` is the Supabase Auth login page; `/admin/dashboard/*` holds the CRUD sections. Auth is enforced client-side in `src/app/admin/dashboard/layout.tsx` (redirects to `/admin` if no Supabase user); there is no middleware.
- Top-level routes like `/dashboard`, `/students`, `/teachers`, `/messages`, `/settings` are one-line redirect stubs into the corresponding `/admin/dashboard/*` pages.

**Layout switching.** `src/app/layout.tsx` (server component, holds all SEO metadata) wraps everything in `src/components/layout/ClientLayout.tsx`, which checks the pathname: admin routes render bare (the admin layout provides its own sidebar), all other routes get the public `Navbar` + `Footer`.

**Components.** `src/components/home/*` are the homepage sections composed in `src/app/page.tsx`; `src/components/ui/*` are shared primitives (Button, StatCard, SectionHeader, ParticleBackground).

**Result checker flow.** `/results` looks up a result by roll number + PIN (PINs stored in the `pins` table), with per-roll-number rate limiting in `src/lib/rateLimit.ts` backed by the `result_attempts` table. Result cards are exported to PDF via `html2canvas` + `jspdf`. Grade/percentage helpers are in `src/lib/utils/grades.ts`.

**Types are duplicated** in `src/types/index.ts` and `src/lib/types.ts` — check both before adding a new interface, and prefer updating the one already imported by the file you're editing.

**`cn` helper:** use `cn` from `@/lib/utils` (clsx + tailwind-merge). `src/lib/cn.ts` is a duplicate re-export of the same idea.

## Conventions

- Almost every page is a `'use client'` component; toasts use `sonner` (`Toaster` is mounted in the root layout — note `react-hot-toast` is also a dependency but sonner is the standard).
- Animations use framer-motion and GSAP; forms use react-hook-form + zod.
- Unescaped quotes/apostrophes in JSX break the ESLint build — use `&apos;` / `&quot;` in JSX text (`fix_quotes.js` exists as a one-off fixer for this).
- Security headers and `noindex` for `/admin/*` are set in `next.config.ts`.
