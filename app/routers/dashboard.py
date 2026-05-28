from fastapi import APIRouter, HTTPException

from app.services.dashboard_service import build_dashboard_metrics


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
async def dashboard_metrics():
    try:
        return build_dashboard_metrics()
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
