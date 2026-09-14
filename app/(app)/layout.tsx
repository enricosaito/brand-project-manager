import { AppShell } from "@/components/app/app-shell"
import { WorkspaceProvider } from "@/lib/store/workspace"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  )
}
