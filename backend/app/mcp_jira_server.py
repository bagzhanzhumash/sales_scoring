"""
True MCP (Model Context Protocol) server for Jira integration.
This provides standardized MCP tools for creating Jira tickets from call summaries.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from mcp.server import Server
from mcp.types import Tool, TextContent
from pydantic import BaseModel, Field

from .jira_service import JiraService, JiraConfig, JiraTicketRequest
from .models import CallSummarizationResponse
from .exceptions import JiraIntegrationError
from .config import settings


logger = logging.getLogger(__name__)

# Initialize MCP server
server = Server("sales-scoring-jira-integration")


# MCP Tool Schemas
JIRA_HEALTH_TOOL = Tool(
    name="check_jira_health",
    description="Check Jira integration health and configuration status",
    inputSchema={
        "type": "object",
        "properties": {},
        "required": []
    }
)

CREATE_TICKET_TOOL = Tool(
    name="create_jira_ticket",
    description="Create a single Jira ticket with specified details",
    inputSchema={
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "Brief summary of the ticket"
            },
            "description": {
                "type": "string", 
                "description": "Detailed description of the ticket"
            },
            "issue_type": {
                "type": "string",
                "description": "Type of Jira issue (Task, Bug, Story, etc.)",
                "default": "Task"
            },
            "priority": {
                "type": "string",
                "description": "Priority level (Low, Medium, High)",
                "default": "Medium"
            },
            "project_key": {
                "type": "string",
                "description": "Jira project key (uses default if not specified)"
            },
            "assignee": {
                "type": "string",
                "description": "Username of the assignee"
            },
            "labels": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of labels to apply"
            }
        },
        "required": ["summary", "description"]
    }
)

CREATE_TICKETS_FROM_SUMMARY_TOOL = Tool(
    name="create_tickets_from_call_summary",
    description="Extract recommendations from call summary and create corresponding Jira tickets",
    inputSchema={
        "type": "object",
        "properties": {
            "call_summary": {
                "type": "object",
                "description": "Complete call summary data structure"
            },
            "client_name": {
                "type": "string",
                "description": "Name of the client for context"
            },
            "assignee": {
                "type": "string",
                "description": "Username of the assignee for all tickets"
            },
            "project_key": {
                "type": "string",
                "description": "Override default project key"
            }
        },
        "required": ["call_summary"]
    }
)

ANALYZE_RECOMMENDATIONS_TOOL = Tool(
    name="analyze_call_recommendations",
    description="Analyze call summary and return recommendations without creating tickets",
    inputSchema={
        "type": "object",
        "properties": {
            "call_summary": {
                "type": "object",
                "description": "Complete call summary data structure"
            },
            "client_name": {
                "type": "string",
                "description": "Name of the client for context"
            }
        },
        "required": ["call_summary"]
    }
)

GET_CONFIG_TOOL = Tool(
    name="get_jira_config",
    description="Get Jira configuration and status information",
    inputSchema={
        "type": "object",
        "properties": {},
        "required": []
    }
)

GENERATE_SAMPLE_TOOL = Tool(
    name="generate_sample_call_summary",
    description="Generate sample call summary data for testing MCP tools",
    inputSchema={
        "type": "object",
        "properties": {},
        "required": []
    }
)


@server.list_tools()
async def list_tools() -> List[Tool]:
    """List all available MCP tools."""
    return [
        JIRA_HEALTH_TOOL,
        CREATE_TICKET_TOOL,
        CREATE_TICKETS_FROM_SUMMARY_TOOL,
        ANALYZE_RECOMMENDATIONS_TOOL,
        GET_CONFIG_TOOL,
        GENERATE_SAMPLE_TOOL
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle MCP tool calls."""
    try:
        if name == "check_jira_health":
            result = await check_jira_health()
        elif name == "create_jira_ticket":
            result = await create_jira_ticket(**arguments)
        elif name == "create_tickets_from_call_summary":
            result = await create_tickets_from_call_summary(**arguments)
        elif name == "analyze_call_recommendations":
            result = await analyze_call_recommendations(**arguments)
        elif name == "get_jira_config":
            result = await get_jira_config()
        elif name == "generate_sample_call_summary":
            result = await generate_sample_call_summary()
        else:
            result = {"error": f"Unknown tool: {name}"}
        
        # Return result as TextContent
        return [TextContent(
            type="text",
            text=json.dumps(result, ensure_ascii=False, indent=2)
        )]
        
    except Exception as e:
        logger.error(f"MCP tool call failed for {name}: {e}")
        error_result = {
            "success": False,
            "error": str(e),
            "tool": name
        }
        return [TextContent(
            type="text",
            text=json.dumps(error_result, ensure_ascii=False, indent=2)
        )]


