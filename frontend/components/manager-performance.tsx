"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Enhanced performance data with more timepoints like in the images
const performanceData = [
  { date: "Nov 01", "Cameron Williamson": 100, "Annette Black": 85, "Jenny Wilson": 70, "Ralph Edwards": 85, "Albert Flores": 65, "Jane Cooper": 80 },
  { date: "Nov 02", "Cameron Williamson": 95, "Annette Black": 88, "Jenny Wilson": 72, "Ralph Edwards": 83, "Albert Flores": 68, "Jane Cooper": 78 },
  { date: "Nov 03", "Cameron Williamson": 98, "Annette Black": 90, "Jenny Wilson": 75, "Ralph Edwards": 85, "Albert Flores": 70, "Jane Cooper": 82 },
  { date: "Nov 04", "Cameron Williamson": 92, "Annette Black": 87, "Jenny Wilson": 68, "Ralph Edwards": 80, "Albert Flores": 65, "Jane Cooper": 75 },
  { date: "Nov 05", "Cameron Williamson": 96, "Annette Black": 92, "Jenny Wilson": 78, "Ralph Edwards": 88, "Albert Flores": 72, "Jane Cooper": 85 },
  { date: "Nov 06", "Cameron Williamson": 94, "Annette Black": 89, "Jenny Wilson": 76, "Ralph Edwards": 86, "Albert Flores": 69, "Jane Cooper": 81 },
  { date: "Nov 07", "Cameron Williamson": 97, "Annette Black": 91, "Jenny Wilson": 74, "Ralph Edwards": 84, "Albert Flores": 71, "Jane Cooper": 83 },
  { date: "Nov 08", "Cameron Williamson": 93, "Annette Black": 86, "Jenny Wilson": 77, "Ralph Edwards": 87, "Albert Flores": 73, "Jane Cooper": 79 },
  { date: "Nov 15", "Cameron Williamson": 89, "Annette Black": 84, "Jenny Wilson": 65, "Ralph Edwards": 82, "Albert Flores": 67, "Jane Cooper": 76 },
  { date: "Nov 22", "Cameron Williamson": 91, "Annette Black": 88, "Jenny Wilson": 73, "Ralph Edwards": 85, "Albert Flores": 70, "Jane Cooper": 80 },
  { date: "Nov 28", "Cameron Williamson": 95, "Annette Black": 90, "Jenny Wilson": 75, "Ralph Edwards": 88, "Albert Flores": 74, "Jane Cooper": 84 },
]

// Simplified manager data with fewer columns
const managersData = [
  { 
    name: "Cameron Williamson", 
    calls: 232, 
    flagCalls: 21, 
    redFlags: 21, 
    dismissed: 21, 
    avgDuration: 3.3, 
    avgScore: 21,
    compliance: 34, 
    hostileApproach: 34,
    objectionHandling: 25,
    empathyDeficit: 25
  },
  { 
    name: "Annette Black", 
    calls: 232, 
    flagCalls: 10, 
    redFlags: 10, 
    dismissed: 10, 
    avgDuration: 23.3, 
    avgScore: 21,
    compliance: 46, 
    hostileApproach: 13,
    objectionHandling: 13,
    empathyDeficit: 13
  },
  { 
    name: "Jenny Wilson", 
    calls: 232, 
    flagCalls: 1, 
    redFlags: 1, 
    dismissed: 1, 
    avgDuration: 13.3, 
    avgScore: 21,
    compliance: 70, 
    hostileApproach: 6,
    objectionHandling: 6,
    empathyDeficit: 6
  },
  { 
    name: "Ralph Edwards", 
    calls: 232, 
    flagCalls: 15, 
    redFlags: 15, 
    dismissed: 15, 
    avgDuration: 3.3, 
    avgScore: 21,
    compliance: 46, 
    hostileApproach: 21,
    objectionHandling: 21,
    empathyDeficit: 21
  },
  { 
    name: "Albert Flores", 
    calls: 232, 
    flagCalls: 39, 
    redFlags: 39, 
    dismissed: 39, 
    avgDuration: 33.3, 
    avgScore: 21,
    compliance: 1, 
    hostileApproach: 18,
    objectionHandling: 18,
    empathyDeficit: 18
  },
  { 
    name: "Jane Cooper", 
    calls: 232, 
    flagCalls: 24, 
    redFlags: 24, 
    dismissed: 24, 
    avgDuration: 1.3, 
    avgScore: 21,
    compliance: 40, 
    hostileApproach: 32,
    objectionHandling: 32,
    empathyDeficit: 32
  }
]

