"use client"

import { PageContainer } from "@/components/app/app-shell"
import { PageHeader } from "@/components/app/page-header"
import { AssetLibrary } from "@/components/assets/asset-library"

export function AssetsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Assets"
        description="Every image, film, document and design file across your projects."
      />
      <div className="mt-8">
        <AssetLibrary />
      </div>
    </PageContainer>
  )
}
