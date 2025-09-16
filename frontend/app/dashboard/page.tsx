import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { ManagerPerformance } from "@/components/manager-performance"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import data from "./data.json"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="flex flex-col gap-6 px-4 lg:px-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Manager Insights
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Explore how your leadership team performs across deal flow,
                    consistency, and coaching impact. Switch views to reveal the
                    stories behind the numbers.
                  </p>
                </div>
                <ManagerPerformance />
                <div className="grid gap-6 lg:grid-cols-7">
                  <div className="lg:col-span-4">
                    <ChartAreaInteractive />
                  </div>
                  <div className="lg:col-span-3">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                      <h3 className="text-lg font-semibold">Spotlight Metrics</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        A curated snapshot of the KPIs that differentiate the
                        top-performing managers this month. Use them to guide
                        coaching conversations and celebrate wins.
                      </p>
                      <ul className="mt-4 space-y-3 text-sm">
                        <li className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Win rate surge
                          </span>
                          <span className="font-semibold text-emerald-500">
                            +6.4%
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Coaching touchpoints
                          </span>
                          <span className="font-semibold text-sky-500">
                            42 / month
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Ramp efficiency
                          </span>
                          <span className="font-semibold text-purple-500">
                            88 days
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Retention health
                          </span>
                          <span className="font-semibold text-amber-500">
                            95%
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
