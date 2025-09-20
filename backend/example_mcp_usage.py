#!/usr/bin/env python3
"""
Example usage of the MCP (Model Context Protocol) Jira integration.
This demonstrates how to interact with the MCP server for creating Jira tickets.
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Any

import httpx


# Base URL for the MCP server
MCP_BASE_URL = "http://localhost:8000/mcp"

# Example call summary data
EXAMPLE_CALL_SUMMARY = {
    "callSummary": {
        "category": "Переговоры",
        "purpose": "Клиент ООО РосИнвест обсуждает условия и следующий шаг по сделке",
        "discussionPoints": [
            "Клиент: Интересует автоматизация склада с роботизированными системами",
            "Менеджер: Предлагаем комплексное решение с интеграцией WMS",
            "Клиент: Какие сроки внедрения и стоимость проекта?"
        ],
        "actionItems": [
            "Подготовить техническое предложение по автоматизации склада",
            "Рассчитать точную стоимость проекта с учетом всех компонентов",
            "Назначить встречу с техническими специалистами на следующей неделе"
        ],
        "decisionMade": "Клиент заинтересован, ждет технического предложения до конца недели",
        "createdAt": datetime.now().strftime("%d.%m.%Y"),
        "managerRecommendations": [
            "Контролируйте выполнение первого шага: Подготовить техническое предложение",
            "Сформируйте бриф к следующей встрече с ключевыми возражениями и планом ответов",
            "Обновите CRM, чтобы команда видела прогресс и качество коммуникации",
            "Подготовьте next best action: назначьте повторный звонок или отправьте КП",
            "Используйте позитивный настрой, чтобы закрепить договорённость и сократить цикл сделки",
            "Подтвердите договорённость письмом: Клиент заинтересован, ждет технического предложения"
        ]
    },
    "sentiment": {
        "overall": "Позитивное",
        "tone": ["Уверенный", "Дружелюбный"],
        "drivers": [
            "Клиент активно интересуется предложением",
            "Менеджер предоставляет четкие ответы на вопросы",
            "Обе стороны заинтересованы в продолжении диалога"
        ],
        "recommendations": [
            "Подтвердите договорённости письмом",
            "Назначьте повторный созвон после отправки материалов"
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


async def call_mcp_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Call an MCP tool with the specified arguments.
    
    Args:
        tool_name: Name of the MCP tool to call
        arguments: Dictionary of arguments to pass to the tool
        
    Returns:
        Dict with the tool response
    """
    mcp_request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{MCP_BASE_URL}/tools/call",
            json=mcp_request,
            headers={"Content-Type": "application/json"},
            timeout=30.0
        )
        return response.json()


async def list_mcp_tools() -> Dict[str, Any]:
    """List all available MCP tools."""
    mcp_request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{MCP_BASE_URL}/tools/list",
            json=mcp_request,
            headers={"Content-Type": "application/json"},
            timeout=10.0
        )
        return response.json()


async def check_mcp_jira_health() -> Dict[str, Any]:
    """Check Jira health using MCP tool."""
    print("🔍 Checking Jira health via MCP...")
    
    try:
        result = await call_mcp_tool("check_jira_health", {})
        
        if "result" in result:
            health_data = result["result"]
            print(f"   ✅ Health check result: {health_data}")
            return health_data
        else:
            print(f"   ❌ Error in health check: {result}")
            return result
            
    except Exception as e:
        print(f"   ❌ Exception during health check: {e}")
        return {"error": str(e)}


async def create_single_ticket_mcp() -> Dict[str, Any]:
    """Create a single ticket using MCP tool."""
    print("🎫 Creating single ticket via MCP...")
    
    ticket_args = {
        "summary": "Подготовить техническое предложение для ООО РосИнвест",
        "description": """
Техническое предложение по автоматизации склада для клиента ООО РосИнвест.

**Требования:**
- Роботизированные системы складирования
- Интеграция с WMS системой
- Расчет полной стоимости проекта
- Определение сроков внедрения

**Контекст:**
Клиент активно заинтересован в решении.
Ожидает предложение до конца недели.
Позитивное настроение на звонке.

**Создано из MCP анализа звонка**
        """.strip(),
        "issue_type": "Task",
        "priority": "High",
        "labels": ["mcp-created", "call-analysis", "client-rosinvest"]
    }
    
    try:
        result = await call_mcp_tool("create_jira_ticket", ticket_args)
        
        if "result" in result:
            ticket_data = result["result"]
            if ticket_data.get("success"):
                print(f"   ✅ Created ticket: {ticket_data.get('ticket_key')}")
                print(f"   🔗 URL: {ticket_data.get('ticket_url')}")
                return ticket_data
            else:
                print(f"   ❌ Failed to create ticket: {ticket_data.get('error')}")
                return ticket_data
        else:
            print(f"   ❌ Error in ticket creation: {result}")
            return result
            
    except Exception as e:
        print(f"   ❌ Exception during ticket creation: {e}")
        return {"error": str(e)}


