"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"

/**
 * QueryProvider
 * Creates (once) and supplies a TanStack QueryClient to its children.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // ensure a single QueryClient instance
  const [queryClient] = useState(() => new QueryClient())

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
