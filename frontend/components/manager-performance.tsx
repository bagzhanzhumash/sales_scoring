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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const performanceData = [
  { month: "Jan", "Emily Chen": 81, "David Kim": 73, "Alex Rodriguez": 78 },
  { month: "Feb", "Emily Chen": 76, "David Kim": 75, "Alex Rodriguez": 70 },
  { month: "Mar", "Emily Chen": 82, "David Kim": 78, "Alex Rodriguez": 75 },
  { month: "Apr", "Emily Chen": 79, "David Kim": 80, "Alex Rodriguez": 77 },
  { month: "May", "Emily Chen": 85, "David Kim": 81, "Alex Rodriguez": 79 },
  { month: "Jun", "Emily Chen": 87, "David Kim": 79, "Alex Rodriguez": 82 },
  { month: "Jul", "Emily Chen": 84, "David Kim": 82, "Alex Rodriguez": 83 },
  { month: "Aug", "Emily Chen": 88, "David Kim": 83, "Alex Rodriguez": 80 },
  { month: "Sep", "Emily Chen": 86, "David Kim": 85, "Alex Rodriguez": 81 },
]

const conversionData = [
  { name: "Emily Chen", calls: 125, deals: 36, conversion: 28.8 },
  { name: "David Kim", calls: 118, deals: 28, conversion: 23.7 },
  { name: "Alex Rodriguez", calls: 132, deals: 31, conversion: 23.5 },
  { name: "Sarah Johnson", calls: 92, deals: 24, conversion: 26.1 },
  { name: "Michael Lee", calls: 105, deals: 22, conversion: 21.0 },
]

const skillRadarData = [
  { skill: "Discovery", "Emily Chen": 82, "David Kim": 75, "Alex Rodriguez": 80, "Team Average": 78 },
  { skill: "Objection Handling", "Emily Chen": 78, "David Kim": 85, "Alex Rodriguez": 72, "Team Average": 76 },
  { skill: "Product Knowledge", "Emily Chen": 90, "David Kim": 82, "Alex Rodriguez": 85, "Team Average": 84 },
  { skill: "Closing", "Emily Chen": 75, "David Kim": 88, "Alex Rodriguez": 78, "Team Average": 80 },
  { skill: "Follow-up", "Emily Chen": 85, "David Kim": 76, "Alex Rodriguez": 70, "Team Average": 75 },
]

const topPerformers = [
  { name: "Emily Chen", score: 86, deals: 12, revenue: "$147,500" },
  { name: "David Kim", score: 85, deals: 9, revenue: "$115,000" },
  { name: "Alex Rodriguez", score: 81, deals: 10, revenue: "$128,200" },
  { name: "Sarah Johnson", score: 79, deals: 8, revenue: "$98,700" },
  { name: "Michael Lee", score: 76, deals: 7, revenue: "$87,500" },
]

const teamSkillBreakdown = [
  { name: "Discovery", value: 78 },
  { name: "Objection Handling", value: 76 },
  { name: "Product Knowledge", value: 84 },
  { name: "Closing", value: 80 },
  { name: "Follow-up", value: 75 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function ManagerPerformance() {
  const [selectedManager, setSelectedManager] = React.useState<string>("all")

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Manager Performance</CardTitle>
          <CardDescription>
            Sales performance metrics across your team
          </CardDescription>
        </div>
        <Select
          value={selectedManager}
          onValueChange={setSelectedManager}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Managers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Managers</SelectItem>
            <SelectItem value="Emily Chen">Emily Chen</SelectItem>
            <SelectItem value="David Kim">David Kim</SelectItem>
            <SelectItem value="Alex Rodriguez">Alex Rodriguez</SelectItem>
            <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
            <SelectItem value="Michael Lee">Michael Lee</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
            <TabsTrigger value="rankings">Team Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <div className="h-[400px]">
              <h3 className="text-sm font-medium mb-2">Monthly Performance Scores</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[60, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Legend />
                  <Line type="monotone" dataKey="Emily Chen" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="David Kim" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="Alex Rodriguez" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[350px]">
                <h3 className="text-sm font-medium mb-2">Call-to-Deal Conversion Rate</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={conversionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 35]} unit="%" />
                    <Tooltip formatter={(value, name) => [`${value}${name === "conversion" ? "%" : ""}`, name]} />
                    <Legend />
                    <Bar name="Conversion Rate" dataKey="conversion" fill="#8884d8">
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[350px]">
                <h3 className="text-sm font-medium mb-2">Calls vs Deals (30 days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={conversionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar name="Total Calls" dataKey="calls" fill="#8884d8" />
                    <Bar name="Closed Deals" dataKey="deals" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[350px]">
                <h3 className="text-sm font-medium mb-2">Team Skill Breakdown</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={teamSkillBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {teamSkillBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4">Individual Skill Scores</h3>
                <div className="space-y-6">
                  {skillRadarData.map((item) => (
                    <div key={item.skill} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.skill}</span>
                        <span className="text-sm text-muted-foreground">Team Avg: {item["Team Average"]}%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Emily Chen</span>
                            <span className={getScoreColor(item["Emily Chen"])}>{item["Emily Chen"]}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div
                              className={`h-1.5 rounded-full ${getScoreBarColor(item["Emily Chen"])}`}
                              style={{ width: `${item["Emily Chen"]}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>David Kim</span>
                            <span className={getScoreColor(item["David Kim"])}>{item["David Kim"]}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div
                              className={`h-1.5 rounded-full ${getScoreBarColor(item["David Kim"])}`}
                              style={{ width: `${item["David Kim"]}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Alex R.</span>
                            <span className={getScoreColor(item["Alex Rodriguez"])}>{item["Alex Rodriguez"]}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div
                              className={`h-1.5 rounded-full ${getScoreBarColor(item["Alex Rodriguez"])}`}
                              style={{ width: `${item["Alex Rodriguez"]}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rankings" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-4">Top Performers (Current Month)</h3>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-3 text-left font-medium text-sm">Manager</th>
                      <th className="p-3 text-right font-medium text-sm">Score</th>
                      <th className="p-3 text-right font-medium text-sm">Deals</th>
                      <th className="p-3 text-right font-medium text-sm">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((person, index) => (
                      <tr key={person.name} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                        <td className="p-3 text-sm">
                          <div className="font-medium">{person.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {index === 0 ? "Top performer" :
                             index === 1 ? "Second place" :
                             index === 2 ? "Third place" : ""}
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium text-sm">{person.score}%</td>
                        <td className="p-3 text-right text-sm">{person.deals}</td>
                        <td className="p-3 text-right text-sm">{person.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Based on overall performance score combining call quality, conversion rate and customer feedback.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <span className="text-sm text-muted-foreground">Data updated daily</span>
        <Badge variant="outline" className="cursor-pointer">Download detailed report</Badge>
      </CardFooter>
    </Card>
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