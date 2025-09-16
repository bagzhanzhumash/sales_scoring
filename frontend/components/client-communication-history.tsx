"use client"

import * as React from "react"
import { CalendarIcon, CheckCircleIcon, ChevronDownIcon, MessageCircleIcon, PhoneCallIcon, PlusIcon, SearchIcon, UsersIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const clientData = [
  {
    id: "c1",
    name: "Acme Corporation",
    status: "Active Deal",
    statusColor: "green",
    lastContact: "2 days ago",
    dealValue: "$75,000",
    communications: [
      {
        id: "c1-1",
        type: "call",
        date: "2024-09-14",
        summary: "Product demo call with technical team",
        duration: "45 minutes",
        score: "85%",
        keyPoints: [
          "Client interested in premium features",
          "Need to address security concerns",
          "Follow up with ROI calculation"
        ]
      },
      {
        id: "c1-2",
        type: "email",
        date: "2024-09-12",
        summary: "Sent product specifications and pricing",
        response: "Positive, requested demo"
      },
      {
        id: "c1-3",
        type: "call",
        date: "2024-09-07",
        summary: "Initial discovery call",
        duration: "30 minutes",
        score: "78%",
        keyPoints: [
          "Budget confirmed for Q4",
          "Decision timeline: 4-6 weeks",
          "Main pain points: integration and scalability"
        ]
      }
    ]
  },
  {
    id: "c2",
    name: "TechSolutions Inc.",
    status: "Negotiation",
    statusColor: "amber",
    lastContact: "Today",
    dealValue: "$125,000",
    communications: [
      {
        id: "c2-1",
        type: "call",
        date: "2024-09-16",
        summary: "Pricing negotiation",
        duration: "25 minutes",
        score: "92%",
        keyPoints: [
          "Client pushing for 15% discount",
          "Decision maker involved directly",
          "Need approval from finance"
        ]
      },
      {
        id: "c2-2",
        type: "meeting",
        date: "2024-09-10",
        summary: "On-site presentation with executive team",
        duration: "90 minutes",
        keyPoints: [
          "All key stakeholders present",
          "Positive reception to implementation timeline",
          "Questions about SLA and support"
        ]
      },
      {
        id: "c2-3",
        type: "email",
        date: "2024-09-08",
        summary: "Sent revised proposal",
        response: "Requested in-person meeting"
      },
      {
        id: "c2-4",
        type: "call",
        date: "2024-09-04",
        summary: "Technical requirements discussion",
        duration: "40 minutes",
        score: "85%",
        keyPoints: [
          "IT team has integration concerns",
          "Need custom API documentation",
          "Security assessment required"
        ]
      }
    ]
  },
  {
    id: "c3",
    name: "Global Industries",
    status: "At Risk",
    statusColor: "red",
    lastContact: "5 days ago",
    dealValue: "$60,000",
    communications: [
      {
        id: "c3-1",
        type: "email",
        date: "2024-09-11",
        summary: "Follow-up on proposal",
        response: "No response yet"
      },
      {
        id: "c3-2",
        type: "call",
        date: "2024-09-05",
        summary: "Check-in after silence period",
        duration: "10 minutes",
        score: "65%",
        keyPoints: [
          "Contact seemed distracted",
          "Mentioned exploring competitor solutions",
          "Budget constraints mentioned"
        ]
      },
      {
        id: "c3-3",
        type: "email",
        date: "2024-08-25",
        summary: "Sent initial proposal",
        response: "Acknowledged receipt"
      }
    ]
  },
  {
    id: "c4",
    name: "Stellar Enterprises",
    status: "Qualifying",
    statusColor: "blue",
    lastContact: "Yesterday",
    dealValue: "$40,000 (est.)",
    communications: [
      {
        id: "c4-1",
        type: "call",
        date: "2024-09-15",
        summary: "Discovery call with operations team",
        duration: "35 minutes",
        score: "88%",
        keyPoints: [
          "Strong interest in automation features",
          "Small initial deployment with expansion potential",
          "Need case studies in their industry"
        ]
      },
      {
        id: "c4-2",
        type: "email",
        date: "2024-09-08",
        summary: "Initial outreach",
        response: "Interested in learning more"
      }
    ]
  },
  {
    id: "c5",
    name: "Pinnacle Systems",
    status: "Closed Won",
    statusColor: "green",
    lastContact: "3 days ago",
    dealValue: "$95,000",
    communications: [
      {
        id: "c5-1",
        type: "email",
        date: "2024-09-13",
        summary: "Sent implementation schedule",
        response: "Confirmed and approved"
      },
      {
        id: "c5-2",
        type: "call",
        date: "2024-09-10",
        summary: "Final contract review",
        duration: "20 minutes",
        score: "95%",
        keyPoints: [
          "All terms agreed upon",
          "Start date confirmed for October 1st",
          "Introduced to implementation team"
        ]
      },
      {
        id: "c5-3",
        type: "meeting",
        date: "2024-08-28",
        summary: "Executive presentation and demo",
        duration: "60 minutes",
        keyPoints: [
          "Decision maker impressed with ROI projection",
          "Requested minor customizations",
          "Verbal commitment to proceed"
        ]
      }
    ]
  }
]

export function ClientCommunicationHistory() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filteredClients = clientData.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Client Communication History</CardTitle>
        <CardDescription>
          Consolidated view of all client interactions across communication channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active Deal">Active Deal</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Qualifying">Qualifying</SelectItem>
              <SelectItem value="At Risk">At Risk</SelectItem>
              <SelectItem value="Closed Won">Closed Won</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="flex gap-1">
            <PlusIcon className="h-4 w-4" />
            <span>New Contact</span>
          </Button>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <div className="space-y-4">
              {filteredClients.length > 0 ? (
                filteredClients.map(client => (
                  <Card key={client.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/40 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-base">{client.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <PhoneCallIcon className="h-3 w-3" />
                              <span>Last contact: {client.lastContact}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircleIcon className="h-3 w-3" />
                              <span>{client.communications.length} interactions</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`bg-${client.statusColor}-600`}>{client.status}</Badge>
                          <span className="text-sm font-medium">{client.dealValue}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-3">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="communications">
                          <AccordionTrigger className="py-1 text-sm font-medium">Communication History</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 mt-2">
                              {client.communications.map(comm => (
                                <div key={comm.id} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                                  <div className="flex-shrink-0 mt-1">
                                    {comm.type === "call" ? (
                                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                        <PhoneCallIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      </div>
                                    ) : comm.type === "email" ? (
                                      <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                                        <MessageCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                      </div>
                                    ) : (
                                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                                        <UsersIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="font-medium text-sm capitalize">{comm.type}</div>
                                      <div className="text-xs text-muted-foreground flex items-center">
                                        <CalendarIcon className="h-3 w-3 mr-1" />
                                        {comm.date}
                                      </div>
                                    </div>
                                    <p className="text-sm">{comm.summary}</p>

                                    {comm.duration && (
                                      <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                        <span>Duration: {comm.duration}</span>
                                        {comm.score && <span>Score: {comm.score}</span>}
                                      </div>
                                    )}

                                    {comm.response && (
                                      <div className="mt-2 text-xs text-muted-foreground">
                                        Response: {comm.response}
                                      </div>
                                    )}

                                    {comm.keyPoints && (
                                      <div className="mt-2">
                                        <h4 className="text-xs font-medium mb-1">Key Points:</h4>
                                        <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                          {comm.keyPoints.map((point, idx) => (
                                            <li key={idx}>{point}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                    <CardFooter className="flex justify-between py-3 bg-muted/20">
                      <Button variant="ghost" size="sm" className="text-xs">View Full History</Button>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <PhoneCallIcon className="h-4 w-4" />
                          <span className="sr-only">Log Call</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MessageCircleIcon className="h-4 w-4" />
                          <span className="sr-only">Log Email</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <UsersIcon className="h-4 w-4" />
                          <span className="sr-only">Log Meeting</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No clients match your search criteria.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  {/* Timeline visualization */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-muted-foreground/20"></div>

                  <div className="space-y-8">
                    {filteredClients.flatMap(client =>
                      client.communications.map(comm => ({
                        ...comm,
                        clientName: client.name,
                        clientStatus: client.status,
                        clientStatusColor: client.statusColor,
                        dateObj: new Date(comm.date)
                      }))
                    )
                    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
                    .map((event, idx) => (
                      <div key={idx} className="relative pl-8">
                        {/* Timeline node */}
                        <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center">
                          <div className={`absolute h-3 w-3 rounded-full border-2 border-background bg-${event.type === 'call' ? 'blue' : event.type === 'email' ? 'green' : 'purple'}-500`}></div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center">
                                <h4 className="font-semibold text-sm">{event.clientName}</h4>
                                <Badge className={`ml-2 bg-${event.clientStatusColor}-600 text-xs`}>{event.clientStatus}</Badge>
                              </div>
                              <p className="text-sm">{event.summary}</p>
                            </div>
                            <time className="text-xs text-muted-foreground whitespace-nowrap">
                              {event.date}
                            </time>
                          </div>

                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{event.type}</span>
                            {event.duration && <span>· {event.duration}</span>}
                            {event.score && <span>· Score: {event.score}</span>}
                          </div>

                          {event.keyPoints && (
                            <div className="bg-muted/40 p-2 rounded-md">
                              <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                {event.keyPoints.map((point, idx) => (
                                  <li key={idx}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <span className="text-sm text-muted-foreground">Showing {filteredClients.length} of {clientData.length} clients</span>
        <Button variant="outline" size="sm">
          Export Communication History
        </Button>
      </CardFooter>
    </Card>
  )
}