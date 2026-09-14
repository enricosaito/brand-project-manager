"use client"

import * as React from "react"
import Image, { type ImageProps } from "next/image"

import { cn } from "@/lib/utils"

/**
 * next/image that fades in once loaded and sits on a muted surface, so
 * layouts never flash empty white boxes while imagery streams in.
 */
export function FadeImage({
  className,
  alt,
  onLoad,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <Image
      alt={alt}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
      className={cn(
        "transition-[opacity,transform] duration-500 ease-out-quart",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      {...props}
    />
  )
}
