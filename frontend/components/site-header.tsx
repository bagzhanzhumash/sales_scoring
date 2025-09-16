"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface SimpleHeaderProps {
  title?: string
}

export function SimpleHeader({ title }: SimpleHeaderProps) {
  return (
    <header className="h-14 border-b flex items-center px-4">
      <h1 className="text-lg font-semibold">{title ?? "Dashboard"}</h1>
    </header>
  )
}

export function SiteHeader() {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Documents</h1>
      </div>
    </header>
  )
}
