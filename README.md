# Marcados — Brand Workspace

A UI-first prototype of a creative workspace for brand projects and their
assets. No backend, no auth, no database: everything runs on local mock data
so the product concept, information architecture and visual language can be
established before infrastructure is introduced.

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
