"use client"

import * as React from "react"
import { z } from "zod"
import {
  CheckCircle2Icon,
  LoaderIcon,
  PhoneCallIcon,
  CalendarIcon,
} from "lucide-react"

import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Define the schema for sales data
const salesDataSchema = z.object({
  id: z.number(),
  client: z.string(),
  type: z.string(),
  status: z.string(),
  date: z.string(),
  duration: z.string(),
  score: z.string(),
  manager: z.string(),
})

type SalesData = z.infer<typeof salesDataSchema>

// Transform function to convert sales data to the format expected by DataTable
const transformDataForTable = (data: SalesData[]) => {
  return data.map(item => ({
    id: item.id,
    header: item.client,
    type: item.type,
    status: item.status,
    target: item.duration,
    limit: item.score,
    reviewer: item.manager
  }))
}

export function SalesDataTable({ data }: { data: SalesData[] }) {
  // Transform data to match DataTable schema
  const transformedData = transformDataForTable(data)

  // Optional: you could also add custom column definitions here
  // const columns = [...]

  // Show the sales data details when clicking on a row
  const handleRowClick = (item: SalesData) => {
    console.log("Clicked on row:", item)
  }

  return (
    <>
      <DataTable data={transformedData} />

      {/* Future enhancement: Add sales-specific filters, analytics, or other controls here */}
    </>
  )
}