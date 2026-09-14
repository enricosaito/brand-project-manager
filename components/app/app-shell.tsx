"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { RiMenuLine } from "@remixicon/react"

import { Logo } from "@/components/app/logo"
import { Sidebar } from "@/components/app/sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { AuthUser } from "@/lib/auth"

/**
 * Application frame.
 *
 * ≥ lg  full sidebar
 * md    icon rail
 * < md  top bar with a sheet-based navigation
 */
export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: AuthUser
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const isTablet = useMediaQuery("(min-width: 768px)")
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  // Close the mobile sheet on route change.
  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-svh w-full bg-background">
      {/* Sidebar (tablet and up) */}
      <aside className="sticky top-0 hidden h-svh shrink-0 border-r border-sidebar-border md:block">
        <Sidebar user={user} collapsed={isTablet && !isDesktop} />
      </aside>

      {/* Mobile top bar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-64 border-r-0 bg-sidebar p-0 sm:max-w-64"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar user={user} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <RiMenuLine />
          </Button>
          <div className="flex items-center gap-2">
            <Logo className="size-5" />
            <span className="font-heading text-[15px] font-medium tracking-tight">
              Marcados
            </span>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

/** Consistent page gutter and max width for top-level pages. */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={
        "mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 " +
        (className ?? "")
      }
    >
      {children}
    </div>
  )
}
