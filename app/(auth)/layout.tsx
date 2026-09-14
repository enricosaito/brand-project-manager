import Image from "next/image"
import Link from "next/link"

import { Logo } from "@/components/app/logo"
import { unsplash } from "@/data/images"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,32rem)_1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <Link href="/" className="flex w-fit items-center gap-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/30 rounded-md">
          <Logo />
          <span className="font-heading text-[15px] font-medium tracking-tight">
            Marcados
          </span>
        </Link>
        <div className="flex flex-1 items-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-xs text-muted-foreground">
          A creative workspace for brand teams.
        </p>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src={unsplash("1561070791-2526d30994b5", 2000)}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 0px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
        <figure className="absolute right-12 bottom-12 left-12 max-w-xl text-white">
          <blockquote className="font-heading text-2xl leading-snug font-medium text-balance">
            Every asset, task and decision for a brand, in one calm place.
          </blockquote>
          <figcaption className="mt-3 text-sm text-white/70">Silva Gym · Brand team</figcaption>
        </figure>
      </div>
    </div>
  )
}
