"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Brain, 
  Play, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Loader2,
  Edit3,
  Save,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BarChart3
} from "lucide-react"
import type { Checklist } from "@/types/projects"

interface AnalysisResult {
  criterionId: string
  categoryId: string
  score: 0 | 1 | "?"
  confidence: number
  explanation: string
  needsReview: boolean
  isEdited: boolean
}

interface AutoAnalysisSectionProps {
  checklist: Checklist
  analysisResults: AnalysisResult[]
  isAnalyzing: boolean
  onAnalyze: () => void
  onScoreUpdate: (criterionId: string, categoryId: string, score: 0 | 1 | "?", explanation?: string) => void
}

export function AutoAnalysisSection({
  checklist,
  analysisResults,
  isAnalyzing,
  onAnalyze,
  onScoreUpdate
}: AutoAnalysisSectionProps) {
  const [editingCriterion, setEditingCriterion] = useState<string | null>(null)
  const [editExplanation, setEditExplanation] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const criterionTypeLabels: Record<string, string> = {
    binary: "Да/Нет",
    scale: "Шкала",
    percentage: "Процент"
  }

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  const handleScoreChange = useCallback((criterionId: string, categoryId: string, newScore: 0 | 1 | "?") => {
    onScoreUpdate(criterionId, categoryId, newScore)
  }, [onScoreUpdate])

  const startEditing = useCallback((result: AnalysisResult) => {
    setEditingCriterion(`${result.categoryId}-${result.criterionId}`)
    setEditExplanation(result.explanation)
  }, [])

  const saveEdit = useCallback((criterionId: string, categoryId: string) => {
    onScoreUpdate(criterionId, categoryId, 
      analysisResults.find(r => r.criterionId === criterionId && r.categoryId === categoryId)?.score || "?",
      editExplanation
    )
    setEditingCriterion(null)
    setEditExplanation("")
  }, [analysisResults, editExplanation, onScoreUpdate])

  const cancelEdit = useCallback(() => {
    setEditingCriterion(null)
    setEditExplanation("")
  }, [])

  const getScoreIcon = (score: 0 | 1 | "?", confidence: number) => {
    if (score === 1) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (score === 0) return <XCircle className="h-5 w-5 text-red-600" />
    return <HelpCircle className="h-5 w-5 text-yellow-600" />
  }

  const getScoreColor = (score: 0 | 1 | "?") => {
    if (score === 1) return "bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
    if (score === 0) return "bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200"
    return "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200"
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  // Group results by category
  const resultsByCategory = analysisResults.reduce((acc, result) => {
    if (!acc[result.categoryId]) {
      acc[result.categoryId] = []
    }
    acc[result.categoryId].push(result)
    return acc
  }, {} as Record<string, AnalysisResult[]>)

  const totalCriteria = analysisResults.length
  const completedCriteria = analysisResults.filter(r => r.score !== "?").length
  const highConfidenceCriteria = analysisResults.filter(r => r.confidence >= 80).length
  const needsReviewCount = analysisResults.filter(r => r.needsReview).length

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          ИИ-анализ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analysis Controls */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Сравните транскрипт с чек-листом с помощью ИИ
            </p>
            {analysisResults.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{completedCriteria}/{totalCriteria} обработано</span>
                <span>{highConfidenceCriteria} с высокой уверенностью</span>
                {needsReviewCount > 0 && (
                  <span className="text-yellow-600">{needsReviewCount} требуют проверки</span>
                )}
              </div>
            )}
          </div>
          
          <Button 
            onClick={onAnalyze} 
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Анализируем...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {analysisResults.length > 0 ? "Повторить анализ" : "Запустить анализ"}
              </>
            )}
          </Button>
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">ИИ анализирует транскрипт...</span>
            </div>
            <Progress value={65} className="h-2" />
            <p className="text-xs text-gray-500 text-center">
              Это может занять до 30 секунд в зависимости от длины записи
            </p>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResults.length > 0 && !isAnalyzing && (
          <div className="max-h-[32rem] space-y-4 overflow-y-auto pr-2">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{completedCriteria}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Проанализировано</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{highConfidenceCriteria}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Высокая уверенность</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{needsReviewCount}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Нужна проверка</div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((completedCriteria / totalCriteria) * 100)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Готовность</div>
              </div>
            </div>

            {/* Category Results */}
            <div className="space-y-3">
              {checklist.categories.map((category) => {
                const categoryResults = resultsByCategory[category.id || category.name.toLowerCase()] || []
                const isExpanded = expandedCategories.has(category.id || category.name.toLowerCase())
                
                return (
                  <div key={category.id || category.name} className="border rounded-lg">
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => toggleCategory(category.id || category.name.toLowerCase())}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <h3 className="font-medium">{category.name}</h3>
                            <Badge variant="outline">
                              {categoryResults.length} критериев
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-gray-500">
                              {categoryResults.filter(r => r.score !== "?").length}/{categoryResults.length}
                            </div>
                            {categoryResults.some(r => r.needsReview) && (
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t p-4 space-y-3">
                          {categoryResults.map((result) => {
                            const criterion = category.criteria.find(c => 
                              (c.id || `${category.id}-${category.criteria.indexOf(c)}`) === result.criterionId
                            )
                            const isEditing = editingCriterion === `${result.categoryId}-${result.criterionId}`
                            
                            return (
                              <div 
                                key={result.criterionId}
                                className={`p-4 rounded-lg border ${getScoreColor(result.score)} ${
                                  result.isEdited ? 'ring-2 ring-blue-200 dark:ring-blue-700' : ''
                                }`}
                              >
                                {/* Criterion Header */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{criterion?.text}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {criterionTypeLabels[criterion?.type || ""] || criterion?.type}
                                      </Badge>
                                      <span className={`text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
                                        Уверенность {result.confidence}%
                                      </span>
                                      {result.isEdited && (
                                        <Badge variant="outline" className="text-xs">
                                          Изменено
                                        </Badge>
                                      )}
                                      {result.needsReview && (
                                        <Badge variant="destructive" className="text-xs">
                                          Нужна проверка
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {getScoreIcon(result.score, result.confidence)}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEditing(result)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Score Controls */}
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">Оценка:</span>
                                  {[1, 0, "?"].map((score) => (
                                    <Button
                                      key={score}
                                      variant={result.score === score ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handleScoreChange(result.criterionId, result.categoryId, score as 0 | 1 | "?")}
                                      className="h-8 px-3"
                                    >
                                      {score === 1 ? "✓" : score === 0 ? "✕" : "?"}
                                    </Button>
                                  ))}
                                </div>

                                {/* Explanation */}
                                <div className="space-y-2">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">Комментарий ИИ:</span>
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editExplanation}
                                        onChange={(e) => setEditExplanation(e.target.value)}
                                        className="min-h-[80px] text-sm"
                                        placeholder="Измените пояснение..."
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => saveEdit(result.criterionId, result.categoryId)}
                                        >
                                          <Save className="h-3 w-3 mr-1" />
                                          Сохранить
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={cancelEdit}
                                        >
                                          Отмена
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded">
                                      {result.explanation}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )
              })}
            </div>

            {/* Analysis Summary */}
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              Анализ завершён! Проверьте результаты выше и при необходимости скорректируйте оценки. 
              Пункты с отметкой «проверить» желательно подтвердить вручную.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Empty State */}
      {analysisResults.length === 0 && !isAnalyzing && (
        <div className="text-center py-8 text-gray-500">
          <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Нажмите «Запустить анализ», чтобы начать оценку</p>
          <p className="text-sm mt-1">ИИ сравнит транскрипт с каждым пунктом чек-листа</p>
        </div>
      )}
      </CardContent>
    </Card>
  )
} 
