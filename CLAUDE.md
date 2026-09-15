# Marcados — project instructions

Marcados is a creative workspace for brand teams: workspaces → projects →
assets, tasks, activity. Auth, data and file storage run on Supabase. The
original mock dataset is kept alive under `/demo` as a design reference.
Read `README.md` for the product overview and `AGENTS.md` for the Next.js
version warning (this Next 16 differs from older training data; check
`node_modules/next/dist/docs/` before using an API you are unsure of).

## Stack

Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · shadcn/ui on
**Base UI** (not Radix) · Remix Icon · Supabase (`@supabase/ssr`) · next-themes.
Fonts: Geist (UI), Space Grotesk (display), Geist Mono.

## Commands

```bash
npm run dev          # usually already running on :3000 (see Gotchas)
npm run typecheck    # tsc --noEmit — run after every change
npm run build        # next build — run before opening a PR
npm run format       # prettier
```

`npm run lint` currently crashes (ESLint 10 vs the react plugin bundled in
eslint-config-next). Don't spend time on it; rely on typecheck + build.

## Architecture

```
app/(auth)/login          sign in / sign up page + server actions (actions.ts)
app/auth/callback         completes Supabase email links
app/(app)/layout.tsx      auth gate → resolves workspaces → loads a WorkspaceSnapshot
                          → <WorkspaceProvider mode="live"> + AppShell
app/(app)/projects, assets, projects/[projectId]/{,assets,tasks,activity}
                          thin route files; bodies live in components/*-page(s).tsx
app/(app)/demo/**         same routes, wrapped in <WorkspaceProvider mode="demo">
                          seeded from data/snapshot.ts (nested provider wins)
app/(app)/workspace-actions.ts  switchWorkspace, createWorkspace, seedSampleData
app/(app)/tools, tools/[tool]   browser-only image tools (registry-driven routes)
components/tools/         tool-shell (ToolPage, ToolLayout, ImageDropzone, OutputActions),
                          save-to-project, and one file per tool
lib/tools/                registry, image (bitmap/canvas/encode/download), palette (median cut),
                          pdf (pdf-lib), background (isolated engine wrapper)
components/app            shell + shared primitives (sidebar, page-header, empty-state, field, filter-select…)
components/{projects,assets,tasks,activity,auth,workspace}
components/ui             shadcn primitives (generated; radii were reduced on purpose)
data/                     mock dataset — only the demo snapshot and seedSampleData import it
lib/types.ts              domain entities (Workspace, Member, Project, Asset, Task, ActivityEvent)
lib/store/workspace.tsx   THE seam: reducer + selector hooks + actions; live mode persists
                          through lib/supabase/repo.ts with optimistic update + rollback
lib/supabase/rows.ts      DB row types + mappers (the only place that knows column names)
lib/supabase/queries.ts   server: workspace resolution (cookie), snapshot loading
lib/supabase/repo.ts      browser: inserts/updates/deletes used by the store
lib/supabase/storage.ts   browser: uploads, media probing (dimensions, video poster), object paths
lib/supabase/{client,server,proxy}.ts  clients per context
supabase/migrations/      schema + RLS + storage policies (apply with SQL editor or `supabase db push`)
proxy.ts                  Next 16 "proxy" (renamed middleware): session refresh + auth redirects
```

Rules that keep this maintainable:

- Components read data through hooks (`useProjects`, `useAssets(projectId)`,
  `useTasks`, `useActivity`, `useProjectStats`) and mutate through
  `useWorkspace().actions`. Components never call Supabase for data; only the
  store (`repo.ts`) and upload UI (`storage.ts`) talk to it in the browser.
- Links inside store-backed pages must use `useBasePath()` so they work under
  `/demo` too.
- Column names stay inside `lib/supabase/rows.ts`; schema changes = new file in
  `supabase/migrations/` + mapper update + `lib/types.ts` if the UI shape changes.
- RLS is the security boundary: every content table is guarded by
  `is_workspace_member(workspace_id)`. New tables must carry `workspace_id`
  and the same policy pair. Storage objects live under `<workspace_id>/...`.
- One asset UI system: `components/assets/asset-library.tsx` serves both the
  project tab and the global library. Do not fork it.
- Project detail tabs are nested routes, not client tabs. Keep them deep-linkable.
- `params` and `searchParams` are Promises (`React.use(params)` in client
  components, `await params` in server components).
- Supabase: create a new server client per request; never share across requests.
  The proxy's `getUser()` call is what refreshes sessions, don't move logic
  between client creation and that call.
- The `(app)` layout wraps everything (including `/demo`) in the live provider
  because moving route folders while `next dev` runs fails on Windows. A
  `(live)` route group is the intended cleanup once the dev server is stopped.
- Tools are client-only and stateless: load files → Canvas/WASM → Blob.
  Add a tool by registering it in `lib/tools/registry.ts`, writing a
  component that uses `ImageDropzone` + `ToolLayout` + `OutputActions`, and
  mapping it in `app/(app)/tools/[tool]/page.tsx`. "Save to project" reuses
  the asset upload pipeline. AVIF is encoded with jSquash's WASM encoder
  loaded at runtime from jsDelivr (see `loadAvifEncoder` in
  `lib/tools/image.ts`); everything else uses `canvas.toBlob`. Do NOT add
  `@jsquash/avif` as an npm dependency: Turbopack's production build hangs
  indefinitely on its WASM/worker graph (bisected 2026-09-14).
