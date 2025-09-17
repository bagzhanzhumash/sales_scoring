"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Users } from "lucide-react"

const features = [
  "AI-скоринг звонков за минуты",
  "Выгрузка ключевых метрик и рекомендаций",
  "Совместная работа менеджеров и руководителей"
]

export default function DemoLandingPage() {
  const router = useRouter()

  const handleManagerClick = () => {
    router.push("/admin?persona=manager")
  }

  const handleLeaderClick = () => {
    router.push("/admin?persona=leader")
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-4 py-16 text-white">
      <div className="absolute inset-0 opacity-40" aria-hidden>
        <div className="pointer-events-none absolute -left-36 top-32 h-72 w-72 rounded-full bg-purple-500 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
          <Sparkles className="h-4 w-4" />
          Платформа оценки качества продаж
        </span>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Управляйте качеством общения команды с помощью умного скоринга
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            Выберите подходящую роль и начните работу: менеджеры получают удобные инструменты для подготовки, а руководители — обзор командной эффективности.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="grid gap-2 text-left text-sm text-white/70 sm:grid-cols-3">
            {features.map(item => (
              <div key={item} className="flex items-start gap-2 rounded-xl bg-white/5 p-4">
                <Users className="mt-0.5 h-4 w-4 text-white/60" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button
              size="lg"
              className="w-full gap-2 rounded-full bg-white text-slate-900 hover:bg-slate-100 sm:w-auto"
              onClick={handleManagerClick}
            >
              я менеджер
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 rounded-full border-white/60 bg-transparent text-white hover:bg-white/10 sm:w-auto"
              onClick={handleLeaderClick}
            >
              я руководитель
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
