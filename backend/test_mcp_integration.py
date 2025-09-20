#!/usr/bin/env python3
"""
Test script for MCP (Model Context Protocol) Jira integration.
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime

from app.mcp_jira_server import (
    check_jira_health,
    create_jira_ticket,
    create_tickets_from_call_summary,
    analyze_call_recommendations,
    get_jira_config,
    generate_sample_call_summary
)
from app.config import settings


def create_test_call_summary_dict():
    """Create a test call summary as a dictionary for MCP tools."""
    return {
        "callSummary": {
            "category": "Переговоры",
            "purpose": "Клиент обсуждает условия и следующий шаг по сделке",
            "discussionPoints": [
                "Клиент: Интересует автоматизация склада",
                "Менеджер: Предлагаем комплексное решение"
            ],
            "actionItems": [
                "Подготовить техническое предложение",
                "Рассчитать стоимость проекта"
            ],
            "decisionMade": "Клиент заинтересован, ждет предложения",
            "createdAt": datetime.now().strftime("%d.%m.%Y"),
            "managerRecommendations": [
                "Контролируйте выполнение первого шага: Подготовить техническое предложение",
                "Обновите CRM, чтобы команда видела прогресс",
                "Подготовьте next best action: назначьте повторный звонок"
            ]
        },
        "sentiment": {
            "overall": "Позитивное",
            "tone": ["Уверенный", "Дружелюбный"],
            "drivers": [
                "Клиент активно интересуется предложением",
                "Менеджер предоставляет четкие ответы"
            ],
            "recommendations": [
                "Подтвердите договорённости письмом",
                "Назначьте повторный созвон"
            ]
        },
        "scorecards": [
            {
                "title": "Выявление потребностей",
                "score": 4.5,
                "target": 5,
                "description": "Менеджер успешно выявил потребности"
            }
        ]
    }


async def test_mcp_check_jira_health():
    """Test MCP health check tool."""
    print("🧪 Testing MCP check_jira_health tool...")
    
    # Test disabled state
    original_enabled = settings.jira_enabled
    settings.jira_enabled = False
    
    result = await check_jira_health()
    assert result["enabled"] is False
    assert result["connection_status"] == "disabled"
    
    # Test enabled but misconfigured
    settings.jira_enabled = True
    original_base_url = settings.jira_base_url
    settings.jira_base_url = None
    
    result = await check_jira_health()
    assert result["enabled"] is True
    assert result["configured"] is False
    assert "JIRA_BASE_URL" in result["message"]
    
    # Restore settings
    settings.jira_enabled = original_enabled
    settings.jira_base_url = original_base_url
    
    print("   ✅ MCP health check test passed")


async def test_mcp_create_jira_ticket_disabled():
    """Test MCP create ticket tool when disabled."""
    print("🧪 Testing MCP create_jira_ticket tool (disabled)...")
    
    original_enabled = settings.jira_enabled
    settings.jira_enabled = False
    
    result = await create_jira_ticket(
        summary="Test ticket",
        description="Test description"
    )
    
    assert result["success"] is False
    assert "disabled" in result["error"]
    
    # Restore settings
    settings.jira_enabled = original_enabled
    
    print("   ✅ MCP create ticket (disabled) test passed")


async def test_mcp_create_jira_ticket_mock():
    """Test MCP create ticket tool with mocked Jira service."""
    print("🧪 Testing MCP create_jira_ticket tool (mocked)...")
    
    original_enabled = settings.jira_enabled
    settings.jira_enabled = True
    
    mock_response = AsyncMock()
    mock_response.ticket_id = "12345"
    mock_response.ticket_key = "TEST-123"
    mock_response.ticket_url = "https://test.atlassian.net/browse/TEST-123"
    mock_response.summary = "Test ticket"
    
    with patch('app.mcp_jira_server.JiraService') as mock_service_class:
        mock_service = AsyncMock()
        mock_service.create_ticket.return_value = mock_response
        mock_service.close.return_value = None
        mock_service_class.return_value = mock_service
        
        result = await create_jira_ticket(
            summary="Test ticket",
            description="Test description",
            priority="High"
        )
        
        assert result["success"] is True
        assert result["ticket_key"] == "TEST-123"
        assert result["ticket_id"] == "12345"
        assert "test.atlassian.net" in result["ticket_url"]
        
        # Verify service was called correctly
        mock_service.create_ticket.assert_called_once()
        mock_service.close.assert_called_once()
    
    # Restore settings
    settings.jira_enabled = original_enabled
    
    print("   ✅ MCP create ticket (mocked) test passed")


async def test_mcp_create_tickets_from_summary():
    """Test MCP create tickets from call summary tool."""
    print("🧪 Testing MCP create_tickets_from_call_summary tool...")
    
    original_enabled = settings.jira_enabled
    settings.jira_enabled = True
    
    call_summary = create_test_call_summary_dict()
    
    # Test with invalid call summary
    result = await create_tickets_from_call_summary(
        call_summary={"invalid": "data"},
        client_name="Test Client"
    )
    
    assert result["success"] is False
    assert "Invalid call summary format" in result["error"]
    
    # Test with disabled Jira
    settings.jira_enabled = False
    
    result = await create_tickets_from_call_summary(
        call_summary=call_summary,
        client_name="Test Client"
    )
    
    assert result["success"] is False
    assert "disabled" in result["error"]
    
    # Test with valid data and mocked service
    settings.jira_enabled = True
    
    mock_tickets = [
        AsyncMock(ticket_id="1", ticket_key="TEST-1", ticket_url="url1", summary="Summary 1"),
        AsyncMock(ticket_id="2", ticket_key="TEST-2", ticket_url="url2", summary="Summary 2"),
    ]
    
    with patch('app.mcp_jira_server.JiraService') as mock_service_class:
        mock_service = AsyncMock()
        mock_service.create_tickets_from_call_summary.return_value = mock_tickets
        mock_service.close.return_value = None
        mock_service_class.return_value = mock_service
        
        result = await create_tickets_from_call_summary(
            call_summary=call_summary,
            client_name="Test Client"
        )
        
        assert result["success"] is True
        assert result["tickets_count"] == 2
        assert len(result["tickets_created"]) == 2
        assert result["client_name"] == "Test Client"
        assert result["call_category"] == "Переговоры"
        assert result["call_sentiment"] == "Позитивное"
    
    # Restore settings
    settings.jira_enabled = original_enabled
    
    print("   ✅ MCP create tickets from summary test passed")


async def test_mcp_analyze_call_recommendations():
    """Test MCP analyze recommendations tool."""
    print("🧪 Testing MCP analyze_call_recommendations tool...")
    
    call_summary = create_test_call_summary_dict()
    
    # Test with invalid call summary
    result = await analyze_call_recommendations(
        call_summary={"invalid": "data"},
        client_name="Test Client"
    )
    
    assert result["success"] is False
    assert "Invalid call summary format" in result["error"]
    
    # Test with valid call summary
    result = await analyze_call_recommendations(
        call_summary=call_summary,
        client_name="Test Client"
    )
    
    assert result["success"] is True
    assert result["client_name"] == "Test Client"
    assert result["call_category"] == "Переговоры"
    assert result["call_sentiment"] == "Позитивное"
    assert result["total_recommendations"] == 5  # 3 manager + 2 action items
    
    # Check recommendation analysis
    recommendations = result["recommendations"]
    assert len(recommendations) == 5
    
    # Check manager recommendations
    manager_recs = [r for r in recommendations if r["type"] == "manager_recommendation"]
    assert len(manager_recs) == 3
    
    # Check action items
    action_items = [r for r in recommendations if r["type"] == "action_item"]
    assert len(action_items) == 2
    
    # Check priority assignment
    priorities = [r["priority"] for r in recommendations]
    assert all(p in ["Low", "Medium", "High"] for p in priorities)
    
    print("   ✅ MCP analyze recommendations test passed")


async def test_mcp_get_jira_config():
    """Test MCP get Jira config tool."""
    print("🧪 Testing MCP get_jira_config tool...")
    
    result = await get_jira_config()
    
    # Should return configuration info
    assert "enabled" in result
    assert "project_key" in result
    assert "default_issue_type" in result
    assert "default_priority" in result
    assert "username_configured" in result
    assert "api_token_configured" in result
    
    # Should not expose sensitive data
    assert "api_token" not in result or not result.get("api_token")
    assert "password" not in result
    
    print("   ✅ MCP get config test passed")


async def test_mcp_generate_sample_call_summary():
    """Test MCP generate sample data tool."""
    print("🧪 Testing MCP generate_sample_call_summary tool...")
    
    result = await generate_sample_call_summary()
    
    assert result["success"] is True
    assert "sample_call_summary" in result
    assert "description" in result
    
    # Validate sample data structure
    sample = result["sample_call_summary"]
    assert "callSummary" in sample
    assert "sentiment" in sample
    assert "scorecards" in sample
    
    # Check required fields
    call_summary = sample["callSummary"]
    assert "category" in call_summary
    assert "purpose" in call_summary
    assert "managerRecommendations" in call_summary
    assert "actionItems" in call_summary
    
    sentiment = sample["sentiment"]
    assert "overall" in sentiment
    assert "tone" in sentiment
    assert "drivers" in sentiment
    
    print("   ✅ MCP generate sample data test passed")


def test_mcp_tools_structure():
    """Test that MCP tools are properly structured."""
    print("🧪 Testing MCP tools structure...")
    
    from app.mcp_jira_server import server
    
    # Check that MCP server is initialized
    assert server is not None
    assert hasattr(server, 'name')
    assert server.name == "sales-scoring-jira-integration"
    
    # The tools should be registered with the MCP server
    # This is validated through the functionality tests above
    
    print("   ✅ MCP tools structure test passed")


async def run_all_tests():
    """Run all MCP integration tests."""
    print("🚀 Starting MCP Integration Tests")
    print("=" * 50)
    
    try:
        await test_mcp_check_jira_health()
        await test_mcp_create_jira_ticket_disabled()
        await test_mcp_create_jira_ticket_mock()
        await test_mcp_create_tickets_from_summary()
        await test_mcp_analyze_call_recommendations()
        await test_mcp_get_jira_config()
        await test_mcp_generate_sample_call_summary()
        test_mcp_tools_structure()
        
        print("\n🎉 All MCP tests passed!")
        
    except Exception as e:
        print(f"\n❌ MCP test failed: {e}")
        raise


def print_mcp_integration_summary():
    """Print summary of the MCP integration."""
    print("\n📋 MCP Integration Summary")
    print("=" * 50)
    print("✅ True MCP Features implemented:")
    print("   • FastMCP server integration with FastAPI")
    print("   • Standardized tool discovery and execution")
    print("   • JSON-RPC 2.0 protocol compliance")
    print("   • Server-sent events for real-time communication")
    print("   • Schema validation for tool parameters")
    print("   • Error handling with proper MCP response format")
    
    print("\n🛠️ Available MCP Tools:")
    print("   • check_jira_health - Check integration status")
    print("   • create_jira_ticket - Create individual tickets")  
    print("   • create_tickets_from_call_summary - Batch creation")
    print("   • analyze_call_recommendations - Preview mode")
    print("   • get_jira_config - Configuration info")
    print("   • generate_sample_call_summary - Test data")
    
    print("\n🔌 MCP Protocol Benefits:")
    print("   • AI agents can discover tools automatically")
    print("   • Standardized parameter validation")
    print("   • Consistent error handling across tools")
    print("   • Self-describing tool capabilities")
    print("   • Protocol-level type safety")
    
    print("\n📡 Access Methods:")
    print("   • HTTP POST to /mcp/tools/call")
    print("   • Server-sent events at /mcp")
    print("   • JSON-RPC 2.0 protocol")
    print("   • Compatible with MCP clients and AI agents")
    
    print("\n🆚 MCP vs Traditional API:")
    print("   Traditional: Custom endpoints, manual discovery")
    print("   MCP: Standardized protocol, automatic discovery")
    print("   Traditional: Custom schemas and validation")
    print("   MCP: Built-in schema validation and introspection")


if __name__ == "__main__":
    print("Running MCP integration tests...")
    asyncio.run(run_all_tests())
    print_mcp_integration_summary()