async def create_tickets_from_summary_mcp() -> Dict[str, Any]:
    """Create tickets from call summary using MCP tool."""
    print("📋 Creating tickets from call summary via MCP...")
    
    summary_args = {
        "call_summary": EXAMPLE_CALL_SUMMARY,
        "client_name": "ООО РосИнвест",
        "assignee": None  # Will use default
    }
    
    try:
        result = await call_mcp_tool("create_tickets_from_call_summary", summary_args)
        
        if "result" in result:
            tickets_data = result["result"]
            if tickets_data.get("success"):
                tickets_count = tickets_data.get("tickets_count", 0)
                print(f"   ✅ Created {tickets_count} tickets from {tickets_data.get('total_recommendations')} recommendations")
                
                for ticket in tickets_data.get("tickets_created", []):
                    print(f"   📋 {ticket['ticket_key']}: {ticket['summary'][:60]}...")
                    print(f"      🔗 {ticket['ticket_url']}")
                
                return tickets_data
            else:
                print(f"   ❌ Failed to create tickets: {tickets_data.get('error')}")
                return tickets_data
        else:
            print(f"   ❌ Error in tickets creation: {result}")
            return result
            
    except Exception as e:
        print(f"   ❌ Exception during tickets creation: {e}")
        return {"error": str(e)}


async def analyze_recommendations_mcp() -> Dict[str, Any]:
    """Analyze call recommendations without creating tickets using MCP tool."""
    print("🔍 Analyzing call recommendations via MCP...")
    
    analysis_args = {
        "call_summary": EXAMPLE_CALL_SUMMARY,
        "client_name": "ООО РосИнвест"
    }
    
    try:
        result = await call_mcp_tool("analyze_call_recommendations", analysis_args)
        
        if "result" in result:
            analysis_data = result["result"]
            if analysis_data.get("success"):
                recommendations = analysis_data.get("recommendations", [])
                print(f"   ✅ Analyzed {len(recommendations)} recommendations:")
                
                for rec in recommendations:
                    print(f"   📝 {rec['type']}: {rec['content'][:50]}... (Priority: {rec['priority']})")
                
                print(f"   🎭 Sentiment: {analysis_data.get('call_sentiment')}")
                print(f"   📊 Category: {analysis_data.get('call_category')}")
                
                return analysis_data
            else:
                print(f"   ❌ Failed to analyze: {analysis_data.get('error')}")
                return analysis_data
        else:
            print(f"   ❌ Error in analysis: {result}")
            return result
            
    except Exception as e:
        print(f"   ❌ Exception during analysis: {e}")
        return {"error": str(e)}


async def get_jira_config_mcp() -> Dict[str, Any]:
    """Get Jira configuration using MCP tool."""
    print("⚙️ Getting Jira configuration via MCP...")
    
    try:
        result = await call_mcp_tool("get_jira_config", {})
        
        if "result" in result:
            config_data = result["result"]
            print(f"   ✅ Configuration: {config_data}")
            return config_data
        else:
            print(f"   ❌ Error getting config: {result}")
            return result
            
    except Exception as e:
        print(f"   ❌ Exception getting config: {e}")
        return {"error": str(e)}


async def generate_sample_data_mcp() -> Dict[str, Any]:
    """Generate sample call summary using MCP tool."""
    print("🎲 Generating sample call summary via MCP...")
    
    try:
        result = await call_mcp_tool("generate_sample_call_summary", {})
        
        if "result" in result:
            sample_data = result["result"]
            if sample_data.get("success"):
                print("   ✅ Generated sample call summary for testing")
                return sample_data
            else:
                print(f"   ❌ Failed to generate sample: {sample_data}")
                return sample_data
        else:
            print(f"   ❌ Error generating sample: {result}")
            return result
            
    except Exception as e:
        print(f"   ❌ Exception generating sample: {e}")
        return {"error": str(e)}


