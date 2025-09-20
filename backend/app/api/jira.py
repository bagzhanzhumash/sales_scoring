"""
API endpoints for Jira integration.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from pydantic import BaseModel, Field

from ..jira_service import (
    JiraService, 
    JiraTicketRequest, 
    JiraTicketResponse, 
    get_jira_service
)
from ..models import CallSummarizationResponse
from ..exceptions import JiraIntegrationError
from ..config import settings


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jira", tags=["jira"])


class CreateTicketsFromSummaryRequest(BaseModel):
    """Request model for creating Jira tickets from call summary."""
    
    call_summary: CallSummarizationResponse = Field(..., description="Call summary to extract tickets from")
    client_name: Optional[str] = Field(None, description="Client name for context")
    assignee: Optional[str] = Field(None, description="Assignee username for all tickets")
    project_key: Optional[str] = Field(None, description="Override default project key")


class CreateTicketsFromSummaryResponse(BaseModel):
    """Response model for creating Jira tickets from call summary."""
    
    tickets_created: List[JiraTicketResponse] = Field(..., description="List of created tickets")
    total_recommendations: int = Field(..., description="Total number of recommendations processed")
    tickets_count: int = Field(..., description="Number of tickets successfully created")


class JiraHealthResponse(BaseModel):
    """Health check response for Jira integration."""
    
    enabled: bool = Field(..., description="Whether Jira integration is enabled")
    configured: bool = Field(..., description="Whether Jira is properly configured")
    connection_status: str = Field(..., description="Connection status")


@router.get("/health", response_model=JiraHealthResponse)
async def health_check() -> JiraHealthResponse:
    """Check Jira integration health and configuration.
    
    Returns:
        JiraHealthResponse: Health status of Jira integration.
    """
    if not settings.jira_enabled:
        return JiraHealthResponse(
            enabled=False,
            configured=False,
            connection_status="disabled"
        )
    
    # Check if required configuration is present
    configured = all([
        settings.jira_base_url,
        settings.jira_username,
        settings.jira_api_token,
        settings.jira_project_key
    ])
    
    if not configured:
        return JiraHealthResponse(
            enabled=True,
            configured=False,
            connection_status="misconfigured"
        )
    
    # Test connection
    try:
        jira_service = get_jira_service()
        # TODO: Add actual connection test
        connection_status = "connected"
    except Exception as e:
        logger.error(f"Jira connection test failed: {e}")
        connection_status = "connection_failed"
    
    return JiraHealthResponse(
        enabled=True,
        configured=True,
        connection_status=connection_status
    )


@router.post("/create-ticket", response_model=JiraTicketResponse)
async def create_ticket(
    ticket_request: JiraTicketRequest,
    jira_service: JiraService = Depends(get_jira_service)
) -> JiraTicketResponse:
    """Create a single Jira ticket.
    
    Args:
        ticket_request: Ticket creation request.
        jira_service: Jira service dependency.
        
    Returns:
        JiraTicketResponse: Created ticket information.
        
    Raises:
        HTTPException: If ticket creation fails.
    """
    if not settings.jira_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Jira integration is disabled"
        )
    
    try:
        ticket_response = await jira_service.create_ticket(ticket_request)
        return ticket_response
    except JiraIntegrationError as e:
        logger.error(f"Failed to create Jira ticket: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create Jira ticket: {str(e)}"
        )
    except ValueError as e:
        logger.error(f"Invalid Jira configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Jira service misconfigured: {str(e)}"
        )


@router.post("/create-tickets-from-summary", response_model=CreateTicketsFromSummaryResponse)
async def create_tickets_from_summary(
    request: CreateTicketsFromSummaryRequest,
    background_tasks: BackgroundTasks,
    jira_service: JiraService = Depends(get_jira_service)
) -> CreateTicketsFromSummaryResponse:
    """Create Jira tickets from call summary recommendations.
    
    This endpoint extracts actionable recommendations from a call summary
    and creates corresponding Jira tickets.
    
    Args:
        request: Request containing call summary and optional parameters.
        background_tasks: FastAPI background tasks for cleanup.
        jira_service: Jira service dependency.
        
    Returns:
        CreateTicketsFromSummaryResponse: Information about created tickets.
        
    Raises:
        HTTPException: If ticket creation fails.
    """
    if not settings.jira_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Jira integration is disabled"
        )
    
    try:
        # Override project key if provided
        if request.project_key and jira_service.config:
            jira_service.config.project_key = request.project_key
        
        # Extract recommendations
        all_recommendations = (
            request.call_summary.callSummary.managerRecommendations or []
        ) + (
            request.call_summary.callSummary.actionItems or []
        )
        
        total_recommendations = len(all_recommendations)
        
        if total_recommendations == 0:
            logger.warning("No recommendations found in call summary")
            return CreateTicketsFromSummaryResponse(
                tickets_created=[],
                total_recommendations=0,
                tickets_count=0
            )
        
        # Create tickets
        created_tickets = await jira_service.create_tickets_from_call_summary(
            call_summary=request.call_summary,
            client_name=request.client_name,
            assignee=request.assignee
        )
        
        # Schedule cleanup in background
        background_tasks.add_task(jira_service.close)
        
        logger.info(
            f"Created {len(created_tickets)} Jira tickets from {total_recommendations} recommendations"
        )
        
        return CreateTicketsFromSummaryResponse(
            tickets_created=created_tickets,
            total_recommendations=total_recommendations,
            tickets_count=len(created_tickets)
        )
        
    except JiraIntegrationError as e:
        logger.error(f"Failed to create Jira tickets from summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create Jira tickets: {str(e)}"
        )
    except ValueError as e:
        logger.error(f"Invalid Jira configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Jira service misconfigured: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating tickets from summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while creating tickets"
        )


@router.post("/create-tickets-from-summary-async")
async def create_tickets_from_summary_async(
    request: CreateTicketsFromSummaryRequest,
    background_tasks: BackgroundTasks,
    jira_service: JiraService = Depends(get_jira_service)
) -> dict:
    """Create Jira tickets from call summary recommendations asynchronously.
    
    This endpoint starts the ticket creation process in the background
    and returns immediately. Useful for processing large numbers of recommendations.
    
    Args:
        request: Request containing call summary and optional parameters.
        background_tasks: FastAPI background tasks.
        jira_service: Jira service dependency.
        
    Returns:
        dict: Status message indicating the task was queued.
        
    Raises:
        HTTPException: If the service is unavailable.
    """
    if not settings.jira_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Jira integration is disabled"
        )
    
    async def create_tickets_task():
        """Background task to create tickets."""
        try:
            # Override project key if provided
            if request.project_key and jira_service.config:
                jira_service.config.project_key = request.project_key
            
            created_tickets = await jira_service.create_tickets_from_call_summary(
                call_summary=request.call_summary,
                client_name=request.client_name,
                assignee=request.assignee
            )
            
            logger.info(f"Background task created {len(created_tickets)} Jira tickets")
            
        except Exception as e:
            logger.error(f"Background ticket creation failed: {e}")
        finally:
            await jira_service.close()
    
    # Queue the background task
    background_tasks.add_task(create_tickets_task)
    
    all_recommendations = (
        request.call_summary.callSummary.managerRecommendations or []
    ) + (
        request.call_summary.callSummary.actionItems or []
    )
    
    return {
        "status": "queued",
        "message": f"Ticket creation queued for {len(all_recommendations)} recommendations",
        "recommendations_count": len(all_recommendations)
    }
