#!/usr/bin/env python3
"""
Example usage of the Jira integration for creating tickets from call summaries.
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Any

import httpx

# Base URL for the API
BASE_URL = "http://localhost:8000"

# Example call summary data (as would be returned by the call analysis)
EXAMPLE_CALL_SUMMARY = {
    "callSummary": {
        "category": "Переговоры",
        "purpose": "Клиент ООО РосИнвест обсуждает условия и следующий шаг по сделке.",
        "discussionPoints": [
            "Клиент: Нас интересует ваше предложение по автоматизации склада",
            "Менеджер: Мы можем предложить комплексное решение с роботизированными системами",
            "Клиент: Какие сроки внедрения и стоимость проекта?"
        ],
        "actionItems": [
            "Подготовить техническое предложение",
            "Рассчитать точную стоимость проекта",
            "Назначить встречу с техническими специалистами"
        ],
        "decisionMade": "Клиент заинтересован, ждет технического предложения до конца недели",
        "createdAt": datetime.now().strftime("%d.%m.%Y"),
        "managerRecommendations": [
            "Контролируйте выполнение первого шага: Подготовить техническое предложение",
            "Сформируйте бриф к следующей встрече с ключевыми возражениями и планом ответов",
            "Обновите CRM, чтобы команда видела прогресс и качество коммуникации",
            "Подготовьте next best action: назначьте повторный звонок или отправьте КП",
            "Используйте позитивный настрой, чтобы закрепить договорённость и сократить цикл сделки",
            "Подтвердите договорённость письмом: Клиент заинтересован, ждет технического предложения до конца недели"
        ]
    },
    "sentiment": {
        "overall": "Позитивное",
        "tone": ["Уверенный", "Дружелюбный"],
        "drivers": [
            "Клиент активно интересуется предложением",
            "Менеджер предоставляет четкие ответы на вопросы"
        ],
        "recommendations": [
            "Подтвердите договорённости письмом",
            "Назначьте повторный созвон после отправки материалов"
        ],
        "managerRecommendations": [
            "Контролируйте выполнение первого шага: Подготовить техническое предложение",
            "Используйте позитивный настрой, чтобы закрепить договорённость и сократить цикл сделки"
        ]
    },
    "scorecards": [
        {
            "title": "Выявление потребностей",
            "score": 4.5,
            "target": 5,
            "description": "Менеджер успешно выявил потребности в автоматизации склада"
        },
        {
            "title": "Соответствие решения",
            "score": 4.2,
            "target": 5,
            "description": "Предложение хорошо соответствует запросам клиента"
        },
        {
            "title": "Следующие шаги",
            "score": 4.8,
            "target": 5,
            "description": "Четко определены следующие шаги и временные рамки"
        }
    ]
}


async def check_jira_health() -> Dict[str, Any]:
    """Check if Jira integration is available and configured."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/v1/jira/health")
        return response.json()


async def create_tickets_from_summary(
    call_summary: Dict[str, Any],
    client_name: str = "ООО РосИнвест",
    assignee: str = None
) -> Dict[str, Any]:
    """Create Jira tickets from call summary recommendations."""
    request_data = {
        "call_summary": call_summary,
        "client_name": client_name,
        "assignee": assignee
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/jira/create-tickets-from-summary",
            json=request_data,
            timeout=30.0
        )
        return response.json()


async def create_single_ticket() -> Dict[str, Any]:
    """Example of creating a single Jira ticket."""
    ticket_data = {
        "summary": "Подготовить техническое предложение для ООО РосИнвест",
        "description": """
Техническое предложение по автоматизации склада для клиента ООО РосИнвест.

**Требования:**
- Роботизированные системы
- Комплексное решение
- Расчет стоимости проекта
- Определение сроков внедрения

**Контекст:**
Клиент активно заинтересован в решении.
Ожидает предложение до конца недели.

**Приоритет:** Высокий (позитивное настроение клиента)
        """.strip(),
        "issue_type": "Task",
        "priority": "High",
        "project_key": "SALES",
        "labels": ["call-analysis", "sales-follow-up", "client-rosinvest"]
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/jira/create-ticket",
            json=ticket_data,
            timeout=30.0
        )
        return response.json()


