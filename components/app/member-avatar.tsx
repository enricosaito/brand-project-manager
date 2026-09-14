import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Member } from "@/lib/types"
import { cn } from "@/lib/utils"

const SIZE = {
  xs: "size-5 text-[10px]",
  sm: "size-6 text-[11px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
} as const

interface MemberAvatarProps {
  member?: Member
  size?: keyof typeof SIZE
  className?: string
  withTooltip?: boolean
}

/**
 * Initials avatar. Intentionally monochrome so imagery stays the only source
 * of color on a page.
 */
export function MemberAvatar({
  member,
  size = "md",
  className,
  withTooltip = false,
}: MemberAvatarProps) {
  const avatar = (
    <Avatar
      className={cn(
        SIZE[size],
        "after:border-foreground/10 after:mix-blend-normal dark:after:border-foreground/15",
        className
      )}
    >
      <AvatarFallback
        className={cn(
          "bg-secondary font-medium tracking-wide text-foreground/80",
          "text-[length:inherit]"
        )}
      >
        {member?.initials ?? "–"}
      </AvatarFallback>
    </Avatar>
  )

  if (!withTooltip || !member) return avatar

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        {avatar}
      </TooltipTrigger>
      <TooltipContent>{member.name}</TooltipContent>
    </Tooltip>
  )
}
