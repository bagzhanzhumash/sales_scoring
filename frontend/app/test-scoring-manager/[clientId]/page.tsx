"use client"

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  UploadCloud,
  Waves,
  MessageSquare,
  Sparkles,
  ClipboardList,
  Mic,
  Play,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Lightbulb
} from "lucide-react"

import {
  ClientRecord,
  defaultClients,
  fallbackActionItems,
  fallbackDecision,
  storageKey
} from "../data"

interface DiarizedSegment {
  id: string
  speaker: "Agent" | "Customer"
  start: number
  end: number
  text: string
}

interface SummaryData {
  callSummary: {
    category: string
    purpose: string
    discussionPoints: string[]
    actionItems: string[]
    decisionMade: string
    createdAt: string
    managerRecommendations?: string[]
  }
  sentiment: {
    overall: string
    tone: string[]
    drivers: string[]
    recommendations: string[]
    managerRecommendations?: string[]
  }
  scorecards: Array<{
    title: string
    score: number
    target: number
    description: string
  }>
}

type ProcessingStage = "idle" | "ready" | "diarizing" | "summarizing" | "completed"

const stageSequence: Array<{
  key: Exclude<ProcessingStage, "idle">
  label: string
  description: string
  icon: typeof Sparkles
}> = [
  {
    key: "ready",
    label: "Аудио готово",
    description: "Файл выбран и проверен",
    icon: Mic
  },
  {
    key: "diarizing",
    label: "Диаризация",
    description: "Разделяем говорящих и временные интервалы",
    icon: Waves
  },
  {
    key: "summarizing",
    label: "Сводки",
    description: "Формируем основные выводы и инсайты",
    icon: Sparkles
  },
  {
    key: "completed",
    label: "Готово",
    description: "Расшифровка, резюме и скоркарты подготовлены",
    icon: CheckCircle2
  }
]

const defaultScorecards: SummaryData["scorecards"] = [
  {
    title: "Выявление потребностей",
    score: 4.2,
    target: 5,
    description: "Менеджер уточнил цели клиента и контекст"
  },
  {
    title: "Соответствие решения",
    score: 3.8,
    target: 5,
    description: "Предложение продукта сопоставлено с запросами"
  },
  {
    title: "Следующие шаги",
    score: 4.5,
    target: 5,
    description: "Ясный план и ожидания по дальнейшим действиям"
  }
]

const formatTimestamp = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const speakerLabels: Record<DiarizedSegment["speaker"], string> = {
  Agent: "Менеджер",
  Customer: "Клиент"
}

interface TranscriptionSegment {
  id: number
  start: number
  end: number
  text: string
}

interface TranscriptionResponse {
  text: string
  language?: string
  segments?: TranscriptionSegment[]
  task?: string
  model?: string
}

interface SummarizeResponse {
  callSummary: SummaryData["callSummary"] & { managerRecommendations?: string[] }
  sentiment: SummaryData["sentiment"] & { managerRecommendations?: string[] }
  scorecards: SummaryData["scorecards"]
}

const TRANSCRIBE_ENDPOINT = process.env.NEXT_PUBLIC_TRANSCRIBE_URL || "http://localhost:8001/transcribe"
const SUMMARIZE_ENDPOINT = process.env.NEXT_PUBLIC_SUMMARIZE_URL || "http://localhost:8002/summarize"

const buildManagerRecommendations = (client: ClientRecord, summary: SummaryData | null): string[] => {
  const summaryRecs = summary?.callSummary.managerRecommendations || summary?.sentiment.managerRecommendations
  if (summaryRecs && summaryRecs.length) {
    return Array.from(new Set(summaryRecs))
  }

  const suggestions = new Set<string>()

  const status = (client.status || "").toLowerCase()
  const decision = summary?.callSummary.decisionMade || client.decision
  const actionItems = summary?.callSummary.actionItems || client.actionItems || []

  suggestions.add(
    "Пересмотрите выполнение скрипта и чек-листа, отметьте отклонения и слова-паразиты для последующего коучинга."
  )
  suggestions.add(
    "Соберите краткий бриф к следующей встрече: цели клиента, ключевые возражения и подтвержденные обязательства."
  )

  if (actionItems.length) {
    suggestions.add(`Запланируйте контроль выполнения шага: ${actionItems[0]}.`)
  }

  if (decision) {
    suggestions.add(`Подтвердите с клиентом договорённость: ${decision}`)
  }

  if (summary?.sentiment.overall.toLowerCase().includes("негатив")) {
    suggestions.add("Подготовьте восстановительный звонок с упором на эмпатию и дополнительные гарантии качества сервиса.")
  } else {
    suggestions.add("Закрепите позитивный эмоциональный фон: отправьте follow-up с благодарностью и ценностью предложения.")
  }

  if (status.includes("уточн") || status.includes("ожид")) {
    suggestions.add("Согласуйте next best action: назначьте повторный звонок с ответами на открытые вопросы.")
  } else if (status.includes("интерес")) {
    suggestions.add("Предложите конкретный next best action — подготовьте КП и согласуйте сроки принятия решения.")
  }

  suggestions.add(
    "Передайте выводы в CRM, чтобы команда и руководство видели прогресс и качество коммуникации."
  )

  return Array.from(suggestions)
}

