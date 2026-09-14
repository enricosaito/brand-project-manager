# Marcados — Brand Workspace

A creative workspace for brand projects and their assets. Authentication runs
on Supabase; projects, assets, tasks and activity still run on local mock data
so the product concept, information architecture and visual language could be
established before the data layer is introduced.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 with shadcn/ui components on top of Base UI
- Remix Icon, Geist (UI) + Space Grotesk (display), next-themes

```bash
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

Press <kbd>d</kbd> anywhere to toggle dark mode.

## Authentication (Supabase)

Email + password auth via Supabase, using `@supabase/ssr` cookies.

1. Copy `.env.example` to `.env.local` and fill in the project URL and
   publishable key (Supabase → Project Settings → API).
2. In Supabase → Authentication → URL Configuration set **Site URL** to your
   app origin and add `<origin>/auth/callback` to **Redirect URLs** (do this
   for `http://localhost:3000` and the production domain).
3. Add the same two env vars to the Vercel project before deploying.

How it fits together:

- `proxy.ts` refreshes the session on every request and redirects signed-out
  visitors to `/login` (and signed-in visitors away from it).
- `app/(auth)/login` holds the sign in / sign up screen and server actions.
- `app/auth/callback` completes email confirmation links.
- `app/(app)/layout.tsx` loads the user server-side and passes it to the shell.
- `lib/supabase/{client,server,proxy}.ts` create the right client per context.

## Structure

```
app/(app)/                 App shell (sidebar) + routed pages
  projects/                Project list
  projects/[projectId]/    Project detail: overview, assets, tasks, activity
  assets/                  Global asset library
components/
  app/                     Shell + shared primitives (sidebar, headers, empty state…)
  projects/ assets/ tasks/ activity/
  ui/                      shadcn/ui primitives (generated, lightly restyled)
data/                      Mock data (projects, assets, tasks, activity, members)
lib/types.ts               Domain entities: Project, Asset, Task, ActivityEvent, Member
lib/store/workspace.tsx    Client-side store: state + actions + selector hooks
lib/labels.ts, format.ts   Display labels, status colors, date/size formatting
```

## Data flow (backend-ready, not backend-built)

Components never import mock data directly. They read through selector hooks
(`useProjects`, `useAssets(projectId)`, `useTasks`, `useActivity`, …) and
mutate through `useWorkspace().actions` (`createProject`, `addAsset`,
`updateTask`, …). Activity events are logged by the actions themselves.

To introduce a real backend, replace the reducer-backed implementation in
`lib/store/workspace.tsx` with an API-backed one (React Query, server actions,
etc.). The hook signatures and entity types stay the same, so pages and
components do not change.

## Design notes

- Warm neutral palette, one coral accent (`--brand`), semantic `--success` /
  `--warning`. Imagery carries the visual richness.
- Editorial hierarchy: `text-display` / `text-title` / `text-label` utilities.
- Motion is limited to 150–500ms opacity, transform and color transitions.
- Sidebar collapses to an icon rail at tablet widths and a sheet on phones.
- "AI Studio" and "Brand Library" are visible in navigation as coming soon;
  the layout leaves room for contextual AI actions later.
