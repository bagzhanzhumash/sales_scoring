"""
Jira integration service for creating tickets from call summary recommendations.
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import aiohttp
from pydantic import BaseModel, Field

from .config import settings
from .exceptions import JiraIntegrationError
from .models import CallSummarizationResponse


logger = logging.getLogger(__name__)


class JiraTicketRequest(BaseModel):
    """Request model for creating a Jira ticket."""
    
    summary: str = Field(..., description="Ticket summary/title")
    description: str = Field(..., description="Ticket description")
    issue_type: str = Field(default="Task", description="Jira issue type")
    priority: str = Field(default="Medium", description="Ticket priority")
    project_key: str = Field(..., description="Jira project key")
    assignee: Optional[str] = Field(None, description="Assignee username")
    labels: List[str] = Field(default_factory=list, description="Ticket labels")


class JiraTicketResponse(BaseModel):
    """Response model for Jira ticket creation."""
    
    ticket_id: str = Field(..., description="Created ticket ID")
    ticket_key: str = Field(..., description="Created ticket key")
    ticket_url: str = Field(..., description="Direct URL to the ticket")
    summary: str = Field(..., description="Ticket summary")


class JiraConfig(BaseModel):
    """Jira configuration settings."""
    
    base_url: str = Field(..., description="Jira instance base URL")
    username: str = Field(..., description="Jira username")
    api_token: str = Field(..., description="Jira API token")
    project_key: str = Field(..., description="Default project key")
    default_issue_type: str = Field(default="Task", description="Default issue type")
    default_priority: str = Field(default="Medium", description="Default priority")
    
    class Config:
        env_prefix = "JIRA_"


class JiraService:
    """Service for creating Jira tickets from call summaries."""
    
    def __init__(self, config: Optional[JiraConfig] = None):
        """Initialize Jira service with configuration.
        
        Args:
            config: Jira configuration. If None, will try to load from environment.
        """
        self.config = config or self._load_config_from_env()
        self.session: Optional[aiohttp.ClientSession] = None
        
    def _load_config_from_env(self) -> JiraConfig:
        """Load Jira configuration from environment variables.
        
        Returns:
            JiraConfig: Configuration loaded from environment.
            
        Raises:
            ValueError: If required configuration is missing.
        """
        try:
            return JiraConfig(
                base_url=settings.jira_base_url,
                username=settings.jira_username,
                api_token=settings.jira_api_token,
                project_key=settings.jira_project_key,
                default_issue_type=settings.jira_default_issue_type,
                default_priority=settings.jira_default_priority,
            )
        except AttributeError as e:
            raise ValueError(f"Missing Jira configuration: {e}")
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session for Jira API calls.
        
        Returns:
            aiohttp.ClientSession: HTTP session with authentication.
        """
        if self.session is None or self.session.closed:
            auth = aiohttp.BasicAuth(self.config.username, self.config.api_token)
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(
                auth=auth,
                headers=headers,
                timeout=timeout
            )
        return self.session
    
    async def close(self) -> None:
        """Close the HTTP session."""
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def create_ticket(self, ticket_request: JiraTicketRequest) -> JiraTicketResponse:
        """Create a Jira ticket.
        
        Args:
            ticket_request: Ticket creation request.
            
        Returns:
            JiraTicketResponse: Created ticket information.
            
        Raises:
            JiraIntegrationError: If ticket creation fails.
        """
        session = await self._get_session()
        
        # Prepare Jira issue payload
        issue_payload = {
            "fields": {
                "project": {"key": ticket_request.project_key},
                "summary": ticket_request.summary,
                "description": ticket_request.description,
                "issuetype": {"name": ticket_request.issue_type},
                "priority": {"name": ticket_request.priority},
            }
        }
        
        # Add optional fields
        if ticket_request.assignee:
            issue_payload["fields"]["assignee"] = {"name": ticket_request.assignee}
        
        if ticket_request.labels:
            issue_payload["fields"]["labels"] = ticket_request.labels
        
        url = f"{self.config.base_url}/rest/api/3/issue"
        
        try:
            async with session.post(url, json=issue_payload) as response:
                if response.status == 201:
                    result = await response.json()
                    ticket_key = result["key"]
                    ticket_id = result["id"]
                    ticket_url = f"{self.config.base_url}/browse/{ticket_key}"
                    
                    logger.info(f"Successfully created Jira ticket: {ticket_key}")
                    
                    return JiraTicketResponse(
                        ticket_id=ticket_id,
                        ticket_key=ticket_key,
                        ticket_url=ticket_url,
                        summary=ticket_request.summary
                    )
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to create Jira ticket: {response.status} - {error_text}")
                    raise JiraIntegrationError(
                        f"Failed to create Jira ticket: {response.status} - {error_text}"
                    )
                    
        except aiohttp.ClientError as e:
            logger.error(f"HTTP error while creating Jira ticket: {e}")
            raise JiraIntegrationError(f"HTTP error while creating Jira ticket: {e}")
        except Exception as e:
            logger.error(f"Unexpected error while creating Jira ticket: {e}")
            raise JiraIntegrationError(f"Unexpected error while creating Jira ticket: {e}")
    
    def _extract_recommendations_from_call_summary(
        self, 
        call_summary: CallSummarizationResponse,
        client_name: Optional[str] = None
    ) -> List[JiraTicketRequest]:
        """Extract actionable recommendations from call summary and convert to ticket requests.
        
        Args:
            call_summary: The call summarization response.
            client_name: Optional client name for context.
            
        Returns:
            List[JiraTicketRequest]: List of ticket requests based on recommendations.
        """
        tickets = []
        
        # Get manager recommendations from call summary
        manager_recommendations = call_summary.callSummary.managerRecommendations or []
        
        # Get action items as well
        action_items = call_summary.callSummary.actionItems or []
        
        # Combine recommendations and action items
        all_actions = manager_recommendations + action_items
        
        # Create context for the tickets
        context_info = []
        if client_name:
            context_info.append(f"Клиент: {client_name}")
        
        context_info.extend([
            f"Категория: {call_summary.callSummary.category}",
            f"Цель звонка: {call_summary.callSummary.purpose}",
            f"Принятое решение: {call_summary.callSummary.decisionMade}",
            f"Общее настроение: {call_summary.sentiment.overall}",
            f"Дата создания: {call_summary.callSummary.createdAt}"
        ])
        
        context_block = "\n".join(context_info)
        
        # Create tickets for each actionable recommendation
        for i, recommendation in enumerate(all_actions):
            if not recommendation or len(recommendation.strip()) < 10:
                continue
                
            # Generate ticket summary (first 80 chars of recommendation)
            summary = recommendation[:80] + "..." if len(recommendation) > 80 else recommendation
            
            # Create detailed description
            description = f"""
Рекомендация по результатам анализа звонка:

**Действие:**
{recommendation}

**Контекст звонка:**
{context_block}

**Дополнительная информация:**
- Обсуждаемые моменты: {'; '.join(call_summary.callSummary.discussionPoints[:3])}
- Движущие факторы настроения: {'; '.join(call_summary.sentiment.drivers[:2])}

**Создано автоматически из анализа звонка**
            """.strip()
            
            # Determine labels based on content
            labels = ["call-analysis", "sales-follow-up"]
            if client_name:
                # Sanitize client name for label
                client_label = client_name.lower().replace(" ", "-").replace("_", "-")
                labels.append(f"client-{client_label}")
            
            # Determine priority based on sentiment and content
            priority = "Medium"
            if "срочно" in recommendation.lower() or "немедленно" in recommendation.lower():
                priority = "High"
            elif call_summary.sentiment.overall == "Негативное":
                priority = "High"
            elif call_summary.sentiment.overall == "Позитивное":
                priority = "Medium"
            
            ticket_request = JiraTicketRequest(
                summary=summary,
                description=description,
                issue_type=self.config.default_issue_type,
                priority=priority,
                project_key=self.config.project_key,
                labels=labels
            )
            
            tickets.append(ticket_request)
        
        return tickets
    
    async def create_tickets_from_call_summary(
        self,
        call_summary: CallSummarizationResponse,
        client_name: Optional[str] = None,
        assignee: Optional[str] = None
    ) -> List[JiraTicketResponse]:
        """Create Jira tickets from call summary recommendations.
        
        Args:
            call_summary: The call summarization response.
            client_name: Optional client name for context.
            assignee: Optional assignee for all tickets.
            
        Returns:
            List[JiraTicketResponse]: List of created tickets.
            
        Raises:
            JiraIntegrationError: If ticket creation fails.
        """
        # Extract ticket requests from call summary
        ticket_requests = self._extract_recommendations_from_call_summary(
            call_summary, client_name
        )
        
        if not ticket_requests:
            logger.warning("No actionable recommendations found in call summary")
            return []
        
        # Set assignee if provided
        for ticket_request in ticket_requests:
            if assignee:
                ticket_request.assignee = assignee
        
        # Create tickets
        created_tickets = []
        for ticket_request in ticket_requests:
            try:
                ticket_response = await self.create_ticket(ticket_request)
                created_tickets.append(ticket_response)
            except JiraIntegrationError as e:
                logger.error(f"Failed to create ticket: {e}")
                # Continue with other tickets even if one fails
                continue
        
        logger.info(f"Created {len(created_tickets)} tickets from call summary")
        return created_tickets


# Global Jira service instance
jira_service: Optional[JiraService] = None


def get_jira_service() -> JiraService:
    """Get or create the global Jira service instance.
    
    Returns:
        JiraService: The Jira service instance.
        
    Raises:
        ValueError: If Jira configuration is not available.
    """
    global jira_service
    if jira_service is None:
        jira_service = JiraService()
    return jira_service


async def cleanup_jira_service() -> None:
    """Cleanup the global Jira service instance."""
    global jira_service
    if jira_service:
        await jira_service.close()
        jira_service = None
