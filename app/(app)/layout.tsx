import { redirect } from "next/navigation"

import { AppShell } from "@/components/app/app-shell"
import { toAuthUser } from "@/lib/auth"
import { WorkspaceProvider } from "@/lib/store/workspace"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The proxy already redirects, this is defence in depth.
  if (!user) redirect("/login")

  return (
    <WorkspaceProvider>
      <AppShell user={toAuthUser(user)}>{children}</AppShell>
    </WorkspaceProvider>
  )
}
