#!/usr/bin/env python3
"""
Test script for Jira integration functionality.
"""

import asyncio
import json
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, patch

from app.jira_service import JiraService, JiraConfig, JiraTicketRequest
from app.models import (
    CallSummarizationResponse, 
    CallSummaryDetails, 
    SentimentDetails,
    ScorecardEntry
)


def create_test_call_summary() -> CallSummarizationResponse:
    """Create a test call summary for testing."""
    return CallSummarizationResponse(
        callSummary=CallSummaryDetails(
            category="Переговоры",
            purpose="Клиент обсуждает условия и следующий шаг по сделке",
            discussionPoints=[
                "Клиент: Интересует автоматизация склада",
                "Менеджер: Предлагаем комплексное решение"
            ],
            actionItems=[
                "Подготовить техническое предложение",
                "Рассчитать стоимость проекта"
            ],
            decisionMade="Клиент заинтересован, ждет предложения",
            createdAt=datetime.now().strftime("%d.%m.%Y"),
            managerRecommendations=[
                "Контролируйте выполнение первого шага: Подготовить техническое предложение",
                "Обновите CRM, чтобы команда видела прогресс",
                "Подготовьте next best action: назначьте повторный звонок"
            ]
        ),
        sentiment=SentimentDetails(
            overall="Позитивное",
            tone=["Уверенный", "Дружелюбный"],
            drivers=[
                "Клиент активно интересуется предложением",
                "Менеджер предоставляет четкие ответы"
            ],
            recommendations=[
                "Подтвердите договорённости письмом",
                "Назначьте повторный созвон"
            ]
        ),
        scorecards=[
            ScorecardEntry(
                title="Выявление потребностей",
                score=4.5,
                target=5,
                description="Менеджер успешно выявил потребности"
            )
        ]
    )


async def test_jira_service_configuration():
    """Test Jira service configuration."""
    print("🧪 Testing Jira service configuration...")
    
    config = JiraConfig(
        base_url="https://test.atlassian.net",
        username="test@example.com",
        api_token="test-token",
        project_key="TEST"
    )
    
    service = JiraService(config)
    assert service.config.base_url == "https://test.atlassian.net"
    assert service.config.project_key == "TEST"
    print("   ✅ Configuration test passed")


async def test_extract_recommendations():
    """Test extraction of recommendations from call summary."""
    print("🧪 Testing recommendation extraction...")
    
    config = JiraConfig(
        base_url="https://test.atlassian.net",
        username="test@example.com",
        api_token="test-token",
        project_key="TEST"
    )
    
    service = JiraService(config)
    call_summary = create_test_call_summary()
    
    ticket_requests = service._extract_recommendations_from_call_summary(
        call_summary, 
        client_name="Test Client"
    )
    
    # Should have 5 tickets: 3 manager recommendations + 2 action items
    assert len(ticket_requests) == 5
    
    # Check first ticket content
    first_ticket = ticket_requests[0]
    assert "Контролируйте выполнение первого шага" in first_ticket.summary
    assert "Test Client" in first_ticket.description
    assert "call-analysis" in first_ticket.labels
    assert "client-test-client" in first_ticket.labels
    
    print(f"   ✅ Extracted {len(ticket_requests)} ticket requests")
    for i, ticket in enumerate(ticket_requests):
        print(f"   📋 Ticket {i+1}: {ticket.summary[:60]}...")


async def test_ticket_creation_mock():
    """Test ticket creation with mocked HTTP calls."""
    print("🧪 Testing ticket creation (mocked)...")
    
    config = JiraConfig(
        base_url="https://test.atlassian.net",
        username="test@example.com",
        api_token="test-token",
        project_key="TEST"
    )
    
    service = JiraService(config)
    
    # Mock HTTP response
    mock_response = {
        "id": "12345",
        "key": "TEST-123",
        "self": "https://test.atlassian.net/rest/api/3/issue/12345"
    }
    
    with patch('aiohttp.ClientSession.post') as mock_post:
        # Setup mock response
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value.status = 201
        mock_context.__aenter__.return_value.json = AsyncMock(return_value=mock_response)
        mock_post.return_value = mock_context
        
        ticket_request = JiraTicketRequest(
            summary="Test ticket",
            description="Test description",
            project_key="TEST"
        )
        
        result = await service.create_ticket(ticket_request)
        
        assert result.ticket_id == "12345"
        assert result.ticket_key == "TEST-123"
        assert "TEST-123" in result.ticket_url
        
        print(f"   ✅ Mock ticket created: {result.ticket_key}")