async def list_available_tools() -> Dict[str, Any]:
    """List all available MCP tools."""
    print("🛠️ Listing available MCP tools...")
    
    try:
        result = await list_mcp_tools()
        
        if "result" in result:
            tools = result["result"].get("tools", [])
            print(f"   ✅ Found {len(tools)} available tools:")
            
            for tool in tools:
                print(f"   🔧 {tool['name']}: {tool['description']}")
            
            return result
        else:
            print(f"   ❌ Error listing tools: {result}")
            return result
            
    except Exception as e:
        print(f"   ❌ Exception listing tools: {e}")
        return {"error": str(e)}


async def main():
    """Main example function demonstrating MCP integration."""
    print("🚀 MCP (Model Context Protocol) Jira Integration Example")
    print("=" * 60)
    
    # List available tools
    print("\n1. Discovering MCP Tools...")
    await list_available_tools()
    
    # Check Jira health
    print("\n2. Checking Jira Health...")
    health_result = await check_mcp_jira_health()
    
    if not health_result.get("enabled"):
        print("\n⚠️  Jira integration is disabled. Enable it to test ticket creation.")
        print("   Set JIRA_ENABLED=true in your .env file")
        return
    
    if not health_result.get("configured"):
        print("\n⚠️  Jira integration is not properly configured.")
        print("   Check the required environment variables:")
        print("   - JIRA_BASE_URL, JIRA_USERNAME, JIRA_API_TOKEN, JIRA_PROJECT_KEY")
        return
    
    # Get configuration
    print("\n3. Getting Jira Configuration...")
    await get_jira_config_mcp()
    
    # Analyze recommendations
    print("\n4. Analyzing Call Recommendations...")
    await analyze_recommendations_mcp()
    
    # Create single ticket
    print("\n5. Creating Single Ticket...")
    await create_single_ticket_mcp()
    
    # Create tickets from summary
    print("\n6. Creating Tickets from Call Summary...")
    await create_tickets_from_summary_mcp()
    
    # Generate sample data
    print("\n7. Generating Sample Data...")
    await generate_sample_data_mcp()
    
    print("\n🎉 MCP Integration Example Completed!")
    print("\n📖 What's Different About MCP:")
    print("   • Standardized protocol for AI-tool interaction")
    print("   • Tools are discoverable and self-describing")
    print("   • AI agents can call tools directly without custom APIs")
    print("   • Schema validation and error handling built-in")
    print("   • Server-sent events for real-time communication")
    
    print("\n🔧 Available MCP Tools:")
    print("   • check_jira_health - Check integration status")
    print("   • create_jira_ticket - Create individual tickets")
    print("   • create_tickets_from_call_summary - Batch ticket creation")
    print("   • analyze_call_recommendations - Preview recommendations")
    print("   • get_jira_config - Get configuration info")
    print("   • generate_sample_call_summary - Generate test data")


def print_mcp_curl_examples():
    """Print cURL examples for MCP integration."""
    print("\n📡 MCP cURL Examples:")
    print("=" * 50)
    
    print("\n1. List available tools:")
    print(f"""curl -X POST {MCP_BASE_URL}/tools/list \\
  -H "Content-Type: application/json" \\
  -d '{{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}}'""")
    
    print("\n2. Check Jira health:")
    print(f"""curl -X POST {MCP_BASE_URL}/tools/call \\
  -H "Content-Type: application/json" \\
  -d '{{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {{"name": "check_jira_health", "arguments": {{}}}}}}'""")
    
    print("\n3. Create single ticket:")
    create_ticket_payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "create_jira_ticket",
            "arguments": {
                "summary": "Test ticket from MCP",
                "description": "This is a test ticket created via MCP",
                "priority": "Medium"
            }
        }
    }
    print(f"""curl -X POST {MCP_BASE_URL}/tools/call \\
  -H "Content-Type: application/json" \\
  -d '{json.dumps(create_ticket_payload, ensure_ascii=False)}'""")
    
    print("\n4. Analyze call recommendations:")
    analyze_payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "analyze_call_recommendations",
            "arguments": {
                "call_summary": EXAMPLE_CALL_SUMMARY,
                "client_name": "Test Client"
            }
        }
    }
    print(f"""curl -X POST {MCP_BASE_URL}/tools/call \\
  -H "Content-Type: application/json" \\
  -d '{json.dumps(analyze_payload, ensure_ascii=False, indent=2)}'""")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "curl":
        print_mcp_curl_examples()
    else:
        print("Starting MCP example...")
        print("(Use 'python example_mcp_usage.py curl' for cURL examples)")
        asyncio.run(main())
