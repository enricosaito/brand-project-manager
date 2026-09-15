import { redirect } from "next/navigation"

import { TOOLS } from "@/lib/tools/registry"

/** Tools live in the sidebar; the bare /tools URL opens the first one. */
export default function ToolsIndex() {
  redirect(`/tools/${TOOLS[0].slug}`)
}
