"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FolderOpen, Compass, Sparkles, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "My Projects", href: "/dashboard/my-projects", icon: FolderOpen },
  { name: "Discover", href: "/dashboard", icon: Compass },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const sidebarOpen = useStore((state) => state.sidebarOpen)
  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const user = useStore((state) => state.user)

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 bg-card border-r border-border transition-all duration-300",
          "hidden md:block",
          sidebarOpen ? "w-64" : "w-16",
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Toggle button */}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto mb-4 hover:bg-muted">
            <ChevronLeft className={cn("w-5 h-5 transition-transform", !sidebarOpen && "rotate-180")} />
          </Button>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* AI Credits */}
          {sidebarOpen && (
            <div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold">AI Credits</span>
              </div>
              <div className="text-2xl font-bold mb-1">{user?.aiCredits || 5}/5</div>
              <p className="text-xs text-muted-foreground">Free credits remaining</p>
            </div>
          )}
        </div>
      </aside>

      {/* Spacer */}
      <div className={cn("transition-all duration-300 hidden md:block", sidebarOpen ? "w-64" : "w-16")} />
    </>
  )
}