// Colors for different metrics and managers
const managerColors = {
  "Cameron Williamson": "#8884d8",
  "Annette Black": "#82ca9d", 
  "Jenny Wilson": "#ffc658",
  "Ralph Edwards": "#ff7300",
  "Albert Flores": "#00ff00",
  "Jane Cooper": "#0088fe"
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function ManagerPerformance() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All")
  const [selectedManager, setSelectedManager] = React.useState<string | null>(null)

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Call Quality Dashboard</h2>
          <p className="text-muted-foreground">Sales managers performance monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">01 Nov 2024 - 28 Nov 2024</span>
          <Button variant="outline" size="sm">Export</Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Compliance">Compliance</TabsTrigger>
          <TabsTrigger value="Product Knowledge">Product Knowledge</TabsTrigger>
          <TabsTrigger value="Process Adherence">Process Adherence</TabsTrigger>
          <TabsTrigger value="Soft Skills">Soft Skills</TabsTrigger>
          </TabsList>

        <TabsContent value={selectedCategory} className="space-y-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Nov 09, Mon
                </div>
                <div className="text-right">
                  <div className="text-sm">Calls: 120</div>
                  <div className="text-sm">Calls with Red Flags: 70% 85</div>
                  <div className="text-sm">All Red Flags: 245</div>
                  <div className="text-sm">Average Red Flags/Call: 3.3</div>
            </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    <Legend />
                    {Object.keys(managerColors).map((manager) => (
                      <Line 
                        key={manager}
                        type="monotone" 
                        dataKey={manager} 
                        stroke={managerColors[manager as keyof typeof managerColors]} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Manager Performance Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium text-sm">Name</th>
                      <th className="p-3 text-right font-medium text-sm">Calls</th>
                      <th className="p-3 text-right font-medium text-sm">Flag Calls</th>
                      <th className="p-3 text-right font-medium text-sm">Red Flags</th>
                      <th className="p-3 text-right font-medium text-sm">Dismissed</th>
                      <th className="p-3 text-right font-medium text-sm">Avg Duration</th>
                      <th className="p-3 text-right font-medium text-sm">Avg Score</th>
                      <th className="p-3 text-center font-medium text-sm">Compliance</th>
                      <th className="p-3 text-center font-medium text-sm">Hostile approach</th>
                      <th className="p-3 text-center font-medium text-sm">Objection handling</th>
                      <th className="p-3 text-center font-medium text-sm">Empathy deficit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managersData.map((manager, index) => (
                      <tr 
                        key={manager.name} 
                        className={`${index % 2 === 0 ? "bg-muted/20" : ""} hover:bg-muted/30 cursor-pointer`}
                        onClick={() => setSelectedManager(manager.name)}
                      >
                        <td className="p-3 text-sm font-medium">{manager.name}</td>
                        <td className="p-3 text-right text-sm">{manager.calls}</td>
                        <td className="p-3 text-right text-sm">{manager.flagCalls}</td>
                        <td className="p-3 text-right text-sm">{manager.redFlags}</td>
                        <td className="p-3 text-right text-sm">{manager.dismissed}</td>
                        <td className="p-3 text-right text-sm">{manager.avgDuration}</td>
                        <td className="p-3 text-right text-sm">{manager.avgScore}%</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className={`h-6 w-12 rounded-full ${getProgressBarColor(manager.compliance)}`}>
                              <div 
                                className="h-full bg-current rounded-full opacity-80"
                                style={{ width: `${manager.compliance}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs">{manager.compliance}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className={`h-6 w-12 rounded-full ${getProgressBarColor(manager.hostileApproach)}`}>
                              <div 
                                className="h-full bg-current rounded-full opacity-80"
                                style={{ width: `${manager.hostileApproach}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs">{manager.hostileApproach}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className={`h-6 w-12 rounded-full ${getProgressBarColor(manager.objectionHandling)}`}>
                              <div 
                                className="h-full bg-current rounded-full opacity-80"
                                style={{ width: `${manager.objectionHandling}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs">{manager.objectionHandling}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center">
                            <div className={`h-6 w-12 rounded-full ${getProgressBarColor(manager.empathyDeficit)}`}>
                              <div 
                                className="h-full bg-current rounded-full opacity-80"
                                style={{ width: `${manager.empathyDeficit}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs">{manager.empathyDeficit}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Selected Manager Detail */}
          {selectedManager && (
            <Card>
              <CardHeader>
                <CardTitle>Call Quality: {selectedManager}</CardTitle>
                <div className="flex gap-4 text-sm">
                  <span>Statistics</span>
                  <span>List</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">21</div>
                    <div className="text-xs text-muted-foreground">Red Flags</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">232</div>
                    <div className="text-xs text-muted-foreground">Flag Calls</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">21</div>
                    <div className="text-xs text-muted-foreground">Dismissed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">21%</div>
                    <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
            </div>
                
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                      <Line 
                        type="monotone" 
                        dataKey={selectedManager} 
                        stroke={managerColors[selectedManager as keyof typeof managerColors]} 
                        strokeWidth={3}
                        dot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          </TabsContent>
        </Tabs>
    </div>
  )
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-green-500";
  if (score >= 75) return "text-amber-500";
  return "text-red-500";
}

function getScoreBarColor(score: number): string {
  if (score >= 85) return "bg-green-500";
  if (score >= 75) return "bg-amber-500";
  return "bg-red-500";
}

function getProgressBarColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}