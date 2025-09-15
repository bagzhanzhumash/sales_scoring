import { NextResponse } from "next/server"

// Mock checklist templates matching backend structure
const checklistTemplates = {
  automotive: {
    id: "automotive-template",
    name: "Автомобильные продажи",
    description: "Чеклист для анализа звонков автосалонов",
    industry: "automotive",
    categories: [
      {
        id: "greeting",
        name: "Приветствие",
        description: "Оценка качества приветствия и представления",
        max_score: 10,
        weight: 1.0,
        criteria: [
          {
            id: "greeting-hello",
            text: "Поздоровался и представился?",
            description: "Менеджер поздоровался и назвал свое имя",
            type: "binary" as const,
            max_score: 5,
            weight: 1.0,
            is_required: true
          },
          {
            id: "greeting-company",
            text: "Назвал компанию?",
            description: "Менеджер назвал название автосалона",
            type: "binary" as const,
            max_score: 5,
            weight: 1.0,
            is_required: true
          }
        ]
      },
      {
        id: "needs-assessment",
        name: "Выявление потребностей",
        description: "Оценка качества выявления потребностей клиента",
        max_score: 20,
        weight: 1.5,
        criteria: [
          {
            id: "needs-budget",
            text: "Выяснил бюджет клиента?",
            description: "Менеджер узнал ценовой диапазон клиента",
            type: "binary" as const,
            max_score: 5,
            weight: 1.0,
            is_required: true
          },
          {
            id: "needs-car-type",
            text: "Уточнил тип автомобиля?",
            description: "Менеджер выяснил предпочтения по типу автомобиля",
            type: "binary" as const,
            max_score: 5,
            weight: 1.0,
            is_required: true
          },
          {
            id: "needs-timeline",
            text: "Узнал сроки покупки?",
            description: "Менеджер выяснил когда клиент планирует покупку",
            type: "binary" as const,
            max_score: 5,
            weight: 1.0,
            is_required: true
          },
          {
            id: "needs-usage",
            text: "Выяснил цель использования?",
            description: "Менеджер узнал для каких целей нужен автомобиль",
            type: "binary" as const,
            max_score: 5,
            weight: 1.0,
            is_required: false
          }
        ]
      },
      {
        id: "presentation",
        name: "Презентация",
        description: "Качество презентации автомобиля",
        max_score: 15,
        weight: 1.2,
        criteria: [
          {
            id: "presentation-features",
            text: "Рассказал о ключевых особенностях?",
            description: "Менеджер презентовал основные преимущества автомобиля",
            type: "binary" as const,
            max_score: 8,
            weight: 1.0,
            is_required: true
          },
          {
            id: "presentation-test-drive",
            text: "Предложил тест-драйв?",
            description: "Менеджер предложил клиенту протестировать автомобиль",
            type: "binary" as const,
            max_score: 7,
            weight: 1.0,
            is_required: true
          }
        ]
      }
    ]
  },
  real_estate: {
    id: "real-estate-template",
    name: "Недвижимость",
    description: "Чеклист для анализа звонков агентств недвижимости",
    industry: "real_estate",
    categories: [
      {
        id: "greeting",
        name: "Приветствие",
        description: "Оценка качества приветствия",
        max_score: 8,
        weight: 1.0,
        criteria: [
          {
            id: "greeting-hello",
            text: "Поздоровался и представился?",
            description: "Агент поздоровался и назвал свое имя",
            type: "binary" as const,
            max_score: 4,
            weight: 1.0,
            is_required: true
          },
          {
            id: "greeting-company",
            text: "Назвал компанию?",
            description: "Агент назвал название агентства",
            type: "binary" as const,
            max_score: 4,
            weight: 1.0,
            is_required: true
          }
        ]
      },
      {
        id: "needs-assessment",
        name: "Выявление потребностей",
        description: "Оценка выявления потребностей в недвижимости",
        max_score: 12,
        weight: 1.5,
        criteria: [
          {
            id: "needs-property-type",
            text: "Выяснил тип недвижимости?",
            description: "Агент узнал какой тип недвижимости интересует клиента",
            type: "binary" as const,
            max_score: 3,
            weight: 1.0,
            is_required: true
          },
          {
            id: "needs-location",
            text: "Уточнил район поиска?",
            description: "Агент выяснил предпочтения по району",
            type: "binary" as const,
            max_score: 3,
            weight: 1.0,
            is_required: true
          },
          {
            id: "needs-budget",
            text: "Выявил бюджет?",
            description: "Агент узнал ценовой диапазон клиента",
            type: "binary" as const,
            max_score: 3,
            weight: 1.0,
            is_required: true
          },
          {
            id: "needs-timeline",
            text: "Узнал сроки покупки?",
            description: "Агент выяснил когда клиент планирует покупку",
            type: "binary" as const,
            max_score: 3,
            weight: 1.0,
            is_required: true
          }
        ]
      }
    ]
  },
  insurance: {
    id: "insurance-template",
    name: "Страхование",
    description: "Чеклист для анализа звонков страховых компаний",
    industry: "insurance",
    categories: [
      {
        id: "greeting",
        name: "Приветствие",
        description: "Оценка качества приветствия",
        max_score: 5,
        weight: 1.0,
        criteria: [
          {
            id: "greeting-hello",
            text: "Поздоровался и представился?",
            description: "Менеджер поздоровался и назвал свое имя",
            type: "binary" as const,
            max_score: 2.5,
            weight: 1.0,
            is_required: true
          },
          {
            id: "greeting-company",
            text: "Назвал страховую компанию?",
            description: "Менеджер назвал название страховой компании",
            type: "binary" as const,
            max_score: 2.5,
            weight: 1.0,
            is_required: true
          }
        ]
      },
      {
        id: "needs-assessment",
        name: "Выявление потребностей",
        description: "Оценка выявления страховых потребностей",
        max_score: 10,
        weight: 2.0,
        criteria: [
          {
            id: "needs-insurance-type",
            text: "Выяснил тип страхования?",
            description: "Менеджер узнал какой вид страхования нужен клиенту",
            type: "binary" as const,
            max_score: 3.33,
            weight: 1.0,
            is_required: true
          },
          {
            id: "needs-object",
            text: "Уточнил объект страхования?",
            description: "Менеджер выяснил что именно нужно застраховать",
            type: "binary" as const,
            max_score: 3.33,
            weight: 1.0,
            is_required: true
          },
          {
            id: "needs-amount",
            text: "Выявил страховую сумму?",
            description: "Менеджер узнал на какую сумму нужно страхование",
            type: "binary" as const,
            max_score: 3.34,
            weight: 1.0,
            is_required: true
          }
        ]
      }
    ]
  }
}

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    return NextResponse.json({
      templates: checklistTemplates
    })
  } catch (error) {
    console.error('Error fetching checklist templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
} 