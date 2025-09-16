"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Trash2, UserPlus } from "lucide-react"

import {
  ClientRecord,
  defaultClients,
  fallbackActionItems,
  fallbackDecision,
  storageKey
} from "./data"

const emptyForm = {
  name: "",
  status: "",
  actionItems: "",
  decision: ""
}

const parseActionItems = (raw: string) =>
  raw
    .split(/\r?\n|;/)
    .map(item => item.trim())
    .filter(Boolean)

export default function TestScoringManagerPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [formState, setFormState] = useState(emptyForm)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const stored = window.localStorage.getItem(storageKey)
    if (stored) {
      try {
        const parsed: ClientRecord[] = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length) {
          setClients(parsed)
          setIsHydrated(true)
          return
        }
      } catch (error) {
        console.warn("Не удалось прочитать сохранённые данные клиентов", error)
      }
    }

    setClients(defaultClients)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return
    window.localStorage.setItem(storageKey, JSON.stringify(clients))
  }, [clients, isHydrated])

  const isAddDisabled = useMemo(
    () => !formState.name.trim() || !formState.status.trim(),
    [formState.name, formState.status]
  )

  const handleAddClient = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const name = formState.name.trim()
      const status = formState.status.trim()
      if (!name || !status) return

      const actionItems = parseActionItems(formState.actionItems)
      const decision = formState.decision.trim()

      const newClient: ClientRecord = {
        id: `client-${Date.now()}`,
        name,
        status,
        actionItems: actionItems.length ? actionItems : fallbackActionItems,
        decision: decision || fallbackDecision
      }

      setClients(prev => [newClient, ...prev])
      setFormState(emptyForm)
    },
    [formState]
  )

  const handleRemoveClient = useCallback((id: string) => {
    setClients(prev => prev.filter(client => client.id !== id))
  }, [])

  const handleSelectClient = useCallback(
    (id: string) => {
      router.push(`/test-scoring-manager/${id}`)
    },
    [router]
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto space-y-8 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Админ-панель скоринга</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управляйте карточками клиентов, чтобы запускать скоринг звонков и отслеживать прогресс.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Добавить клиента
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddClient} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="client-name">
                  Имя клиента
                </label>
                <Input
                  id="client-name"
                  placeholder="Например, Ирина Кузнецова"
                  value={formState.name}
                  onChange={event => setFormState(prev => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="client-status">
                  Статус
                </label>
                <Input
                  id="client-status"
                  placeholder="Например, Заинтересован"
                  value={formState.status}
                  onChange={event => setFormState(prev => ({ ...prev, status: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="client-actions">
                  Дальнейшие действия
                </label>
                <Textarea
                  id="client-actions"
                  placeholder="Каждый пункт с новой строки или через точку с запятой"
                  rows={3}
                  value={formState.actionItems}
                  onChange={event => setFormState(prev => ({ ...prev, actionItems: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="client-decision">
                  Принятое решение
                </label>
                <Textarea
                  id="client-decision"
                  placeholder="Опишите договорённости или ожидания"
                  rows={3}
                  value={formState.decision}
                  onChange={event => setFormState(prev => ({ ...prev, decision: event.target.value }))}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isAddDisabled} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Добавить в таблицу
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Клиенты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дальнейшие действия</TableHead>
                  <TableHead>Принятое решение</TableHead>
                  <TableHead className="w-16 text-right">Удалить</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length ? (
                  clients.map(client => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer"
                      onClick={() => handleSelectClient(client.id)}
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {client.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{client.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {client.actionItems.length ? client.actionItems.join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {client.decision || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={event => {
                            event.stopPropagation()
                            handleRemoveClient(client.id)
                          }}
                          aria-label="Удалить клиента"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                      Добавьте клиента, чтобы начать работу со скорингом.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableCaption>Нажмите на клиента, чтобы перейти к скорингу звонка.</TableCaption>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
