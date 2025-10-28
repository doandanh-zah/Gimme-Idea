"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { ProjectCard } from "@/components/dashboard/project-card"
import { Button } from "@/components/ui/button"
import { Plus, FolderOpen } from "lucide-react"
import { useState } from "react"
import { LaunchProjectModal } from "@/components/dashboard/launch-project-modal"

export default function MyProjectsPage() {
  const router = useRouter()
  const isAuthenticated = useStore((state) => state.isAuthenticated)
  const userProjects = useStore((state) => state.userProjects)
  const [launchModalOpen, setLaunchModalOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex pt-16">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">My Projects</h1>
                <p className="text-muted-foreground">Manage and track your submitted projects</p>
              </div>
              <Button
                onClick={() => setLaunchModalOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Launch New Project
              </Button>
            </div>

            {/* Projects Grid */}
            {userProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 md:py-24">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                  <FolderOpen className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">No projects yet</h2>
                <p className="text-muted-foreground mb-6 text-center max-w-md px-4">
                  Launch your first project and start getting valuable feedback from the community
                </p>
                <Button onClick={() => setLaunchModalOpen(true)} className="bg-gradient-to-r from-primary to-secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Launch Your First Project
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <LaunchProjectModal open={launchModalOpen} onOpenChange={setLaunchModalOpen} />
    </div>
  )
}
