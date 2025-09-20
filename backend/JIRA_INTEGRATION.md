# Jira Integration for Call Summary Recommendations

This integration allows automatic creation of Jira tickets from call summary recommendations and next best actions using the Model Context Protocol (MCP) approach.

## 🎯 Features

- **Automatic Ticket Creation**: Convert call summary recommendations into actionable Jira tickets
- **Smart Priority Assignment**: Assign priority based on call sentiment and urgency keywords
- **Contextual Descriptions**: Rich ticket descriptions with call context and client information
- **Batch Processing**: Create multiple tickets from a single call summary
- **Asynchronous Processing**: Background ticket creation for better performance
- **Health Monitoring**: Check integration status and configuration

## 🔧 Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Enable Jira integration
JIRA_ENABLED=true

# Jira instance configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_API_TOKEN=your-api-token

# Project settings
JIRA_PROJECT_KEY=SALES
JIRA_DEFAULT_ISSUE_TYPE=Task
JIRA_DEFAULT_PRIORITY=Medium
```

### Getting Jira API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "Sales Scoring Integration")
4. Copy the generated token to `JIRA_API_TOKEN`

## 📡 API Endpoints

### Health Check
```bash
GET /api/v1/jira/health
```

Check if Jira integration is enabled and properly configured.

**Response:**
```json
{
  "enabled": true,
  "configured": true,
  "connection_status": "connected"
}
```

### Create Tickets from Call Summary
```bash
POST /api/v1/jira/create-tickets-from-summary
```

Automatically create Jira tickets from call summary recommendations.

**Request Body:**
```json
{
  "call_summary": {
    "callSummary": {
      "category": "Переговоры",
      "purpose": "Клиент обсуждает условия и следующий шаг по сделке",
      "managerRecommendations": [
        "Контролируйте выполнение первого шага: Подготовить техническое предложение",
        "Обновите CRM, чтобы команда видела прогресс"
      ],
      "actionItems": [
        "Подготовить техническое предложение",
        "Рассчитать стоимость проекта"
      ]
    },
    "sentiment": {
      "overall": "Позитивное"
    }
  },
  "client_name": "ООО РосИнвест",
  "assignee": "manager@company.com"
}
```

**Response:**
```json
{
  "tickets_created": [
    {
      "ticket_id": "12345",
      "ticket_key": "SALES-123",
      "ticket_url": "https://your-domain.atlassian.net/browse/SALES-123",
      "summary": "Контролируйте выполнение первого шага: Подготовить техническое предложение"
    }
  ],
  "total_recommendations": 4,
  "tickets_count": 4
}
```

### Create Single Ticket
```bash
POST /api/v1/jira/create-ticket
```

Create a single Jira ticket manually.

**Request Body:**
```json
{
  "summary": "Follow up with client about proposal",
  "description": "Contact client regarding pending technical proposal for warehouse automation",
  "issue_type": "Task",
  "priority": "High",
  "project_key": "SALES",
  "assignee": "manager@company.com",
  "labels": ["call-analysis", "sales-follow-up"]
}
```

### Asynchronous Ticket Creation
```bash
POST /api/v1/jira/create-tickets-from-summary-async
```

Queue ticket creation in the background for immediate response.

**Response:**
```json
{
  "status": "queued",
  "message": "Ticket creation queued for 4 recommendations",
  "recommendations_count": 4
}
```

## 🎯 How It Works

1. **Call Analysis**: The system analyzes call transcripts and generates structured summaries with recommendations
2. **Recommendation Extraction**: Manager recommendations and action items are extracted from the call summary
3. **Ticket Generation**: Each recommendation becomes a Jira ticket with:
   - **Summary**: First 80 characters of the recommendation
   - **Description**: Full recommendation with call context
   - **Priority**: Based on sentiment and urgency keywords
   - **Labels**: Includes call-analysis, sales-follow-up, and client-specific tags
4. **Context Enhancement**: Tickets include call details, client information, and sentiment analysis

## 🏷️ Ticket Structure

### Summary Format
```
Контролируйте выполнение первого шага: Подготовить техническое...
```

### Description Template
```markdown
Рекомендация по результатам анализа звонка:

