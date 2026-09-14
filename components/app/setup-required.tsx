import { RiDatabase2Line } from "@remixicon/react"

import { Logo } from "@/components/app/logo"

/**
 * Shown when the app can sign in but cannot read the workspace tables,
 * which almost always means the SQL migration has not been run yet.
 */
export function SetupRequired({ error }: { error: string }) {
  return (
    <div className="flex min-h-svh flex-col bg-background px-6 py-8 sm:px-12">
      <div className="flex items-center gap-2.5">
        <Logo />
        <span className="font-heading text-[15px] font-medium tracking-tight">Marcados</span>
      </div>
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-lg">
          <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <RiDatabase2Line className="size-5" />
          </div>
          <h1 className="text-display">Database not set up yet</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-pretty text-muted-foreground">
            Sign-in works, but the workspace tables are missing from this Supabase
            project. Apply the migration and refresh.
          </p>
          <ol className="mt-6 space-y-3 text-sm text-foreground/90">
            <li className="flex gap-3">
              <span className="font-mono text-xs text-muted-foreground">1</span>
              Open the Supabase dashboard → SQL editor.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-muted-foreground">2</span>
              <span>
                Paste the contents of{" "}
                <code className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-xs">
                  supabase/migrations/20260914000000_initial.sql
                </code>{" "}
                and run it.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-muted-foreground">3</span>
              Reload this page.
            </li>
          </ol>
          <details className="mt-8 text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none">Technical details</summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-secondary p-3 font-mono whitespace-pre-wrap">
              {error}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}
