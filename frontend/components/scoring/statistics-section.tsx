"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  HelpCircle,
  Users,
  Bot,
  Percent
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

interface StatisticsSectionProps {
  analysisResults: AnalysisResult[]
  checklist: Checklist
}

export function StatisticsSection({
  analysisResults,
  checklist
}: StatisticsSectionProps) {
  const statistics = useMemo(() => {
    const totalCriteria = analysisResults.length
    const passedCriteria = analysisResults.filter(r => r.score === 1).length
    const failedCriteria = analysisResults.filter(r => r.score === 0).length
    const reviewCriteria = analysisResults.filter(r => r.score === "?").length
    const editedCriteria = analysisResults.filter(r => r.isEdited).length
    const needsReviewCriteria = analysisResults.filter(r => r.needsReview).length
    
    // Confidence distribution
    const highConfidence = analysisResults.filter(r => r.confidence >= 80).length
    const mediumConfidence = analysisResults.filter(r => r.confidence >= 60 && r.confidence < 80).length
    const lowConfidence = analysisResults.filter(r => r.confidence < 60).length
    
    // Average confidence
    const avgConfidence = totalCriteria > 0 
      ? Math.round(analysisResults.reduce((acc, r) => acc + r.confidence, 0) / totalCriteria)
      : 0
    
    // Category-wise performance
    const categoryStats = checklist.categories.map(category => {
      const categoryResults = analysisResults.filter(r => 
        r.categoryId === (category.id || category.name.toLowerCase())
      )
      const categoryPassed = categoryResults.filter(r => r.score === 1).length
      const categoryTotal = categoryResults.length
      
      return {
        name: category.name,
        passed: categoryPassed,
        total: categoryTotal,
        percentage: categoryTotal > 0 ? Math.round((categoryPassed / categoryTotal) * 100) : 0,
        avgConfidence: categoryTotal > 0 
          ? Math.round(categoryResults.reduce((acc, r) => acc + r.confidence, 0) / categoryTotal)
          : 0
      }
    })
    
    // Overall score
    const overallScore = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0
    
    // LLM vs Human agreement (mock calculation)
    const llmHumanAgreement = totalCriteria > 0 
      ? Math.round(((totalCriteria - editedCriteria) / totalCriteria) * 100)
      : 100

    return {
      totalCriteria,
      passedCriteria,
      failedCriteria,
      reviewCriteria,
      editedCriteria,
      needsReviewCriteria,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      avgConfidence,
      categoryStats,
      overallScore,
      llmHumanAgreement
    }
  }, [analysisResults, checklist])

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
    if (percentage >= 60) return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
    return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Статистика анализа
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Performance */}
        <div className={`p-6 rounded-lg border ${getPerformanceBgColor(statistics.overallScore)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Общий результат</h3>
            <div className={`text-3xl font-bold ${getPerformanceColor(statistics.overallScore)}`}>
              {statistics.overallScore}%
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-1" />
                <span className="text-2xl font-bold text-green-600">{statistics.passedCriteria}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Выполнено</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-5 w-5 text-red-600 mr-1" />
                <span className="text-2xl font-bold text-red-600">{statistics.failedCriteria}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Не выполнено</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <HelpCircle className="h-5 w-5 text-yellow-600 mr-1" />
                <span className="text-2xl font-bold text-yellow-600">{statistics.reviewCriteria}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">На проверке</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-blue-600 mr-1" />
                <span className="text-2xl font-bold text-blue-600">{statistics.totalCriteria}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Всего</p>
            </div>
          </div>
        </div>

        {/* Confidence Distribution */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Распределение уверенности
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Средняя уверенность</span>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {statistics.avgConfidence}%
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Высокая уверенность (80%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{statistics.highConfidence}</span>
                  <div className="w-24">
                    <Progress 
                      value={statistics.totalCriteria > 0 ? (statistics.highConfidence / statistics.totalCriteria) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Средняя уверенность (60–79%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{statistics.mediumConfidence}</span>
                  <div className="w-24">
                    <Progress 
                      value={statistics.totalCriteria > 0 ? (statistics.mediumConfidence / statistics.totalCriteria) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Низкая уверенность (&lt;60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{statistics.lowConfidence}</span>
                  <div className="w-24">
                    <Progress 
                      value={statistics.totalCriteria > 0 ? (statistics.lowConfidence / statistics.totalCriteria) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Performance */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Эффективность по категориям
          </h3>
          
          <div className="space-y-3">
            {statistics.categoryStats.map((category, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{category.name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {category.passed}/{category.total}
                    </Badge>
                    <span className={`font-bold ${getPerformanceColor(category.percentage)}`}>
                      {category.percentage}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Progress value={category.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Ср. уверенность: {category.avgConfidence}%</span>
                    <span>{category.passed} критериев выполнено</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI vs Human Analysis */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Сравнение ИИ и экспертов
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Совпадение с ИИ</h4>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {statistics.llmHumanAgreement}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Процент совпадения оценок ИИ и людей
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium">Ручные правки</h4>
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {statistics.editedCriteria}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Столько критериев исправлено вручную
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  Выводы по качеству
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {statistics.needsReviewCriteria > 0 && 
                    `${statistics.needsReviewCriteria} критериев требуют ручной проверки из-за низкой уверенности. `
                  }
                  {statistics.llmHumanAgreement >= 90 && 
                    "Высокая точность ИИ — можно автоматизировать похожие проверки."
                  }
                  {statistics.llmHumanAgreement < 70 && 
                    "Рекомендуем уточнить подсказки для ИИ или добавить примеры обучения."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {Math.round((statistics.passedCriteria / statistics.totalCriteria) * 100) || 0}%
              </div>
              <div className="text-xs text-gray-500">Доля выполнения</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {statistics.avgConfidence}%
              </div>
              <div className="text-xs text-gray-500">Средняя уверенность</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {statistics.llmHumanAgreement}%
              </div>
              <div className="text-xs text-gray-500">Совпадение с ИИ</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {statistics.needsReviewCriteria}
              </div>
              <div className="text-xs text-gray-500">Нужна проверка</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
