"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  RiArrowDownSLine,
  RiBookOpenLine,
  RiCheckLine,
  RiFolder3Line,
  RiImage2Line,
  RiLogoutBoxRLine,
  RiMoonLine,
  RiSparklingLine,
  RiSunLine,
  RiUser3Line,
} from "@remixicon/react"
import { useTheme } from "next-themes"

import { signOut } from "@/app/(auth)/login/actions"
import { Logo } from "@/components/app/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { AuthUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

const WORKSPACES = [
  { id: "silva", name: "Silva Gym", initials: "SG", color: "#F2460D" },
  { id: "personal", name: "Personal", initials: "P", color: "#1F1BE4" },
]

const NAV = [
  { href: "/projects", label: "Projects", icon: RiFolder3Line },
  { href: "/assets", label: "Assets", icon: RiImage2Line },
]

const FUTURE = [
  { label: "AI Studio", icon: RiSparklingLine },
  { label: "Brand Library", icon: RiBookOpenLine },
]

interface SidebarProps {
  user: AuthUser
  /** Icon-only rail for medium widths. */
  collapsed?: boolean
  /** Called after navigation, used to close the mobile sheet. */
  onNavigate?: () => void
  className?: string
}

export function Sidebar({
  user,
  collapsed = false,
  onNavigate,
  className,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        collapsed ? "w-14 items-center px-2" : "w-60 px-3",
        className
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center",
          collapsed ? "justify-center" : "px-2"
        )}
      >
        <Link
          href="/projects"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <Logo />
          {!collapsed && (
            <span className="font-heading text-[15px] font-medium tracking-tight">
              Marcados
            </span>
          )}
        </Link>
      </div>

      {/* Workspace switcher */}
      <WorkspaceSwitcher collapsed={collapsed} />

      {/* Navigation */}
      <nav className="mt-6 flex flex-1 flex-col gap-6">
        <NavGroup label="Workspace" collapsed={collapsed}>
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
                collapsed={collapsed}
                onClick={onNavigate}
              />
            )
          })}
        </NavGroup>

        <NavGroup label="Future" collapsed={collapsed}>
          {FUTURE.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              disabled
            />
          ))}
        </NavGroup>
      </nav>

      {/* Footer */}
      <SidebarFooter user={user} collapsed={collapsed} />
    </div>
  )
}

function NavGroup({
  label,
  collapsed,
  children,
}: {
  label: string
  collapsed: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col", collapsed ? "items-center gap-1" : "gap-0.5")}>
      {collapsed ? (
        <div className="mb-1 h-px w-6 bg-sidebar-border" aria-hidden />
      ) : (
        <div className="text-label mb-2 px-2.5 text-muted-foreground/80">{label}</div>
      )}
      {children}
    </div>
  )
}

interface NavItemProps {
  href?: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
  disabled?: boolean
  collapsed: boolean
  onClick?: () => void
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  disabled,
  collapsed,
  onClick,
}: NavItemProps) {
  const base = cn(
    "group/nav relative flex h-8 items-center gap-2.5 rounded-md text-[13px] outline-none transition-colors duration-150",
    collapsed ? "w-9 justify-center" : "px-2.5",
    disabled
      ? "cursor-default text-muted-foreground/60"
      : active
        ? "bg-sidebar-accent font-medium text-foreground"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
  )

  const content = (
    <>
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-foreground" : "text-muted-foreground group-hover/nav:text-foreground",
          disabled && "text-muted-foreground/50 group-hover/nav:text-muted-foreground/50"
        )}
      />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && disabled && (
        <span className="ml-auto text-[10px] font-medium tracking-wide text-muted-foreground/60 uppercase">
          Soon
        </span>
      )}
    </>
  )

  const node =
    href && !disabled ? (
      <Link href={href} onClick={onClick} className={base} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    ) : (
      <div className={base} aria-disabled={disabled}>
        {content}
      </div>
    )

  if (!collapsed) return node

  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>{node}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
        {disabled ? " · Coming soon" : ""}
      </TooltipContent>
    </Tooltip>
  )
}

function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const [current, setCurrent] = React.useState(WORKSPACES[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-9 items-center gap-2.5 rounded-md text-left text-[13px] outline-none transition-colors hover:bg-sidebar-accent/70 focus-visible:ring-3 focus-visible:ring-ring/30 aria-expanded:bg-sidebar-accent",
          collapsed ? "w-9 justify-center" : "w-full px-2"
        )}
      >
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold text-white"
          style={{ backgroundColor: current.color }}
        >
          {current.initials}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate font-medium">{current.name}</span>
            <RiArrowDownSLine className="size-4 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={collapsed ? "right" : "bottom"}
        className="w-56"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {WORKSPACES.map((ws) => (
            <DropdownMenuItem key={ws.id} onClick={() => setCurrent(ws)}>
              <span
                className="flex size-5 items-center justify-center rounded-[5px] text-[10px] font-semibold text-white"
                style={{ backgroundColor: ws.color }}
              >
                {ws.initials}
              </span>
              <span className="flex-1">{ws.name}</span>
              {ws.id === current.id && <RiCheckLine className="text-muted-foreground" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Create workspace</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SidebarFooter({ user, collapsed }: { user: AuthUser; collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 border-t border-sidebar-border py-3",
        collapsed ? "flex-col" : "px-1"
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-md text-left outline-none transition-colors hover:bg-sidebar-accent/70 focus-visible:ring-3 focus-visible:ring-ring/30 aria-expanded:bg-sidebar-accent",
            collapsed ? "size-8 justify-center" : "h-10 flex-1 px-1.5"
          )}
        >
          <Avatar className="size-6 text-[11px] after:border-foreground/10 after:mix-blend-normal">
            <AvatarFallback className="bg-secondary font-medium tracking-wide text-foreground/80 text-[length:inherit]">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium">{user.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
            </div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side={collapsed ? "right" : "top"}
          sideOffset={8}
          className="w-60"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
            <DropdownMenuItem disabled>
              <RiUser3Line />
              Account settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <RiLogoutBoxRLine />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ThemeToggle />
    </div>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(dark ? "light" : "dark")}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 outline-none"
          />
        }
      >
        {dark ? <RiSunLine className="size-4" /> : <RiMoonLine className="size-4" />}
      </TooltipTrigger>
      <TooltipContent side="top">Toggle theme · D</TooltipContent>
    </Tooltip>
  )
}
