"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckSquare, 
  Plus, 
  Upload, 
  FileText, 
  CheckCircle,
  Edit3,
  Trash2,
  Info
} from "lucide-react"
import type { Checklist, ChecklistCategory, ChecklistCriterion } from "@/types/projects"

interface ChecklistSectionProps {
  checklist: Checklist | null
  onChecklistUpload: (checklist: Checklist) => void
}

interface NewChecklist {
  name: string
  description: string
  industry: string
  categories: ChecklistCategory[]
}

export function ChecklistSection({
  checklist,
  onChecklistUpload
}: ChecklistSectionProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newChecklist, setNewChecklist] = useState<NewChecklist>({
    name: "",
    description: "",
    industry: "",
    categories: []
  })
  const [currentCategory, setCurrentCategory] = useState<Partial<ChecklistCategory>>({
    name: "",
    description: "",
    weight: 1,
    criteria: []
  })
  const [currentCriterion, setCurrentCriterion] = useState<Partial<ChecklistCriterion>>({
    text: "",
    type: "binary",
    max_score: 1,
    weight: 1,
    is_required: false
  })

  // File upload handler for checklist JSON
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedChecklist = JSON.parse(content)
        
        // Convert to proper Checklist format
        const checklist: Checklist = {
          id: `checklist-${Date.now()}`,
          name: parsedChecklist.name || file.name.replace('.json', ''),
          description: parsedChecklist.description || "",
          industry: parsedChecklist.industry || "General",
          categories: parsedChecklist.categories || [],
          total_criteria_count: parsedChecklist.categories?.reduce((acc: number, cat: any) => acc + cat.criteria.length, 0) || 0,
          categories_count: parsedChecklist.categories?.length || 0,
          max_possible_score: parsedChecklist.categories?.reduce((acc: number, cat: any) => 
            acc + cat.criteria.reduce((catAcc: number, crit: any) => catAcc + (crit.max_score || 1), 0), 0) || 0,
          is_template: false,
          usage_count: 0,
          version: "1.0",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        onChecklistUpload(checklist)
      } catch (error) {
        console.error('Error parsing checklist file:', error)
      }
    }
    reader.readAsText(file)
  }, [onChecklistUpload])

  // Create new checklist from template
  const createFromTemplate = useCallback((templateName: string) => {
    const template = getChecklistTemplate(templateName)
    onChecklistUpload(template)
  }, [onChecklistUpload])

  // Add criterion to current category
  const addCriterion = useCallback(() => {
    if (!currentCriterion.text) return

    const criterion: ChecklistCriterion = {
      id: `criterion-${Date.now()}`,
      text: currentCriterion.text,
      type: currentCriterion.type || "binary",
      max_score: currentCriterion.max_score || 1,
      weight: currentCriterion.weight || 1,
      is_required: currentCriterion.is_required || false
    }

    setCurrentCategory(prev => ({
      ...prev,
      criteria: [...(prev.criteria || []), criterion]
    }))

    setCurrentCriterion({
      text: "",
      type: "binary",
      max_score: 1,
      weight: 1,
      is_required: false
    })
  }, [currentCriterion])

  // Add category to checklist
  const addCategory = useCallback(() => {
    if (!currentCategory.name || !currentCategory.criteria?.length) return

    const category: ChecklistCategory = {
      id: `category-${Date.now()}`,
      name: currentCategory.name,
      description: currentCategory.description || "",
      weight: currentCategory.weight || 1,
      max_score: currentCategory.criteria.reduce((acc, crit) => acc + crit.max_score, 0),
      criteria: currentCategory.criteria
    }

    setNewChecklist(prev => ({
      ...prev,
      categories: [...prev.categories, category]
    }))

    setCurrentCategory({
      name: "",
      description: "",
      weight: 1,
      criteria: []
    })
  }, [currentCategory])

  // Save new checklist
  const saveNewChecklist = useCallback(() => {
    if (!newChecklist.name || !newChecklist.categories.length) return

    const checklist: Checklist = {
      id: `checklist-${Date.now()}`,
      name: newChecklist.name,
      description: newChecklist.description,
      industry: newChecklist.industry || "General",
      categories: newChecklist.categories,
      total_criteria_count: newChecklist.categories.reduce((acc, cat) => acc + cat.criteria.length, 0),
      categories_count: newChecklist.categories.length,
      max_possible_score: newChecklist.categories.reduce((acc, cat) => acc + cat.max_score, 0),
      is_template: false,
      usage_count: 0,
      version: "1.0",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    onChecklistUpload(checklist)
    setIsCreateModalOpen(false)
    setNewChecklist({ name: "", description: "", industry: "", categories: [] })
  }, [newChecklist, onChecklistUpload])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Checklist Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!checklist ? (
          <div className="space-y-4">
            {/* Upload Checklist */}
            <div>
              <Label htmlFor="checklist-upload" className="text-sm font-medium">
                Upload Checklist (JSON)
              </Label>
              <div className="mt-2">
                <label htmlFor="checklist-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload checklist JSON file
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JSON format with categories and criteria
                    </p>
                  </div>
                </label>
                <input
                  id="checklist-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <Label className="text-sm font-medium">Quick Start Templates</Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { name: "Customer Service", desc: "Standard customer service evaluation" },
                  { name: "Sales Call", desc: "Sales conversation assessment" },
                  { name: "Technical Support", desc: "Technical assistance evaluation" }
                ].map((template) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    onClick={() => createFromTemplate(template.name)}
                    className="h-auto p-4 text-left"
                  >
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{template.desc}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Create New */}
            <div className="pt-4 border-t">
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Custom Checklist
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Custom Checklist</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Checklist Name</Label>
                        <Input
                          id="name"
                          value={newChecklist.name}
                          onChange={(e) => setNewChecklist(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Customer Service Evaluation"
                        />
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Select 
                          value={newChecklist.industry} 
                          onValueChange={(value) => setNewChecklist(prev => ({ ...prev, industry: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="banking">Banking</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newChecklist.description}
                        onChange={(e) => setNewChecklist(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the purpose and scope of this checklist"
                        rows={2}
                      />
                    </div>

                    {/* Add Category Section */}
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                      <h4 className="font-medium mb-3">Add Category</h4>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Category Name</Label>
                          <Input
                            value={currentCategory.name || ""}
                            onChange={(e) => setCurrentCategory(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Beginning, Middle, End"
                          />
                        </div>
                        <div>
                          <Label>Weight</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={currentCategory.weight || 1}
                            onChange={(e) => setCurrentCategory(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>

                      {/* Add Criteria */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium">Add Criteria</h5>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Input
                              value={currentCriterion.text || ""}
                              onChange={(e) => setCurrentCriterion(prev => ({ ...prev, text: e.target.value }))}
                              placeholder="Criterion description"
                            />
                          </div>
                          <div>
                            <Select 
                              value={currentCriterion.type} 
                              onValueChange={(value: any) => setCurrentCriterion(prev => ({ ...prev, type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="binary">Yes/No</SelectItem>
                                <SelectItem value="scale">Scale (1-5)</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Button 
                              onClick={addCriterion}
                              disabled={!currentCriterion.text}
                              size="sm"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Current Criteria List */}
                        {currentCategory.criteria && currentCategory.criteria.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-gray-500">Current Criteria:</Label>
                            {currentCategory.criteria.map((criterion, index) => (
                              <div key={index} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 p-2 rounded">
                                <span>{criterion.text}</span>
                                <Badge variant="secondary">{criterion.type}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={addCategory}
                        disabled={!currentCategory.name || !currentCategory.criteria?.length}
                        className="mt-4"
                        size="sm"
                      >
                        Add Category
                      </Button>
                    </div>

                    {/* Current Categories */}
                    {newChecklist.categories.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Categories ({newChecklist.categories.length})</Label>
                        <div className="mt-2 space-y-2">
                          {newChecklist.categories.map((category, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <div className="font-medium">{category.name}</div>
                                <div className="text-sm text-gray-500">
                                  {category.criteria.length} criteria
                                </div>
                              </div>
                              <Badge>{category.criteria.length}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={saveNewChecklist}
                        disabled={!newChecklist.name || !newChecklist.categories.length}
                      >
                        Create Checklist
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          /* Checklist Loaded */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">{checklist.name}</p>
                  <p className="text-sm text-gray-500">
                    {checklist.categories_count} categories, {checklist.total_criteria_count} criteria
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{checklist.industry}</Badge>
                <Badge>{checklist.max_possible_score} points</Badge>
              </div>
            </div>

            {/* Checklist Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Checklist Preview</Label>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {checklist.categories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{category.name}</h4>
                      <Badge variant="outline">{category.criteria.length} items</Badge>
                    </div>
                    <div className="space-y-1">
                      {category.criteria.map((criterion, criterionIndex) => (
                        <div key={criterionIndex} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          <span>{criterion.text}</span>
                          <Badge variant="secondary" className="text-xs">
                            {criterion.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Checklist loaded successfully. Ready for analysis when transcript is available.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to generate template checklists
function getChecklistTemplate(templateName: string): Checklist {
  const templates = {
    "Customer Service": {
      name: "Customer Service Evaluation",
      description: "Standard evaluation criteria for customer service calls",
      industry: "general",
      categories: [
        {
          id: "opening",
          name: "Call Opening",
          description: "Initial greeting and identification",
          weight: 1,
          max_score: 4,
          criteria: [
            { id: "greeting", text: "Professional greeting", type: "binary" as const, max_score: 1, weight: 1, is_required: true },
            { id: "identification", text: "Agent identification", type: "binary" as const, max_score: 1, weight: 1, is_required: true },
            { id: "purpose", text: "Call purpose clarification", type: "binary" as const, max_score: 1, weight: 1, is_required: false },
            { id: "recording_notice", text: "Recording notification", type: "binary" as const, max_score: 1, weight: 1, is_required: true }
          ]
        },
        {
          id: "conversation",
          name: "Conversation Flow",
          description: "Main conversation handling",
          weight: 2,
          max_score: 6,
          criteria: [
            { id: "active_listening", text: "Active listening demonstrated", type: "scale" as const, max_score: 3, weight: 1, is_required: true },
            { id: "problem_solving", text: "Effective problem solving", type: "scale" as const, max_score: 3, weight: 1, is_required: true }
          ]
        }
      ]
    },
    "Sales Call": {
      name: "Sales Call Assessment",
      description: "Evaluation criteria for sales conversations",
      industry: "sales",
      categories: [
        {
          id: "discovery",
          name: "Discovery Phase",
          description: "Customer needs assessment",
          weight: 1,
          max_score: 3,
          criteria: [
            { id: "needs_analysis", text: "Customer needs analysis", type: "binary" as const, max_score: 1, weight: 1, is_required: true },
            { id: "qualification", text: "Lead qualification", type: "binary" as const, max_score: 1, weight: 1, is_required: true },
            { id: "budget_discussion", text: "Budget discussion", type: "binary" as const, max_score: 1, weight: 1, is_required: false }
          ]
        }
      ]
    },
    "Technical Support": {
      name: "Technical Support Evaluation",
      description: "Assessment for technical assistance calls",
      industry: "technology",
      categories: [
        {
          id: "technical",
          name: "Technical Competency",
          description: "Technical problem resolution",
          weight: 1,
          max_score: 4,
          criteria: [
            { id: "problem_diagnosis", text: "Problem diagnosis", type: "scale" as const, max_score: 2, weight: 1, is_required: true },
            { id: "solution_provided", text: "Solution provided", type: "scale" as const, max_score: 2, weight: 1, is_required: true }
          ]
        }
      ]
    }
  }

  const template = templates[templateName as keyof typeof templates]
  
  return {
    id: `template-${Date.now()}`,
    name: template.name,
    description: template.description,
    industry: template.industry,
    categories: template.categories,
    total_criteria_count: template.categories.reduce((acc, cat) => acc + cat.criteria.length, 0),
    categories_count: template.categories.length,
    max_possible_score: template.categories.reduce((acc, cat) => acc + cat.max_score, 0),
    is_template: true,
    usage_count: 0,
    version: "1.0",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
} 