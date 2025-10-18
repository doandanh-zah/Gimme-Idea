"use client"

import { useEffect, useState } from "react"
import { useProjectStore } from "@/lib/stores/project-store"
import MatrixBackground from "@/components/matrix-background"
import Header from "@/components/layout/header"
import ProjectCard from "@/components/features/project-card"
import ProjectFilters from "@/components/features/project-filters"
import { Search, Loader2 } from "lucide-react"

export default function BrowsePage() {
  const { projects, pagination, isLoading, fetchProjects, setFilters, filters } = useProjectStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch projects on mount and when filters change
  useEffect(() => {
    fetchProjects({ ...filters, search: debouncedSearch })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, JSON.stringify(filters)])

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <>
      <MatrixBackground />
      <Header />

      <div className="relative z-10 min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-primary mb-4">Browse Projects</h1>
            <p className="text-gray text-lg">Discover amazing ideas and provide valuable feedback</p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" size={20} />
              <input
                type="text"
                placeholder="Search projects by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-input border-2 border-transparent rounded-lg pl-12 pr-4 py-4 text-white placeholder:text-gray focus:border-primary focus:outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className="w-64 flex-shrink-0">
              <ProjectFilters />
            </aside>

            {/* Projects Grid */}
            <main className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-primary" size={48} />
                </div>
              ) : !projects || projects.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray text-xl">No projects found</p>
                  <p className="text-gray mt-2">Try adjusting your filters or search query</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 bg-input text-white rounded hover:bg-primary hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded transition-all duration-300 ${
                            page === pagination.page
                              ? "bg-primary text-black font-bold"
                              : "bg-input text-white hover:bg-primary hover:text-black"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 bg-input text-white rounded hover:bg-primary hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