export default function ClientScoringPage() {
  const params = useParams<{ clientId: string }>()
  const router = useRouter()
  const [client, setClient] = useState<ClientRecord | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)
  const [transcriptSegments, setTranscriptSegments] = useState<DiarizedSegment[]>([])
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("idle")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!params?.clientId) return
    if (typeof window === "undefined") return

    const stored = window.localStorage.getItem(storageKey)
    let candidate: ClientRecord | undefined

    if (stored) {
      try {
        const parsed: ClientRecord[] = JSON.parse(stored)
        candidate = parsed.find(item => item.id === params.clientId)
      } catch (error) {
        console.warn("Не удалось прочитать данные клиента", error)
      }
    }

    if (!candidate) {
      candidate = defaultClients.find(item => item.id === params.clientId)
    }

    setClient(candidate ?? null)
    setIsLoaded(true)
  }, [params?.clientId])

  useEffect(() => {
    setAudioFile(null)
    setTranscriptSegments([])
    setSummaryData(null)
    setProcessingStage("idle")
    setProgress(0)
    setProcessingMessage(null)
  }, [client])

  useEffect(() => {
    if (!audioFile) {
      setAudioPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(audioFile)
    setAudioPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [audioFile])

  useEffect(() => {
    if (!audioFile) {
      setProcessingStage("idle")
      setProcessingMessage(null)
      setProgress(0)
    }
  }, [audioFile])

  const resetState = useCallback(() => {
    setTranscriptSegments([])
    setSummaryData(null)
    setProcessingStage(audioFile ? "ready" : "idle")
    setProgress(0)
    setProcessingMessage(null)
  }, [audioFile])

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setAudioFile(file)
    setTranscriptSegments([])
    setSummaryData(null)
    setProcessingStage("ready")
    setProgress(0)
    setProcessingMessage("Аудиофайл загружен. Можно запускать обработку.")
  }, [])

  const handleProcessAudio = useCallback(async () => {
    if (!audioFile || !client) return

    setIsProcessing(true)
    setProcessingStage("diarizing")
    setProcessingMessage("Отправляем аудио на распознавание...")
    setProgress(15)

    const formData = new FormData()
    formData.append("file", audioFile)

    let transcription: TranscriptionResponse | null = null

    try {
      const transcribeResponse = await fetch(TRANSCRIBE_ENDPOINT, {
        method: "POST",
        body: formData
      })

      if (!transcribeResponse.ok) {
        throw new Error(`Ошибка распознавания: ${transcribeResponse.status}`)
      }

      transcription = await transcribeResponse.json()
    } catch (error) {
      console.error(error)
      setProcessingStage("idle")
      setProcessingMessage("Не удалось распознать аудио. Проверьте сервис STT и повторите попытку.")
      setProgress(0)
      setIsProcessing(false)
      return
    }

    const segmentsFromStt = transcription?.segments ?? []

    const diarizedSegments: DiarizedSegment[] = segmentsFromStt.length
      ? segmentsFromStt.map((segment, index) => ({
          id: `seg-${segment.id}`,
          speaker: index % 2 === 0 ? "Agent" : "Customer",
          start: segment.start,
          end: segment.end,
          text: segment.text.trim()
        }))
      : [
          {
            id: "seg-0",
            speaker: "Agent",
            start: 0,
            end: Math.max(audioFile.size / 16000, 1),
            text: transcription?.text?.trim() || ""
          }
        ]

    setTranscriptSegments(diarizedSegments)
    setProgress(55)
    setProcessingStage("summarizing")
    setProcessingMessage("Генерируем резюме и рекомендации...")

    const summarizePayload = {
      transcript_text: transcription?.text || diarizedSegments.map(item => item.text).join(" \n"),
      client_name: client.name,
      status: client.status,
      action_items: client.actionItems.length ? client.actionItems : fallbackActionItems,
      decision: client.decision || fallbackDecision,
      segments: diarizedSegments.map(segment => ({ speaker: segment.speaker, text: segment.text }))
    }

    try {
      const summarizeResponse = await fetch(SUMMARIZE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summarizePayload)
      })

      if (!summarizeResponse.ok) {
        throw new Error(`Ошибка получения сводки: ${summarizeResponse.status}`)
      }

      const summaryJson: SummarizeResponse = await summarizeResponse.json()

      const generatedSummary: SummaryData = {
        callSummary: {
          category: summaryJson.callSummary.category,
          purpose: summaryJson.callSummary.purpose,
          discussionPoints: summaryJson.callSummary.discussionPoints,
          actionItems: summaryJson.callSummary.actionItems,
          decisionMade: summaryJson.callSummary.decisionMade,
          createdAt: summaryJson.callSummary.createdAt,
          managerRecommendations: summaryJson.callSummary.managerRecommendations
        },
        sentiment: {
          overall: summaryJson.sentiment.overall,
          tone: summaryJson.sentiment.tone,
          drivers: summaryJson.sentiment.drivers,
          recommendations: summaryJson.sentiment.recommendations,
          managerRecommendations: summaryJson.sentiment.managerRecommendations
        },
        scorecards: summaryJson.scorecards?.length ? summaryJson.scorecards : defaultScorecards
      }

      setSummaryData(generatedSummary)
      setProgress(100)
      setProcessingStage("completed")
      setProcessingMessage("Обработка завершена. Ознакомьтесь с вкладками ниже: там расшифровка и инсайты.")
    } catch (error) {
      console.error(error)
      setProcessingStage("idle")
      setProgress(0)
      setProcessingMessage("Не удалось получить сводку. Проверьте сервис LLM и повторите попытку.")
    } finally {
      setIsProcessing(false)
    }
  }, [audioFile, client])


  const handleReset = useCallback(() => {
    setAudioFile(null)
    resetState()
  }, [resetState])

  const activeStageIndex = useMemo(() => {
    if (processingStage === "idle") return -1
    return stageSequence.findIndex(stage => stage.key === processingStage)
  }, [processingStage])

  const showTranscript = transcriptSegments.length > 0
  const showSummary = Boolean(summaryData)
  const managerRecommendations = useMemo(
    () => (client ? buildManagerRecommendations(client, summaryData) : []),
    [client, summaryData]
  )

  if (!isLoaded) {
    return null
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 dark:bg-gray-950">
        <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Клиент не найден
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Проверьте ссылку или вернитесь в админ-панель, чтобы выбрать клиента для скоринга.
          </p>
          <Button onClick={() => router.push("/test-scoring-manager")}>
            Вернуться в админ-панель
          </Button>
        </div>
      </div>
    )
  }

  const displayName = client.name || "Без имени"
  const displayStatus = client.status || "Статус не указан"

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl space-y-8 px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => router.push("/test-scoring-manager")} className="gap-2 px-3">
            <ArrowLeft className="h-4 w-4" />
            Назад к админ-панели
          </Button>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Выбранный клиент</span>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{displayName}</span>
              <Badge variant="outline" className="text-xs uppercase tracking-wide">
                {displayStatus}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Скоринг звонка</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Загрузите аудиозапись разговора, изучите диаризованную расшифровку и получите автоматические инсайты.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UploadCloud className="h-5 w-5" />
                  Аудиофайл
                </CardTitle>
                <p className="text-sm text-gray-500">Выберите запись звонка, чтобы запустить процесс скоринга.</p>
              </div>
              {audioFile && (
                <Badge variant="outline" className="uppercase tracking-wide text-xs">
                  {Math.round((audioFile.size / 1024 / 1024) * 10) / 10} МБ
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div className="space-y-3">
                  <Input type="file" accept="audio/*" onChange={handleFileChange} />
                  <div className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium text-gray-800 dark:text-gray-200">Поддерживаемые форматы</p>
                    <p>MP3, WAV и M4A размером до 200 МБ.</p>
                    <p>Обработка включает диаризацию и автоматическое резюме звонка.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleProcessAudio}
                    disabled={!audioFile || isProcessing}
                    className="gap-2"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Waves className="h-4 w-4" />}
                    {isProcessing ? "Обработка" : "Обработать аудио"}
                  </Button>
                  <Button onClick={handleReset} variant="outline" disabled={!audioFile || isProcessing}>
                    Сбросить
                  </Button>
                </div>
              </div>

              {audioPreviewUrl && (
                <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-900/40">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <Play className="h-4 w-4" />
                    Прослушивание
                  </div>
                  <audio controls src={audioPreviewUrl} className="w-full" />
                  <p className="mt-2 text-xs text-gray-500">Слушайте запись параллельно с просмотром расшифровки и инсайтов.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Ход обработки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{processingStage === "idle" ? "Ожидание аудио" : "Прогресс обработки"}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="mt-2 h-2" />
              </div>

              {processingMessage && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{processingMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {stageSequence.map((stage, index) => {
                  const StageIcon = stage.icon
                  let status: "pending" | "active" | "done" = "pending"

                  if (activeStageIndex > index) {
                    status = "done"
                  } else if (activeStageIndex === index) {
                    status = "active"
                  }

                  return (
                    <div
                      key={stage.key}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${
                        status === "done"
                          ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10"
                          : status === "active"
                          ? "border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/10"
                          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/40"
                      }`}
                    >
                      <StageIcon
                        className={`mt-0.5 h-4 w-4 ${
                          status === "done" ? "text-green-600" : status === "active" ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{stage.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stage.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="call-summary">Итоги звонка</TabsTrigger>
            <TabsTrigger value="scorecards">Скоркарты</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-orange-500" />
                    Итоги звонка
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showSummary ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="bg-green-500/90">{summaryData!.callSummary.category}</Badge>
                        <Badge variant="outline" className="text-xs uppercase tracking-wide">
                          {summaryData!.callSummary.createdAt}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Цель</p>
                        <p className="text-gray-700 dark:text-gray-300">{summaryData!.callSummary.purpose}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Темы обсуждения</p>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-gray-700 dark:text-gray-300">
                          {summaryData!.callSummary.discussionPoints.map(point => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Дальнейшие действия</p>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-gray-700 dark:text-gray-300">
                            {summaryData!.callSummary.actionItems.map(item => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Принятое решение</p>
                          <p className="mt-2 text-gray-700 dark:text-gray-300">{summaryData!.callSummary.decisionMade}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-gray-500">
                      Загрузите и обработайте аудио, чтобы получить автоматическое резюме звонка.
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-orange-500" />
                      Анализ настроения
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {showSummary ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase text-gray-500">Общее настроение</p>
                          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{summaryData!.sentiment.overall}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-gray-500">Эмоциональный тон</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {summaryData!.sentiment.tone.map(tone => (
                              <Badge key={tone} variant="secondary">{tone}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-gray-500">Факторы настроения</p>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-gray-700 dark:text-gray-300">
                            {summaryData!.sentiment.drivers.map(driver => (
                              <li key={driver}>{driver}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-gray-500">Рекомендации</p>
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-gray-700 dark:text-gray-300">
                            {summaryData!.sentiment.recommendations.map(rec => (
                              <li key={rec}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-gray-500">
                        Инсайты по настроению появятся после обработки аудио.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Рекомендации менеджеру
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {showSummary ? (
                      <ul className="list-disc space-y-3 pl-5 text-sm text-gray-700 dark:text-gray-300">
                        {managerRecommendations.map(recommendation => (
                          <li key={recommendation}>{recommendation}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center text-sm text-gray-500">
                        После обработки звонка появятся персональные рекомендации по следующему шагу.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5 text-blue-500" />
                  Диаризованная расшифровка
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showTranscript ? (
                  <div className="space-y-3">
                    {transcriptSegments.map(segment => (
                      <div
                        key={segment.id}
                        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/40"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={segment.speaker === "Agent" ? "default" : "secondary"}>
                              {speakerLabels[segment.speaker]}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-200">{segment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    Расшифровка появится после завершения диаризации.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="call-summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  Итоги звонка
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showSummary ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="bg-green-500/90">{summaryData!.callSummary.category}</Badge>
                      <Badge variant="outline" className="text-xs uppercase tracking-wide">
                        {summaryData!.callSummary.createdAt}
                      </Badge>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{summaryData!.callSummary.purpose}</p>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Темы обсуждения</p>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-gray-700 dark:text-gray-300">
                          {summaryData!.callSummary.discussionPoints.map(point => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Дальнейшие действия</p>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-gray-700 dark:text-gray-300">
                          {summaryData!.callSummary.actionItems.map(item => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Принятое решение</p>
                      <p className="mt-2 text-gray-700 dark:text-gray-300">{summaryData!.callSummary.decisionMade}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    Обработайте аудио, чтобы увидеть структурированное резюме звонка.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Рекомендации менеджеру
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showSummary ? (
                  <ul className="list-disc space-y-3 pl-5 text-sm text-gray-700 dark:text-gray-300">
                    {managerRecommendations.map(recommendation => (
                      <li key={recommendation}>{recommendation}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    Обработайте аудио, чтобы получить рекомендации по развитию сделки.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scorecards">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Скоркарты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(summaryData?.scorecards ?? defaultScorecards).map(metric => (
                  <div
                    key={metric.title}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-800 dark:bg-gray-900/40"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{metric.title}</p>
                      <span className="text-sm text-gray-500">{metric.score.toFixed(1)} / {metric.target}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{metric.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
