from fastapi import APIRouter, HTTPException

from app.models.admin import RunPipelineRequest
from app.services.pipeline_admin_service import get_pipeline_status, start_pipeline


router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/pipeline/run")
async def post_pipeline_run(request: RunPipelineRequest):
    try:
        return start_pipeline(limit=request.limit)
    except RuntimeError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.get("/pipeline/status")
async def get_pipeline_run_status():
    return get_pipeline_status()

