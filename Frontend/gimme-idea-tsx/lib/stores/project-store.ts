// Zustand store for project state

import { create } from "zustand"
import { apiClient } from "@/lib/api-client"
import type { Project, ProjectFilters } from "@/lib/types"

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  filters: ProjectFilters
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isLoading: boolean
  error: string | null

  // Actions
  fetchProjects: (params?: ProjectFilters) => Promise<void>
  fetchProjectById: (id: string) => Promise<void>
  createProject: (data: any) => Promise<Project>
  updateProject: (id: string, data: any) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  bookmarkProject: (id: string) => Promise<void>
  setFilters: (filters: Partial<ProjectFilters>) => void
  clearError: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  filters: {
    page: 1,
    limit: 12,
  },
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,

  fetchProjects: async (params?: ProjectFilters) => {
    set({ isLoading: true, error: null })
    try {
      const filters = { ...get().filters, ...params }
      const response = await apiClient.getProjects(filters)

      set({
        projects: response.projects || response.data || [],
        pagination: response.pagination,
        filters,
        isLoading: false,
      })

      console.log("[v0] ✅ Projects fetched:", response.projects?.length || 0)
    } catch (error: any) {
      console.error("[v0] ❌ Fetch projects failed:", error)
      set({
        error: error.message || "Failed to fetch projects",
        isLoading: false,
      })
    }
  },

  fetchProjectById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.getProjectById(id)
      const project = response.project || response
      await apiClient.incrementProjectView(id)

      set({
        currentProject: project,
        isLoading: false,
      })

      console.log("[v0] ✅ Project fetched:", project.title)
    } catch (error: any) {
      console.error("[v0] ❌ Fetch project failed:", error)
      set({
        error: error.message || "Failed to fetch project",
        isLoading: false,
      })
    }
  },

  createProject: async (data: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.createProject(data)
      // Backend returns { project: {...} }
      const project = response.project || response

      set({ isLoading: false })
      console.log("[v0] ✅ Project created:", project.title)

      return project
    } catch (error: any) {
      console.error("[v0] ❌ Create project failed:", error)
      set({
        error: error.message || "Failed to create project",
        isLoading: false,
      })
      throw error
    }
  },

  updateProject: async (id: string, data: any) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.updateProject(id, data)
      const project = response.project || response

      set({
        currentProject: project,
        isLoading: false,
      })

      console.log("[v0] ✅ Project updated")
    } catch (error: any) {
      console.error("[v0] ❌ Update project failed:", error)
      set({
        error: error.message || "Failed to update project",
        isLoading: false,
      })
      throw error
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.deleteProject(id)

      set({
        projects: get().projects.filter((p) => p.id !== id),
        isLoading: false,
      })

      console.log("[v0] ✅ Project deleted")
    } catch (error: any) {
      console.error("[v0] ❌ Delete project failed:", error)
      set({
        error: error.message || "Failed to delete project",
        isLoading: false,
      })
      throw error
    }
  },

  bookmarkProject: async (id: string) => {
    try {
      await apiClient.bookmarkProject(id)

      // Update local state
      set({
        projects: get().projects.map((p) => (p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p)),
      })

      console.log("[v0] ✅ Project bookmark toggled")
    } catch (error: any) {
      console.error("[v0] ❌ Bookmark failed:", error)
    }
  },

  setFilters: (filters: Partial<ProjectFilters>) => {
    set({ filters: { ...get().filters, ...filters } })
  },

  clearError: () => set({ error: null }),
}))
