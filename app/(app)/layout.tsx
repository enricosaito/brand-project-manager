import { redirect } from "next/navigation"

import { AppShell } from "@/components/app/app-shell"
import { SetupRequired } from "@/components/app/setup-required"
import { StoreErrorBanner } from "@/components/app/store-error"
import { toAuthUser } from "@/lib/auth"
import { WorkspaceProvider, type WorkspaceSnapshot } from "@/lib/store/workspace"
import { getWorkspaceContext, loadWorkspaceSnapshot } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"
import type { Workspace } from "@/lib/types"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The proxy already redirects; this is defence in depth.
  if (!user) redirect("/login")
  const authUser = toAuthUser(user)

  let workspaces: Workspace[]
  let current: Workspace
  let snapshot: WorkspaceSnapshot
  try {
    const ctx = await getWorkspaceContext(authUser.name)
    workspaces = ctx.workspaces
    current = ctx.current
    snapshot = await loadWorkspaceSnapshot(ctx.supabase, current, user.id)
  } catch (error) {
    // Most likely the schema has not been applied to this Supabase project yet.
    return <SetupRequired error={error instanceof Error ? error.message : String(error)} />
  }

  return (
    <WorkspaceProvider mode="live" initialState={snapshot}>
      <AppShell user={authUser} workspaces={workspaces} currentWorkspaceId={current.id}>
        {children}
        <StoreErrorBanner />
      </AppShell>
    </WorkspaceProvider>
  )
}