async def check_jira_health() -> Dict[str, Any]:
    """Check if Jira integration is properly configured and accessible."""
    try:
        logger.info("MCP: Checking Jira health status")
        
        if not settings.jira_enabled:
            return {
                "enabled": False,
                "configured": False,
                "connection_status": "disabled",
                "message": "Jira integration is disabled in configuration"
            }
        
        # Check if required configuration is present
        configured = all([
            settings.jira_base_url,
            settings.jira_username,
            settings.jira_api_token,
            settings.jira_project_key
        ])
        
        if not configured:
            missing_configs = []
            if not settings.jira_base_url:
                missing_configs.append("JIRA_BASE_URL")
            if not settings.jira_username:
                missing_configs.append("JIRA_USERNAME")
            if not settings.jira_api_token:
                missing_configs.append("JIRA_API_TOKEN")
            if not settings.jira_project_key:
                missing_configs.append("JIRA_PROJECT_KEY")
                
            return {
                "enabled": True,
                "configured": False,
                "connection_status": "misconfigured",
                "message": f"Missing configuration: {', '.join(missing_configs)}"
            }
        
        # Test basic configuration validity
        try:
            config = JiraConfig(
                base_url=settings.jira_base_url,
                username=settings.jira_username,
                api_token=settings.jira_api_token,
                project_key=settings.jira_project_key
            )
            return {
                "enabled": True,
                "configured": True,
                "connection_status": "ready",
                "message": f"Jira integration ready for project {config.project_key}",
                "base_url": config.base_url,
                "project_key": config.project_key
            }
        except Exception as e:
            return {
                "enabled": True,
                "configured": False,
                "connection_status": "configuration_error",
                "message": f"Configuration error: {str(e)}"
            }
            
    except Exception as e:
        logger.error(f"MCP: Error checking Jira health: {e}")
        return {
            "enabled": False,
            "configured": False,
            "connection_status": "error",
            "message": f"Health check failed: {str(e)}"
        }


