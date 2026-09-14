"use client"

import * as React from "react"

import { AssetLibrary } from "@/components/assets/asset-library"

export default function ProjectAssetsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = React.use(params)
  return <AssetLibrary projectId={projectId} />
}
