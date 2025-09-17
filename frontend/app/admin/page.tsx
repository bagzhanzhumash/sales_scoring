"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Star, Users } from "lucide-react"

const managers = [
  {
    id: "anna-petrova",
    name: "Анна Петрова",
    role: "Руководитель направления",
    bio: "10 лет строит отделы продаж в B2B. Сильна в переговорах и ведении ключевых клиентов.",
    photo: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80"
  },
  {
    id: "dmitry-ivanov",
    name: "Дмитрий Иванов",
    role: "Старший менеджер по продажам",
    bio: "Отлично работает с inbound-заявками и обучает команду активному слушанию.",
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80"
  },
  {
    id: "marina-smirnova",
    name: "Марина Смирнова",
    role: "Team Lead",
    bio: "Ведёт крупные сделки, внедряет сценарии звонков и культуру клиентского успеха.",
    photo: "https://images.unsplash.com/photo-1544723795-432537202d87?auto=format&fit=crop&w=320&q=80"
  },
  {
    id: "alexey-volkov",
    name: "Алексей Волков",
    role: "Наставник отдела",
    bio: "Специалист по внедрению CRM и построению воронок. Помогает новым менеджерам выйти на план.",
    photo: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=320&q=80"
  }
]

export default function AdminManagerDirectory() {
  return (
    <Suspense fallback={<DirectoryFallback />}> 
      <DirectoryContent />
    </Suspense>
  )
}

function DirectoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const persona = searchParams.get("persona")

  useEffect(() => {
    if (!persona) return

    if (persona === "manager") {
      router.replace("/test-scoring-manager")
      return
    }

    if (persona === "leader") {
      router.replace("/test-scoring")
    }
  }, [persona, router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-14">
        <header className="space-y-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm uppercase tracking-wide text-white/80 backdrop-blur">
            <Users className="h-4 w-4" />
            Команда продаж
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold sm:text-5xl">Выберите менеджера для оценки качества</h1>
            <p className="mx-auto max-w-2xl text-base text-white/70">
              Руководитель видит портфолио менеджеров, их сильные стороны и сферы развития. Нажмите на карточку, чтобы перейти к панели скоринга и запустить анализ разговоров.
            </p>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {managers.map(manager => (
            <button
              key={manager.id}
              onClick={() => router.push(`/test-scoring-manager?manager=${manager.id}`)}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-left shadow-lg transition-transform hover:-translate-y-1 hover:border-white/30 hover:shadow-xl"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={manager.photo}
                  alt={manager.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/0 to-slate-900/0" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-sm text-white/90">
                  <Star className="h-4 w-4 text-amber-300" />
                  Лучшие практики
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">{manager.name}</h2>
                  <p className="text-sm text-white/70">{manager.role}</p>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-white/80">{manager.bio}</p>
                <div className="flex items-center justify-between text-sm font-medium text-emerald-200">
                  Перейти к скорингу
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          ))}
        </section>

        <footer className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/70 backdrop-blur">
          После выбора менеджера вы попадёте в рабочее пространство с чек-листами, транскрибированными звонками и рекомендациями по улучшению качества.
        </footer>
      </div>
    </main>
  )
}

function DirectoryFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-white/70 backdrop-blur">
          Загружаем каталог менеджеров…
        </div>
      </div>
    </main>
  )
}
