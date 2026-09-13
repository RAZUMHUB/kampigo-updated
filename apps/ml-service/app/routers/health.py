from fastapi import APIRouter

from ..core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/healthz")
async def healthz():
    settings = get_settings()
    return {
        "status": "ok",
        "vision_model": settings.vision_model_name,
        "text_model": settings.text_model_name,
        "ocr_engine": settings.ocr_engine,
    }
