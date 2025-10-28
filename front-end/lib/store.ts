import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Project, FilterState } from "./types"

interface AppStore {
  // User state
  user: User | null
  isAuthenticated: boolean

  // UI state
  theme: "light" | "dark"
  sidebarOpen: boolean
  commandPaletteOpen: boolean

  // Projects state
  projects: Project[]
  currentProject: Project | null
  filters: FilterState
  userProjects: Project[]

  // Actions
  setUser: (user: User | null) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  setTheme: (theme: "light" | "dark") => void
  toggleSidebar: () => void
  toggleCommandPalette: () => void
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setFilters: (filters: FilterState) => void
  addProject: (project: Project) => void
  logout: () => void
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      theme: "dark",
      sidebarOpen: true,
      commandPaletteOpen: false,
      projects: [],
      currentProject: null,
      filters: {},
      userProjects: [],

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setProjects: (projects) => set({ projects }),
      setCurrentProject: (currentProject) => set({ currentProject }),
      setFilters: (filters) => set({ filters }),
      addProject: (project) => set((state) => ({ userProjects: [project, ...state.userProjects] })),
      logout: () => set({ user: null, isAuthenticated: false, currentProject: null, userProjects: [] }),
    }),
    {
      name: "gimme-idea-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        userProjects: state.userProjects,
      }),
    },
  ),
)
