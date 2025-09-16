"use client"

export interface ClientRecord {
  id: string
  name: string
  status: string
  actionItems: string[]
  decision: string
}

export const fallbackActionItems = [
  "Менеджер запускает мягкую проверку кредитной истории и подтверждает одобрение",
  "Отправить детализацию графика платежей и документы"
]

export const fallbackDecision = "Клиент рассмотрит официальное предложение и сообщит о решении."

export const defaultClients: ClientRecord[] = [
  {
    id: "client-1",
    name: "Майкл Харрисон",
    status: "Заинтересован",
    actionItems: fallbackActionItems,
    decision: "Майкл обсудит официальное предложение с семьёй и сообщит о решении."
  },
  {
    id: "client-2",
    name: "Анна Петрова",
    status: "Требуется уточнение",
    actionItems: [
      "Получить расчёт ежемесячного платежа и страховку",
      "Подготовить пакет документов для отдела комплаенс"
    ],
    decision: "Ожидает уточнения условий и обратного звонка менеджера."
  }
]

export const storageKey = "scoring-clients"
