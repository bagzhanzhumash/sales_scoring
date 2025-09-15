import { create } from "zustand"
import { devtools } from "zustand/middleware"

export interface ProjectFilters {
  status: "all" | "active" | "completed" | "pending" | "failed"
  dateRange: "7d" | "30d" | "90d" | "all"
  sortBy: "recent" | "name" | "progress" | "accuracy"
  sortOrder: "asc" | "desc"
  page: number
  limit: number
}

interface ProjectsState {
  filters: ProjectFilters
  searchTerm: string
  selectedIds: string[]
  viewMode: "grid" | "list"

  // Actions
  setFilters: (filters: Partial<ProjectFilters>) => void
  setSearchTerm: (term: string) => void
  toggleSelection: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  setViewMode: (mode: "grid" | "list") => void
  setInitialFilters: (initial: any) => void
}

export const useProjectsStore = create<ProjectsState>()(
  devtools(
    (set, get) => ({
      filters: {
        status: "all",
        dateRange: "all",
        sortBy: "recent",
        sortOrder: "desc",
        page: 1,
        limit: 20,
      },
      searchTerm: "",
      selectedIds: [],
      viewMode: "grid",

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters, page: 1 }, // Reset page when filters change
        })),

      setSearchTerm: (term) =>
        set(() => ({
          searchTerm: term,
          filters: { ...get().filters, page: 1 }, // Reset page when search changes
        })),

      toggleSelection: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedIds, id],
        })),

      selectAll: (ids) =>
        set(() => ({
          selectedIds: ids,
        })),

      clearSelection: () =>
        set(() => ({
          selectedIds: [],
        })),

      setViewMode: (mode) =>
        set(() => ({
          viewMode: mode,
        })),

      setInitialFilters: (initial) =>
        set((state) => ({
          filters: {
            ...state.filters,
            status: initial.status || "all",
            page: initial.page || 1,
          },
          searchTerm: initial.search || "",
        })),
    }),
    {
      name: "projects-store",
    },
  ),
)
