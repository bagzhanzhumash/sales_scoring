"use client"

import { useState, useEffect } from "react"
import { CheckSquare, Edit, Save, Plus, Trash2, Copy, Download, Upload, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Project, Checklist, ChecklistCategory, ChecklistCriterion, ChecklistTemplate } from "@/types/projects"

interface ChecklistTabProps {
  projectId: string
  project: Project
}

export function ChecklistTab({ projectId, project }: ChecklistTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [templates, setTemplates] = useState<Record<string, ChecklistTemplate>>({})
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("editor")

  // Load checklist and templates on mount
  useEffect(() => {
    loadChecklist()
    loadTemplates()
  }, [projectId])

  const loadChecklist = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/v1/projects/${projectId}?action=checklist`)
      if (response.ok) {
        const data = await response.json()
        setChecklist(data)
      } else if (response.status === 404) {
        // No checklist found, create a default one
        setChecklist({
          id: '',
          name: 'Default Checklist',
          description: 'Default checklist for this project',
          categories: [],
          total_criteria_count: 0,
          categories_count: 0,
          max_possible_score: 0,
          is_template: false,
          usage_count: 0,
          version: '1.0',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } else {
        throw new Error('Failed to load checklist')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load checklist')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/v1/checklists/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || {})
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  const saveChecklist = async () => {
    if (!checklist) return
    
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/v1/projects/${projectId}?action=checklist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: checklist.categories
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save checklist')
      }

      const updatedChecklist = await response.json()
      setChecklist(updatedChecklist)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save checklist')
    } finally {
      setIsSaving(false)
    }
  }

  const addCategory = () => {
    if (!checklist) return
    
    const newCategory: ChecklistCategory = {
      id: `category-${Date.now()}`,
      name: 'New Category',
      description: '',
      max_score: 10,
      weight: 1.0,
      criteria: []
    }
    
    setChecklist({
      ...checklist,
      categories: [...checklist.categories, newCategory],
      categories_count: checklist.categories.length + 1
    })
  }

  const updateCategory = (categoryIndex: number, updates: Partial<ChecklistCategory>) => {
    if (!checklist) return
    
    const updatedCategories = checklist.categories.map((category, index) =>
      index === categoryIndex ? { ...category, ...updates } : category
    )
    
    setChecklist({
      ...checklist,
      categories: updatedCategories
    })
  }

  const removeCategory = (categoryIndex: number) => {
    if (!checklist) return
    
    const updatedCategories = checklist.categories.filter((_, index) => index !== categoryIndex)
    
    setChecklist({
      ...checklist,
      categories: updatedCategories,
      categories_count: updatedCategories.length
    })
  }

  const addCriterion = (categoryIndex: number) => {
    if (!checklist) return
    
    const newCriterion: ChecklistCriterion = {
      id: `criterion-${Date.now()}`,
      text: 'New Criterion',
      description: '',
      type: 'binary',
      max_score: 1,
      weight: 1.0,
      is_required: true
    }
    
    const updatedCategories = checklist.categories.map((category, index) =>
      index === categoryIndex
        ? { ...category, criteria: [...category.criteria, newCriterion] }
        : category
    )
    
    setChecklist({
      ...checklist,
      categories: updatedCategories,
      total_criteria_count: checklist.total_criteria_count + 1
    })
  }

  const updateCriterion = (categoryIndex: number, criterionIndex: number, updates: Partial<ChecklistCriterion>) => {
    if (!checklist) return
    
    const updatedCategories = checklist.categories.map((category, index) =>
      index === categoryIndex
        ? {
            ...category,
            criteria: category.criteria.map((criterion, cIndex) =>
              cIndex === criterionIndex ? { ...criterion, ...updates } : criterion
            )
          }
        : category
    )
    
    setChecklist({
      ...checklist,
      categories: updatedCategories
    })
  }

  const removeCriterion = (categoryIndex: number, criterionIndex: number) => {
    if (!checklist) return
    
    const updatedCategories = checklist.categories.map((category, index) =>
      index === categoryIndex
        ? {
            ...category,
            criteria: category.criteria.filter((_, cIndex) => cIndex !== criterionIndex)
          }
        : category
    )
    
    setChecklist({
      ...checklist,
      categories: updatedCategories,
      total_criteria_count: checklist.total_criteria_count - 1
    })
  }

  const loadTemplate = (templateKey: string) => {
    const template = templates[templateKey]
    if (!template || !checklist) return
    
    setChecklist({
      ...checklist,
      name: template.name,
      description: template.description,
      industry: template.industry,
      categories: template.categories,
      categories_count: template.categories.length,
      total_criteria_count: template.categories.reduce((sum, cat) => sum + cat.criteria.length, 0)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-slate-600">Loading checklist...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4" 
            onClick={loadChecklist}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!checklist) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Checklist Found</h3>
        <p className="text-slate-600 mb-4">Create a checklist to start analyzing your audio files</p>
        <Button onClick={addCategory}>
          <Plus className="w-4 h-4 mr-2" />
          Create Checklist
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Checklist Configuration</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Configure the criteria used to analyze your audio files
          </p>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant="secondary">
              {checklist.categories_count} categories
            </Badge>
            <Badge variant="secondary">
              {checklist.total_criteria_count} criteria
            </Badge>
            <Badge variant="secondary">
              Max Score: {checklist.max_possible_score}
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700" 
                onClick={saveChecklist}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Checklist
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          {/* Checklist Info */}
          <Card>
            <CardHeader>
              <CardTitle>Checklist Information</CardTitle>
              <CardDescription>Basic information about this checklist</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={checklist.name}
                    onChange={(e) => setChecklist({ ...checklist, name: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Checklist name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <Select
                    value={checklist.industry || ''}
                    onValueChange={(value) => setChecklist({ ...checklist, industry: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="banking">Banking</SelectItem>
                      <SelectItem value="customer_service">Customer Service</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={checklist.description || ''}
                  onChange={(e) => setChecklist({ ...checklist, description: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Describe the purpose of this checklist"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Categories & Criteria</h3>
              {isEditing && (
                <Button onClick={addCategory} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              )}
            </div>

            {checklist.categories.map((category, categoryIndex) => (
              <Card key={category.id || categoryIndex}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={category.name}
                        onChange={(e) => updateCategory(categoryIndex, { name: e.target.value })}
                        disabled={!isEditing}
                        className="font-semibold"
                        placeholder="Category name"
                      />
                      <Textarea
                        value={category.description || ''}
                        onChange={(e) => updateCategory(categoryIndex, { description: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Category description"
                        rows={2}
                      />
                    </div>
                    {isEditing && (
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addCriterion(categoryIndex)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCategory(categoryIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div>
                      <label className="block text-xs font-medium mb-1">Max Score</label>
                      <Input
                        type="number"
                        value={category.max_score}
                        onChange={(e) => updateCategory(categoryIndex, { max_score: Number(e.target.value) })}
                        disabled={!isEditing}
                        className="w-20"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Weight</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={category.weight}
                        onChange={(e) => updateCategory(categoryIndex, { weight: Number(e.target.value) })}
                        disabled={!isEditing}
                        className="w-20"
                        min="0.1"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.criteria.map((criterion, criterionIndex) => (
                      <div key={criterion.id || criterionIndex} className="border rounded-lg p-4 bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <Input
                              value={criterion.text}
                              onChange={(e) => updateCriterion(categoryIndex, criterionIndex, { text: e.target.value })}
                              disabled={!isEditing}
                              placeholder="Criterion text"
                            />
                            <Textarea
                              value={criterion.description || ''}
                              onChange={(e) => updateCriterion(categoryIndex, criterionIndex, { description: e.target.value })}
                              disabled={!isEditing}
                              placeholder="Criterion description"
                              rows={2}
                            />
                            <div className="flex items-center space-x-4">
                              <div>
                                <label className="block text-xs font-medium mb-1">Type</label>
                                <Select
                                  value={criterion.type}
                                  onValueChange={(value: any) => updateCriterion(categoryIndex, criterionIndex, { type: value })}
                                  disabled={!isEditing}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="binary">Binary (0/1)</SelectItem>
                                    <SelectItem value="scale">Scale (1-5)</SelectItem>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="text">Text</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Max Score</label>
                                <Input
                                  type="number"
                                  value={criterion.max_score}
                                  onChange={(e) => updateCriterion(categoryIndex, criterionIndex, { max_score: Number(e.target.value) })}
                                  disabled={!isEditing}
                                  className="w-20"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Weight</label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={criterion.weight || 1}
                                  onChange={(e) => updateCriterion(categoryIndex, criterionIndex, { weight: Number(e.target.value) })}
                                  disabled={!isEditing}
                                  className="w-20"
                                  min="0.1"
                                />
                              </div>
                            </div>
                          </div>
                          {isEditing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCriterion(categoryIndex, criterionIndex)}
                              className="ml-4 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {category.criteria.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        No criteria in this category.
                        {isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addCriterion(categoryIndex)}
                            className="ml-2"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add First Criterion
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {checklist.categories.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Categories</h3>
                  <p className="text-slate-600 mb-4">Add categories to organize your evaluation criteria</p>
                  {isEditing && (
                    <Button onClick={addCategory}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Category
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Checklist Templates</CardTitle>
              <CardDescription>
                Choose from predefined templates or create your own
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(templates).map(([key, template]) => (
                  <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.industry}</Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                          {template.categories.length} categories • {' '}
                          {template.categories.reduce((sum, cat) => sum + cat.criteria.length, 0)} criteria
                        </div>
                        <Button
                          size="sm"
                          onClick={() => loadTemplate(key)}
                          disabled={!isEditing}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Checklist Preview</CardTitle>
              <CardDescription>
                Preview how your checklist will appear during analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {checklist.categories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-2">{category.name}</h4>
                    {category.description && (
                      <p className="text-slate-600 mb-4">{category.description}</p>
                    )}
                    <div className="space-y-2">
                      {category.criteria.map((criterion, criterionIndex) => (
                        <div key={criterionIndex} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <div>
                            <span className="font-medium">{criterion.text}</span>
                            {criterion.description && (
                              <p className="text-sm text-slate-600 mt-1">{criterion.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{criterion.type}</Badge>
                            <span className="text-sm text-slate-600">
                              Max: {criterion.max_score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