async def test_full_workflow_mock():
    """Test the full workflow from call summary to tickets (mocked)."""
    print("🧪 Testing full workflow (mocked)...")
    
    config = JiraConfig(
        base_url="https://test.atlassian.net",
        username="test@example.com",
        api_token="test-token",
        project_key="TEST"
    )
    
    service = JiraService(config)
    call_summary = create_test_call_summary()
    
    # Mock HTTP responses for multiple tickets
    mock_responses = [
        {"id": f"1234{i}", "key": f"TEST-{123+i}"} 
        for i in range(5)
    ]
    
    with patch('aiohttp.ClientSession.post') as mock_post:
        # Setup mock to return different responses for each call
        mock_contexts = []
        for response in mock_responses:
            mock_context = AsyncMock()
            mock_context.__aenter__.return_value.status = 201
            mock_context.__aenter__.return_value.json = AsyncMock(return_value=response)
            mock_contexts.append(mock_context)
        
        mock_post.side_effect = mock_contexts
        
        results = await service.create_tickets_from_call_summary(
            call_summary,
            client_name="Test Client"
        )
        
        assert len(results) == 5
        print(f"   ✅ Created {len(results)} tickets in full workflow")
        
        for result in results:
            print(f"   📋 {result.ticket_key}: {result.summary[:50]}...")


def test_priority_assignment():
    """Test priority assignment based on content and sentiment."""
    print("🧪 Testing priority assignment...")
    
    config = JiraConfig(
        base_url="https://test.atlassian.net",
        username="test@example.com",
        api_token="test-token",
        project_key="TEST"
    )
    
    service = JiraService(config)
    
    # Test negative sentiment -> high priority
    negative_summary = create_test_call_summary()
    negative_summary.sentiment.overall = "Негативное"
    
    tickets = service._extract_recommendations_from_call_summary(negative_summary)
    
    # Should have high priority due to negative sentiment
    high_priority_count = sum(1 for t in tickets if t.priority == "High")
    assert high_priority_count > 0
    
    print(f"   ✅ Priority assignment working: {high_priority_count} high priority tickets")


async def run_all_tests():
    """Run all tests."""
    print("🚀 Starting Jira Integration Tests")
    print("=" * 50)
    
    try:
        await test_jira_service_configuration()
        await test_extract_recommendations()
        await test_ticket_creation_mock()
        await test_full_workflow_mock()
        test_priority_assignment()
        
        print("\n🎉 All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise


def print_integration_summary():
    """Print summary of what the integration provides."""
    print("\n📋 Jira Integration Summary")
    print("=" * 50)
    print("✅ Features implemented:")
    print("   • Extract actionable recommendations from call summaries")
    print("   • Create Jira tickets automatically from recommendations")
    print("   • Smart priority assignment based on sentiment")
    print("   • Contextual ticket descriptions with call details")
    print("   • Batch ticket creation for multiple recommendations")
    print("   • Asynchronous ticket creation for better performance")
    print("   • Health checks for integration status")
    print("   • Proper error handling and logging")
    
    print("\n🔌 API Endpoints:")
    print("   • GET  /api/v1/jira/health")
    print("   • POST /api/v1/jira/create-ticket")
    print("   • POST /api/v1/jira/create-tickets-from-summary")
    print("   • POST /api/v1/jira/create-tickets-from-summary-async")
    
    print("\n⚙️  Configuration required:")
    print("   • JIRA_ENABLED=true")
    print("   • JIRA_BASE_URL=https://your-domain.atlassian.net")
    print("   • JIRA_USERNAME=your-email@example.com")
    print("   • JIRA_API_TOKEN=your-api-token")
    print("   • JIRA_PROJECT_KEY=SALES")


if __name__ == "__main__":
    print("Running Jira integration tests...")
    asyncio.run(run_all_tests())
    print_integration_summary()