- **Licensing flag:** `@imgly/background-removal` (used by
  `lib/tools/background.ts`) is AGPL-3.0. Before charging customers, buy an
  IMG.LY commercial licence or swap the engine (the wrapper is the only
  touchpoint). The multi-workspace switcher is hidden behind
  `SHOW_WORKSPACE_SWITCHER` in the sidebar until team features return.

## Design rules (this is a premium creative tool, not SaaS)

- Warm neutral palette, one accent (`--brand`, coral), semantic `--success` /
  `--warning`. Imagery carries the colour; UI stays quiet.
- Status = small dot + text (`StatusBadge`), not loud badges. Priority = the
  three-bar glyph. No KPI cards.
- Type scale via `text-display` / `text-title` / `text-label` utilities;
  headings use `font-heading` automatically for h1–h3.
- Radius scale: buttons/inputs `rounded-lg`, cards `rounded-xl`, dialogs
  `rounded-2xl`. Don't reintroduce pill shapes.
- Motion: 150–500 ms, opacity/transform/colour only, `ease-out-quart`.
  `animate-in` from tw-animate-css for entrances. Nothing decorative.
- Every list needs a designed empty state (`EmptyState`), every image goes
  through `FadeImage` on a `bg-muted` surface.
- Sidebar: full ≥ lg, icon rail at md, sheet below md. Desktop first, but
  check tablet and ~420px before calling a screen done.

## Gotchas learned the hard way

- A dev server is normally already running on port 3000 (user-owned) and a
  second `next dev` refuses to start. Reuse :3000 for checks.
- Base UI menus: `DropdownMenuLabel` must sit inside `DropdownMenuGroup` or
  `DropdownMenuRadioGroup`, otherwise the menu throws at open time.
- Base UI `Select` needs `items={options}` on the root for the trigger to show
  labels; see `components/app/filter-select.tsx`.
- Don't combine `aspect-ratio` with `max-height` on a full-width box: the
  width shrinks. Use explicit responsive heights.
- Unsplash IDs must be checked **visually** (render a contact sheet) — an HTTP
  200 says nothing about what the photo shows. Only use IDs already present in
  `data/images.ts` / `data/assets.ts` unless you have looked at the new one.
- Supabase rejects `example.com` sign-ups; use a Gmail plus-alias of the
  owner's address for QA. Email confirmation is enabled on the project.
- The Supabase CLI login on this machine does NOT have access to the Marcados
  project, so `supabase link` / `db push` fail. Apply migrations through the
  dashboard SQL editor (the app shows a "Database not set up" screen until
  then). `supabase start` works locally when Docker Desktop is running and
  applies `supabase/migrations/` automatically.
- Windows: the shell is Git Bash. Prefer the Read/Edit/Write tools for TSX;
  `sed` is fine for simple renames.
- Local verification loop: start Docker Desktop, `supabase start`, then
  `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local> npx next build && npx next start -p 3111`
  (shell env beats `.env.local`; `next start` avoids the dev-server lock).
  `next.config.ts` enables `images.dangerouslyAllowLocalIP` only when the
  Supabase host is local, because the optimizer blocks private IPs.
- RLS policies alone are not enough: tables need `grant … to authenticated`
  or PostgREST answers 42501. The initial migration includes the grants.
- In screenshot scripts, tab labels include counts ("Tasks 4") and the sidebar
  has an "Assets" link too — click tabs by `a[href$='/tasks']`, not by text.

## Verifying UI work

Typecheck, build, then look at it. Headless Chrome is available at
`C:/Program Files/Google/Chrome/Application/chrome.exe`; a small CDP driver
(Node 22 native WebSocket) that clicks, types, hovers and screenshots was used
for QA — recreate it in the scratchpad when needed rather than adding
Playwright to the repo. Check light and dark (press `d` in the app), desktop,
tablet (900px) and phone (420px).

## Git and deployment

- Work on a branch, open a PR, merge to `main`. Vercel project
  `brand-project-manager` (team "Silva Gym") auto-deploys `main` to
  https://brand-project-manager.vercel.app.
- Commit messages: conventional prefix (`feat:`, `fix:`, `chore:`), body
  explains the why.
- Never commit `.env.local`. `.env.example` lists the required vars:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. They must
  also exist in Vercel or every route 500s (the proxy reads them per request).
- Supabase Auth → URL Configuration must list `<origin>/auth/callback` for
  localhost and production, and Site URL must be the production domain.

## Roadmap (agreed order)

1. ~~Database schema + RLS~~ (done: `supabase/migrations/20260914000000_initial.sql`)
2. ~~Supabase-backed store~~ (done: snapshot on load, optimistic writes + rollback)
3. ~~Real uploads via Storage~~ (done: public `assets` bucket, browser-side video posters)
4. ~~Solo tools~~ (done: convert, compress, resize, social crop, background
   removal, colour extraction, image→PDF under `/tools`)
5. More solo tools / polish: batch background removal, favicon & app-icon
   generator, EXIF stripping, brand-colour contrast checker, saving tool
   presets per workspace
6. Auth polish: password reset, Google sign-in, account settings
7. Workspaces & team: rename/colour, members, invitations, roles in RLS
   (switcher currently hidden)
8. Data loading beyond one snapshot: per-page queries, pagination, realtime
9. AI Studio: auto-tagging and semantic asset search first
