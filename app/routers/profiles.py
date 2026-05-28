from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from app.services.profile_service import export_profiles_csv, find_profile, list_profiles


router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("")
async def get_profiles(
    q: str | None = None,
    name: str | None = None,
    institution: str | None = None,
    uf: str | None = None,
    region: str | None = None,
    scholarship_level: str | None = None,
    scholarship_category: str | None = None,
    sex: str | None = None,
    main_area: str | None = None,
    topic: str | None = None,
    needs_review: bool | None = None,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    try:
        return list_profiles(
            q=q,
            name=name,
            institution=institution,
            uf=uf,
            region=region,
            scholarship_level=scholarship_level,
            scholarship_category=scholarship_category,
            sex=sex,
            main_area=main_area,
            topic=topic,
            needs_review=needs_review,
            limit=limit,
            offset=offset,
        )
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/export.csv")
async def get_profiles_csv():
    try:
        csv_data = export_profiles_csv()
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="profiles.csv"',
        },
    )


@router.get("/{profile_id}")
async def get_profile(profile_id: str):
    try:
        return find_profile(profile_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
