import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface ResultsFilters {
  status: "all" | "completed" | "review_needed" | "failed" | "processing"
  search: string
  minScore: number
  maxScore: number
  sortBy: "recent" | "score_high" | "score_low" | "name" | "confidence"
}

interface ResultsState {
  filters: ResultsFilters
  selectedIds: string[]
  viewMode: "table" | "grid"

  // Actions
  setFilters: (filters: Partial<ResultsFilters>) => void
  toggleSelection: (id: string, selected?: boolean) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  setViewMode: (mode: "table" | "grid") => void
}

export const useResultsStore = create<ResultsState>()(
  devtools(
    (set, get) => ({
      filters: {
        status: "all",
        search: "",
        minScore: 0,
        maxScore: 100,
        sortBy: "recent",
      },
      selectedIds: [],
      viewMode: "table",

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      toggleSelection: (id, selected) =>
        set((state) => {
          const isSelected = state.selectedIds.includes(id)
          const shouldSelect = selected !== undefined ? selected : !isSelected

          if (shouldSelect && !isSelected) {
            return { selectedIds: [...state.selectedIds, id] }
          } else if (!shouldSelect && isSelected) {
            return { selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id) }
          }
          return state
        }),

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
    }),
    {
      name: "results-store",
    },
  ),
)