**Действие:**
Контролируйте выполнение первого шага: Подготовить техническое предложение

**Контекст звонка:**
Клиент: ООО РосИнвест
Категория: Переговоры
Цель звонка: Клиент обсуждает условия и следующий шаг по сделке
Принятое решение: Клиент заинтересован, ждет предложения
Общее настроение: Позитивное
Дата создания: 20.09.2025

**Дополнительная информация:**
- Обсуждаемые моменты: Клиент интересуется автоматизацией; Менеджер предлагает решение
- Движущие факторы настроения: Активный интерес клиента; Четкие ответы менеджера

**Создано автоматически из анализа звонка**
```

### Priority Assignment Rules
- **High**: Negative sentiment OR urgent keywords ("срочно", "немедленно")
- **Medium**: Positive sentiment OR neutral cases
- **Low**: Rarely used, reserved for low-impact items

### Labels
- `call-analysis`: All tickets from call analysis
- `sales-follow-up`: Sales-related follow-up actions
- `client-{name}`: Client-specific label (sanitized)

## 🧪 Testing

Run the integration tests:
```bash
cd backend
python test_jira_integration.py
```

Test with example data:
```bash
python example_jira_usage.py
```

Get curl examples:
```bash
python example_jira_usage.py curl
```

## 🔍 Example Usage

### Basic Integration Test
```python
import asyncio
from app.jira_service import JiraService, JiraConfig
from app.models import CallSummarizationResponse

async def create_tickets():
    config = JiraConfig(
        base_url="https://your-domain.atlassian.net",
        username="your-email@example.com",
        api_token="your-api-token",
        project_key="SALES"
    )
    
    service = JiraService(config)
    
    # Assuming you have a call_summary from your analysis
    tickets = await service.create_tickets_from_call_summary(
        call_summary=call_summary,
        client_name="Important Client",
        assignee="sales.manager@company.com"
    )
    
    print(f"Created {len(tickets)} tickets")
    for ticket in tickets:
        print(f"{ticket.ticket_key}: {ticket.summary}")

asyncio.run(create_tickets())
```

### cURL Example
```bash
# Check health
curl -X GET http://localhost:8000/api/v1/jira/health

# Create tickets from call summary
curl -X POST http://localhost:8000/api/v1/jira/create-tickets-from-summary \
  -H "Content-Type: application/json" \
  -d @call_summary.json
```

## 🚨 Error Handling

The integration includes comprehensive error handling:

- **Configuration Errors**: Missing or invalid Jira configuration
- **Network Errors**: Connection issues with Jira API
- **Authentication Errors**: Invalid credentials or permissions
- **Validation Errors**: Invalid ticket data or project configuration

Errors are logged and returned as structured HTTP responses with appropriate status codes.

## 🔒 Security Considerations

- **API Token**: Store securely, rotate regularly
- **Network**: Ensure HTTPS for Jira communication
- **Permissions**: Use least-privilege Jira user account
- **Logging**: Sensitive data is not logged

## 📊 Monitoring

The integration provides health checks and logging:

- **Health Endpoint**: Monitor configuration and connectivity
- **Structured Logging**: Track ticket creation and errors
- **Metrics**: Count of tickets created, success/failure rates

## 🚀 Getting Started

1. **Configure Jira**: Set up environment variables
2. **Test Connection**: Use `/api/v1/jira/health` endpoint
3. **Create Test Ticket**: Use the example script
4. **Integrate**: Call the API from your call analysis workflow

## 🛠️ Troubleshooting

### Common Issues

1. **"Jira integration is disabled"**
   - Set `JIRA_ENABLED=true` in your environment

2. **"Jira service misconfigured"**
   - Check all required environment variables are set
   - Verify Jira URL format (https://domain.atlassian.net)

3. **"Failed to create Jira ticket"**
   - Verify API token is valid
   - Check project key exists and user has permissions
   - Ensure issue type "Task" exists in the project

4. **Connection timeout**
   - Check network connectivity to Jira
   - Verify Jira instance URL is accessible

### Debug Mode

Enable debug logging in your environment:
```bash
LOG_LEVEL=debug
```

This provides detailed information about API calls and responses.
