import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { ProjectsGrid } from "@/components/dashboard/projects-grid"
import { RightPanel } from "@/components/dashboard/right-panel"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="flex pt-16">
        <DashboardSidebar />

        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Discover Projects</h1>
              <p className="text-muted-foreground">Explore amazing Web3 projects from the community</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ProjectsGrid />
              </div>
              <div className="hidden lg:block">
                <RightPanel />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
