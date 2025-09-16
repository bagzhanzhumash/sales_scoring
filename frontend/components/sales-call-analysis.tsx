"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
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

const callsTrend = [
  { week: "Week 1", completed: 35, missed: 3, rescheduled: 5 },
  { week: "Week 2", completed: 28, missed: 2, rescheduled: 8 },
  { week: "Week 3", completed: 42, missed: 5, rescheduled: 4 },
  { week: "Week 4", completed: 38, missed: 4, rescheduled: 6 },
]

const scoreBreakdown = [
  { name: "Questions", value: 78 },
  { name: "Listening", value: 65 },
  { name: "Pitch", value: 83 },
  { name: "Objections", value: 45 },
  { name: "Closing", value: 72 },
]

const durationDistribution = [
  { name: "0-5 min", count: 8 },
  { name: "5-10 min", count: 12 },
  { name: "10-15 min", count: 18 },
  { name: "15-20 min", count: 10 },
  { name: "20+ min", count: 5 },
]

const conversionData = [
  { stage: "Initial Call", conversion: 100, fill: "#8884d8" },
  { stage: "Discovery", conversion: 68, fill: "#83a6ed" },
  { stage: "Demo", conversion: 52, fill: "#8dd1e1" },
  { stage: "Negotiation", conversion: 38, fill: "#82ca9d" },
  { stage: "Closed Won", conversion: 23, fill: "#a4de6c" },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function SalesCallAnalysis() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sales Call Analysis</CardTitle>
        <CardDescription>
          Comprehensive analysis of your sales call performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[300px]">
                <h3 className="text-sm font-medium mb-2">Call Trend (Last 4 Weeks)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={callsTrend}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="completed" stroke="#8884d8" fillOpacity={1} fill="url(#colorCompleted)" />
                    <Area type="monotone" dataKey="missed" stroke="#ff5252" fillOpacity={0.3} fill="#ff5252" />
                    <Area type="monotone" dataKey="rescheduled" stroke="#82ca9d" fillOpacity={0.3} fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[300px]">
                <h3 className="text-sm font-medium mb-2">Call Score Components</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="80%"
                    barSize={10}
                    data={scoreBreakdown}
                  >
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise
                      dataKey="value"
                      label={{
                        fill: '#666',
                        position: 'insideStart',
                        fontSize: 12
                      }}
                    />
                    <Tooltip />
                    <Legend
                      iconSize={10}
                      layout="vertical"
                      verticalAlign="middle"
                      wrapperStyle={{ fontSize: "12px", lineHeight: "18px" }}
                      align="right"
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[300px]">
                <h3 className="text-sm font-medium mb-2">Call Duration Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8">
                      {durationDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[300px]">
                <h3 className="text-sm font-medium mb-2">Score Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "90-100%", value: 12 },
                        { name: "80-90%", value: 15 },
                        { name: "70-80%", value: 18 },
                        { name: "60-70%", value: 9 },
                        { name: "<60%", value: 5 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {durationDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="conversation" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="h-[350px]">
                <h3 className="text-sm font-medium mb-2">Conversation Analysis</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Talk-to-Listen Ratio</span>
                      <Badge variant={getTalkListenVariant(62)} className="px-2">62:38</Badge>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[62%] rounded-full bg-amber-500"></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Target ratio is 40:60. Try asking more open-ended questions.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Question Frequency</span>
                      <Badge variant={getFrequencyVariant(6.2)} className="px-2">6.2/min</Badge>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[75%] rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Good question frequency. Target is 5-8 questions per minute.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Filler Word Usage</span>
                      <Badge variant={getFillerVariant(4.8)} className="px-2">4.8%</Badge>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[85%] rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Excellent. Target is below 5% of total words.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Interruption Rate</span>
                      <Badge variant={getInterruptionVariant(3.2)} className="px-2">3.2/call</Badge>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 w-[70%] rounded-full bg-amber-500"></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Target is below 2 interruptions per call.</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="h-[350px]">
                <h3 className="text-sm font-medium mb-2">Sales Funnel Conversion</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={conversionData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="stage" width={100} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
                    <Bar dataKey="conversion" radius={[0, 10, 10, 0]}>
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <span className="text-sm text-muted-foreground">Based on 48 analyzed calls</span>
        <Badge variant="outline" className="cursor-pointer">Export report</Badge>
      </CardFooter>
    </Card>
  )
}

// Helper functions to determine badge variants
function getTalkListenVariant(talkRatio: number): "default" | "outline" | "secondary" | "destructive" {
  if (talkRatio < 45) return "default";
  if (talkRatio < 60) return "secondary";
  return "destructive";
}

function getFrequencyVariant(frequency: number): "default" | "outline" | "secondary" | "destructive" {
  if (frequency >= 5 && frequency <= 8) return "default";
  if (frequency >= 3 && frequency < 5) return "secondary";
  return "destructive";
}

function getFillerVariant(percentage: number): "default" | "outline" | "secondary" | "destructive" {
  if (percentage <= 5) return "default";
  if (percentage <= 8) return "secondary";
  return "destructive";
}

function getInterruptionVariant(rate: number): "default" | "outline" | "secondary" | "destructive" {
  if (rate <= 2) return "default";
  if (rate <= 4) return "secondary";
  return "destructive";
}