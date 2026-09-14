# Marcados — project instructions

Marcados is a creative workspace for brand teams: projects → assets, tasks,
activity. Auth is real (Supabase). Projects/assets/tasks/activity are still
local mock data behind a store that is designed to be swapped for a database.
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
app/(auth)/login        sign in / sign up page + server actions (actions.ts)
app/auth/callback       completes Supabase email links
app/(app)/              authenticated shell; layout.tsx loads the user server-side
  projects, projects/[projectId]/{,assets,tasks,activity}, assets
components/app          shell + shared primitives (sidebar, page-header, empty-state, field, filter-select…)
components/{projects,assets,tasks,activity,auth}
components/ui           shadcn primitives (generated; radii were reduced on purpose)
data/                   mock data only — nothing else may import it except the store
lib/types.ts            domain entities (Project, Asset, Task, ActivityEvent, Member)
lib/store/workspace.tsx THE seam: reducer + selector hooks + actions
lib/labels.ts           enum labels + status dot colours
lib/format.ts           dates, bytes, relative time, ids
lib/supabase/           client.ts (browser), server.ts (RSC/actions/routes), proxy.ts (session refresh)
proxy.ts                Next 16 "proxy" (renamed middleware): session refresh + auth redirects
```

Rules that keep this maintainable:

- Components read data through hooks (`useProjects`, `useAssets(projectId)`,
  `useTasks`, `useActivity`, `useProjectStats`) and mutate through
  `useWorkspace().actions`. Never import `data/` in a component.
- When the database arrives, replace the internals of `lib/store/workspace.tsx`
  and keep the hook signatures and `lib/types.ts` shapes unchanged.
- One asset UI system: `components/assets/asset-library.tsx` serves both the
  project tab and the global library. Do not fork it.
- Project detail tabs are nested routes, not client tabs. Keep them deep-linkable.
- `params` and `searchParams` are Promises (`React.use(params)` in client
  components, `await params` in server components).
- Supabase: create a new server client per request; never share across requests.
  The proxy's `getUser()` call is what refreshes sessions, don't move logic
  between client creation and that call.

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
- Windows: the shell is Git Bash. Prefer the Read/Edit/Write tools for TSX;
  `sed` is fine for simple renames.

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

1. Database schema + RLS (workspaces, memberships, projects, assets, tasks, activity)
2. Replace the mock store internals with Supabase queries/mutations
3. Real uploads via Supabase Storage (+ thumbnails/posters)
4. Workspaces, members, invitations
5. Auth polish: password reset, Google sign-in, account settings
6. AI Studio: auto-tagging and semantic asset search first