async def create_jira_ticket(
    summary: str,
    description: str,
    issue_type: str = "Task",
    priority: str = "Medium",
    project_key: Optional[str] = None,
    assignee: Optional[str] = None,
    labels: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Create a single Jira ticket."""
    try:
        logger.info(f"MCP: Creating Jira ticket with summary: {summary[:50]}...")
        
        if not settings.jira_enabled:
            raise ValueError("Jira integration is disabled")
        
        # Initialize Jira service
        jira_service = JiraService()
        
        # Use provided project key or default
        effective_project_key = project_key or settings.jira_project_key
        
        # Create ticket request
        ticket_request = JiraTicketRequest(
            summary=summary,
            description=description,
            issue_type=issue_type,
            priority=priority,
            project_key=effective_project_key,
            assignee=assignee,
            labels=labels or []
        )
        
        # Create the ticket
        result = await jira_service.create_ticket(ticket_request)
        
        # Clean up
        await jira_service.close()
        
        response = {
            "success": True,
            "ticket_id": result.ticket_id,
            "ticket_key": result.ticket_key,
            "ticket_url": result.ticket_url,
            "summary": result.summary,
            "message": f"Successfully created ticket {result.ticket_key}"
        }
        
        logger.info(f"MCP: Successfully created ticket {result.ticket_key}")
        return response
        
    except Exception as e:
        logger.error(f"MCP: Failed to create Jira ticket: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to create Jira ticket: {str(e)}"
        }


async def create_tickets_from_call_summary(
    call_summary: Dict[str, Any],
    client_name: Optional[str] = None,
    assignee: Optional[str] = None,
    project_key: Optional[str] = None
) -> Dict[str, Any]:
    """Create multiple Jira tickets from call summary recommendations."""
    try:
        logger.info(f"MCP: Creating tickets from call summary for client: {client_name}")
        
        if not settings.jira_enabled:
            raise ValueError("Jira integration is disabled")
        
        # Parse call summary into Pydantic model
        try:
            call_summary_obj = CallSummarizationResponse(**call_summary)
        except Exception as e:
            logger.error(f"MCP: Invalid call summary format: {e}")
            return {
                "success": False,
                "error": f"Invalid call summary format: {str(e)}",
                "tickets_created": [],
                "total_recommendations": 0,
                "tickets_count": 0
            }
        
        # Initialize Jira service
        jira_service = JiraService()
        
        # Override project key if provided
        if project_key and jira_service.config:
            jira_service.config.project_key = project_key
        
        # Extract all recommendations
        all_recommendations = (
            call_summary_obj.callSummary.managerRecommendations or []
        ) + (
            call_summary_obj.callSummary.actionItems or []
        )
        
        total_recommendations = len(all_recommendations)
        
        if total_recommendations == 0:
            logger.warning("MCP: No recommendations found in call summary")
            return {
                "success": True,
                "message": "No actionable recommendations found in call summary",
                "tickets_created": [],
                "total_recommendations": 0,
                "tickets_count": 0
            }
        
        # Create tickets
        created_tickets = await jira_service.create_tickets_from_call_summary(
            call_summary=call_summary_obj,
            client_name=client_name,
            assignee=assignee
        )
        
        # Clean up
        await jira_service.close()
        
        # Format response
        tickets_data = [
            {
                "ticket_id": ticket.ticket_id,
                "ticket_key": ticket.ticket_key,
                "ticket_url": ticket.ticket_url,
                "summary": ticket.summary
            }
            for ticket in created_tickets
        ]
        
        response = {
            "success": True,
            "message": f"Successfully created {len(created_tickets)} tickets from {total_recommendations} recommendations",
            "tickets_created": tickets_data,
            "total_recommendations": total_recommendations,
            "tickets_count": len(created_tickets),
            "client_name": client_name,
            "call_category": call_summary_obj.callSummary.category,
            "call_sentiment": call_summary_obj.sentiment.overall
        }
        
        logger.info(f"MCP: Successfully created {len(created_tickets)} tickets from call summary")
        return response
        
    except Exception as e:
        logger.error(f"MCP: Failed to create tickets from call summary: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": f"Failed to create tickets from call summary: {str(e)}",
            "tickets_created": [],
            "total_recommendations": 0,
            "tickets_count": 0
        }


async def analyze_call_recommendations(
    call_summary: Dict[str, Any],
    client_name: Optional[str] = None
) -> Dict[str, Any]:
    """Analyze call summary and extract actionable recommendations without creating tickets."""
    try:
        logger.info(f"MCP: Analyzing call recommendations for client: {client_name}")
        
        # Parse call summary into Pydantic model
        try:
            call_summary_obj = CallSummarizationResponse(**call_summary)
        except Exception as e:
            return {
                "success": False,
                "error": f"Invalid call summary format: {str(e)}",
                "recommendations": []
            }
        
        # Extract recommendations
        manager_recommendations = call_summary_obj.callSummary.managerRecommendations or []
        action_items = call_summary_obj.callSummary.actionItems or []
        
        # Analyze each recommendation
        analyzed_recommendations = []
        
        for i, rec in enumerate(manager_recommendations):
            priority = "Medium"
            if "срочно" in rec.lower() or "немедленно" in rec.lower():
                priority = "High"
            elif call_summary_obj.sentiment.overall == "Негативное":
                priority = "High"
            elif call_summary_obj.sentiment.overall == "Позитивное":
                priority = "Medium"
                
            analyzed_recommendations.append({
                "type": "manager_recommendation",
                "content": rec,
                "priority": priority,
                "suggested_summary": rec[:80] + "..." if len(rec) > 80 else rec,
                "index": i + 1
            })
        
        for i, item in enumerate(action_items):
            priority = "Medium"
            if "срочно" in item.lower() or "немедленно" in item.lower():
                priority = "High"
                
            analyzed_recommendations.append({
                "type": "action_item",
                "content": item,
                "priority": priority,
                "suggested_summary": item[:80] + "..." if len(item) > 80 else item,
                "index": len(manager_recommendations) + i + 1
            })
        
        response = {
            "success": True,
            "client_name": client_name,
            "call_category": call_summary_obj.callSummary.category,
            "call_purpose": call_summary_obj.callSummary.purpose,
            "call_sentiment": call_summary_obj.sentiment.overall,
            "decision_made": call_summary_obj.callSummary.decisionMade,
            "total_recommendations": len(analyzed_recommendations),
            "recommendations": analyzed_recommendations,
            "sentiment_analysis": {
                "overall": call_summary_obj.sentiment.overall,
                "tone": call_summary_obj.sentiment.tone,
                "drivers": call_summary_obj.sentiment.drivers
            }
        }
        
        logger.info(f"MCP: Analyzed {len(analyzed_recommendations)} recommendations")
        return response
        
    except Exception as e:
        logger.error(f"MCP: Failed to analyze call recommendations: {e}")
        return {
            "success": False,
            "error": str(e),
            "recommendations": []
        }


async def get_jira_config() -> Dict[str, Any]:
    """Get current Jira configuration without sensitive information."""
    try:
        return {
            "enabled": settings.jira_enabled,
            "base_url": settings.jira_base_url if settings.jira_base_url else "Not configured",
            "project_key": settings.jira_project_key,
            "default_issue_type": settings.jira_default_issue_type,
            "default_priority": settings.jira_default_priority,
            "username_configured": bool(settings.jira_username),
            "api_token_configured": bool(settings.jira_api_token)
        }
    except Exception as e:
        logger.error(f"MCP: Error getting Jira config: {e}")
        return {
            "error": str(e),
            "enabled": False
        }


async def generate_sample_call_summary() -> Dict[str, Any]:
    """Generate a sample call summary for testing purposes."""
    sample_data = {
        "callSummary": {
            "category": "Переговоры",
            "purpose": "Клиент ООО РосИнвест обсуждает условия и следующий шаг по сделке",
            "discussionPoints": [
                "Клиент: Интересует автоматизация склада",
                "Менеджер: Предлагаем комплексное решение с роботизированными системами",
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
                "Используйте позитивный настрой, чтобы закрепить договорённость и сократить цикл сделки"
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
    
    logger.info("MCP: Generated sample call summary data")
    return {
        "success": True,
        "sample_call_summary": sample_data,
        "description": "Sample call summary data for testing MCP Jira integration tools"
    }


# Export the MCP server for integration with FastAPI
__all__ = ["server"]