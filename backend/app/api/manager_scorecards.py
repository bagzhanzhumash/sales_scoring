"""
API endpoints for manager scorecards
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

from ..database import db

router = APIRouter(prefix="/api/v1/manager-scorecards", tags=["Manager Scorecards"])


class ScorecardCreate(BaseModel):
    manager_name: str
    calls: int = 0
    flagCalls: int = 0
    redFlags: int = 0
    dismissed: int = 0
    avgDuration: float = 0.0
    avgScore: int = 0
    compliance: int = 0
    hostileApproach: int = 0
    objectionHandling: int = 0
    empathyDeficit: int = 0


class ScorecardResponse(BaseModel):
    id: int
    unique_id: str
    manager_name: str
    scorecard: Dict
    timestamp: str
    calls: int
    flag_calls: int
    red_flags: int
    dismissed: int
    avg_duration: float
    avg_score: int
    compliance: int
    hostile_approach: int
    objection_handling: int
    empathy_deficit: int


class ManagerStatsResponse(BaseModel):
    total_entries: int
    avg_calls: float
    avg_performance_score: float
    avg_compliance: float
    avg_hostile_approach: float
    avg_objection_handling: float
    avg_empathy_deficit: float
    first_entry: str
    last_entry: str


@router.post("/", response_model=Dict[str, str])
async def create_scorecard(scorecard: ScorecardCreate):
    """Create a new scorecard entry for a manager"""
    try:
        scorecard_data = scorecard.dict()
        unique_id = db.add_scorecard(scorecard.manager_name, scorecard_data)
        return {"unique_id": unique_id, "message": "Scorecard created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/managers", response_model=List[str])
async def get_all_managers():
    """Get list of all manager names"""
    try:
        return db.get_all_managers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest", response_model=List[Dict])
async def get_latest_scorecards(limit: int = 100):
    """Get the most recent scorecards across all managers"""
    try:
        return db.get_latest_scorecards(limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/manager/{manager_name}", response_model=List[Dict])
async def get_manager_scorecards(manager_name: str, limit: int = 50):
    """Get all scorecards for a specific manager"""
    try:
        scorecards = db.get_manager_scorecards(manager_name, limit)
        if not scorecards:
            raise HTTPException(status_code=404, detail="Manager not found")
        return scorecards
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/manager/{manager_name}/stats", response_model=Dict)
async def get_manager_stats(manager_name: str):
    """Get aggregate statistics for a manager"""
    try:
        stats = db.get_manager_stats(manager_name)
        if not stats:
            raise HTTPException(status_code=404, detail="Manager not found")
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{unique_id}", response_model=Dict)
async def get_scorecard(unique_id: str):
    """Get a specific scorecard by unique_id"""
    try:
        scorecard = db.get_scorecard(unique_id)
        if not scorecard:
            raise HTTPException(status_code=404, detail="Scorecard not found")
        return scorecard
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{unique_id}", response_model=Dict[str, str])
async def update_scorecard(unique_id: str, scorecard: ScorecardCreate):
    """Update an existing scorecard"""
    try:
        scorecard_data = scorecard.dict()
        success = db.update_scorecard(unique_id, scorecard_data)
        if not success:
            raise HTTPException(status_code=404, detail="Scorecard not found")
        return {"message": "Scorecard updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{unique_id}", response_model=Dict[str, str])
async def delete_scorecard(unique_id: str):
    """Delete a scorecard by unique_id"""
    try:
        success = db.delete_scorecard(unique_id)
        if not success:
            raise HTTPException(status_code=404, detail="Scorecard not found")
        return {"message": "Scorecard deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seed", response_model=Dict[str, str])
async def seed_database():
    """Seed the database with sample data (for development)"""
    try:
        from ..database import seed_database
        seed_database()
        return {"message": "Database seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