async def create_tickets_async(call_summary: Dict[str, Any]) -> Dict[str, Any]:
    """Create tickets asynchronously (background task)."""
    request_data = {
        "call_summary": call_summary,
        "client_name": "ООО РосИнвест"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/jira/create-tickets-from-summary-async",
            json=request_data,
            timeout=30.0
        )
        return response.json()


async def main():
    """Main example function."""
    print("🎯 Jira Integration Example")
    print("=" * 50)
    
    # Check Jira health
    print("\n1. Checking Jira health...")
    try:
        health_status = await check_jira_health()
        print(f"   Status: {health_status}")
        
        if not health_status.get("enabled"):
            print("   ⚠️  Jira integration is disabled")
            print("   Enable it by setting JIRA_ENABLED=true in your .env file")
            return
        
        if not health_status.get("configured"):
            print("   ⚠️  Jira integration is not properly configured")
            print("   Required environment variables:")
            print("   - JIRA_BASE_URL=https://your-domain.atlassian.net")
            print("   - JIRA_USERNAME=your-email@example.com")
            print("   - JIRA_API_TOKEN=your-api-token")
            print("   - JIRA_PROJECT_KEY=SALES")
            return
            
    except Exception as e:
        print(f"   ❌ Error checking health: {e}")
        return
    
    # Create tickets from call summary
    print("\n2. Creating tickets from call summary...")
    try:
        result = await create_tickets_from_summary(EXAMPLE_CALL_SUMMARY)
        print(f"   ✅ Created {result['tickets_count']} tickets:")
        
        for ticket in result["tickets_created"]:
            print(f"   📋 {ticket['ticket_key']}: {ticket['summary']}")
            print(f"      🔗 {ticket['ticket_url']}")
            
    except Exception as e:
        print(f"   ❌ Error creating tickets: {e}")
    
    # Example of single ticket creation
    print("\n3. Creating a single ticket...")
    try:
        ticket = await create_single_ticket()
        print(f"   ✅ Created ticket: {ticket['ticket_key']}")
        print(f"   📋 Summary: {ticket['summary']}")
        print(f"   🔗 URL: {ticket['ticket_url']}")
        
    except Exception as e:
        print(f"   ❌ Error creating single ticket: {e}")
    
    # Example of async ticket creation
    print("\n4. Creating tickets asynchronously...")
    try:
        result = await create_tickets_async(EXAMPLE_CALL_SUMMARY)
        print(f"   ✅ Queued ticket creation: {result['status']}")
        print(f"   📊 Recommendations to process: {result['recommendations_count']}")
        
    except Exception as e:
        print(f"   ❌ Error creating async tickets: {e}")
    
    print("\n🎉 Example completed!")
    print("\nTo set up Jira integration:")
    print("1. Create a Jira API token: https://id.atlassian.com/manage-profile/security/api-tokens")
    print("2. Set environment variables in your .env file:")
    print("   JIRA_ENABLED=true")
    print("   JIRA_BASE_URL=https://your-domain.atlassian.net")
    print("   JIRA_USERNAME=your-email@example.com")
    print("   JIRA_API_TOKEN=your-api-token")
    print("   JIRA_PROJECT_KEY=SALES")


def print_curl_examples():
    """Print curl examples for testing the API."""
    print("\n📡 Curl Examples:")
    print("=" * 50)
    
    print("\n1. Check Jira health:")
    print(f"curl -X GET {BASE_URL}/api/v1/jira/health")
    
    print("\n2. Create tickets from summary:")
    print(f"""curl -X POST {BASE_URL}/api/v1/jira/create-tickets-from-summary \\
  -H "Content-Type: application/json" \\
  -d '{json.dumps({
      "call_summary": EXAMPLE_CALL_SUMMARY,
      "client_name": "ООО РосИнвест"
  }, ensure_ascii=False, indent=2)}'""")
    
    print("\n3. Create single ticket:")
    print(f"""curl -X POST {BASE_URL}/api/v1/jira/create-ticket \\
  -H "Content-Type: application/json" \\
  -d '{json.dumps({
      "summary": "Follow up with client",
      "description": "Contact client about pending proposal",
      "project_key": "SALES",
      "priority": "Medium"
  }, indent=2)}'""")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "curl":
        print_curl_examples()
    else:
        print("Starting async example...")
        print("(Use 'python example_jira_usage.py curl' for curl examples)")
        asyncio.run(main())
