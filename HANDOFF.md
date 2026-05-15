# CRM Project Handoff

Date: 2026-05-15
Owner: BVA team
Status: Phase 1 started, scaffold ready

## 1. Project Intent
Build a separate CRM application for prospecting and training project pipeline management.
This is NOT a module inside BVA app. It is a separate app/repo/deployment.

## 2. Scope Decisions (Locked)
- Product name for now: CRM
- Architecture: separate project from BVA
- Deployment model: separate Vercel project
- Source control model: separate GitHub repository
- Data model direction: prospecting_* tables
- Forecasting metric: training days + weighted days
- Multi-user: at least 2 users from day 1

## 3. What Is Already Done
- Separate local app scaffold created in this folder.
- Next.js 16 + React 19 + TypeScript + Tailwind 4 installed.
- Supabase packages installed:
  - @supabase/supabase-js
  - @supabase/ssr
- Base env template created: .env.example
- Theme tokens created: src/lib/theme.ts
- Supabase client helpers created: src/lib/supabase.ts
- Starter page rebranded from default Next template to CRM Phase 1 screen.
- Build check passed: npm run build

## 4. Key Files to Keep
- .env.example
- src/lib/theme.ts
- src/lib/supabase.ts
- src/app/layout.tsx
- src/app/page.tsx
- next.config.ts

## 5. Current State Validation
- Local build status: PASS
- Blocking issues: none
- Warnings:
  - npm audit reports 2 moderate vulnerabilities (not blocking for scaffold)

## 6. Immediate Next Steps (After Repo Split)
1. Move this folder out of BVA repository (to standalone location).
2. Initialize Git in standalone location.
3. Create and connect remote GitHub repository for CRM.
4. Push first commit.
5. Import CRM repo into Vercel as separate project.
6. Add environment variables in Vercel.
7. Start Phase 2: create database migration and first API routes.

## 7. Exact Commands (Windows PowerShell)

### 7.1 Move folder outside BVA
```powershell
# Example target path, adjust if needed
Move-Item "C:\Users\pksia\Dropbox\BVA\crm" "C:\Users\pksia\Dropbox\crm"
Set-Location "C:\Users\pksia\Dropbox\crm"
```

### 7.2 Initialize separate git repo
```powershell
git init
git add .
git commit -m "chore: initial CRM scaffold (phase 1)"
```

### 7.3 Connect GitHub remote and push
```powershell
# Replace with your repo URL
git remote add origin https://github.com/<org-or-user>/crm.git
git branch -M main
git push -u origin main
```

## 8. Vercel Setup Checklist
- Import project from GitHub repository: crm
- Framework: Next.js
- Build command: npm run build
- Output: .next
- Add env vars:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - NEXT_PUBLIC_BVA_API_URL (optional for integration stage)

## 9. Phase 2 Entry Criteria
Phase 2 starts when all are true:
- Separate GitHub repo exists and is connected
- Separate Vercel project exists
- Env vars are set
- Main branch deploy succeeds

## 10. Phase 2 First Tasks
- Add SQL migration for prospecting tables.
- Add API route: /api/v1/prospecting/opportunities
- Add basic auth/session guard using Supabase SSR.
- Add dashboard data endpoint for KPI cards.

---
If context is lost, start by reading this file first.
