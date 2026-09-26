import io
import logging
from urllib.parse import urlparse


import httpx
from fastapi import APIRouter, Depends, HTTPException
from PIL import Image

from ..core.auth import require_ml_service_key
from ..core.config import get_settings
from ..adapters.factory import (
    get_detection_adapter,
    get_ocr_adapter,
    get_text_adapter,
    get_vision_adapter,
)
from ..models.schemas import (
    EmbedImageRequest,
    EmbedImageResponse,
    EmbedTextRequest,
    EmbedTextResponse,
)

def validate_storage_url(image_url: str) -> str:
    parsed = urlparse(image_url)
    settings = get_settings()

    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise HTTPException(
            status_code=422,
            detail="Invalid image URL",
        )

    if parsed.hostname.lower() not in settings.trusted_storage_hosts:
        raise HTTPException(
            status_code=422,
            detail="Image URL host is not trusted",
        )

    return image_url


router = APIRouter(
    prefix="/v1/embed",
    tags=["embeddings"],
)
logger = logging.getLogger(__name__)


def crop_primary_object(
    image: Image.Image,
) -> Image.Image:
    detector = get_detection_adapter()
    detections = detector.detect(image)

    if not detections:
        return image

    primary = max(
        detections,
        key=lambda detection: (
            detection.get("confidence", 0.0)
        ),
    )

    bbox = primary.get("bbox")

    if not isinstance(bbox, list) or len(bbox) != 4:
        return image

    left, top, right, bottom = bbox

    width, height = image.size

    left = max(0, min(width, int(left)))
    top = max(0, min(height, int(top)))
    right = max(0, min(width, int(right)))
    bottom = max(0, min(height, int(bottom)))

    if right <= left or bottom <= top:
        return image

    return image.crop(
        (left, top, right, bottom)
    )


@router.post(
    "/image",
    response_model=EmbedImageResponse,
)
async def embed_image(
    request: EmbedImageRequest,
    _auth: None = Depends(require_ml_service_key),
) -> EmbedImageResponse:
    vision_adapter = get_vision_adapter()
    ocr_adapter = get_ocr_adapter()

    image_url = validate_storage_url(request.image_url)

    async with httpx.AsyncClient(
        timeout=15.0,
        follow_redirects=False,
    ) as client:
        try:
            response = await client.get(
                image_url
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Could not fetch image: {exc}"
                ),
            ) from exc

    try:
        image = Image.open(
            io.BytesIO(response.content)
        ).convert("RGB")
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid image data: {exc}",
        ) from exc

    embedding_image = crop_primary_object(image)

    vector = vision_adapter.embed_image(
        embedding_image
    )
    ocr_text = ocr_adapter.extract_text(image)

    return EmbedImageResponse(
        item_image_id=request.item_image_id,
        vector=vector,
        model_name=vision_adapter.model_name,
        ocr_text=ocr_text,
    )


@router.post(
    "/text",
    response_model=EmbedTextResponse,
)
async def embed_text(
    request: EmbedTextRequest,
    _auth: None = Depends(require_ml_service_key),
) -> EmbedTextResponse:
    text_adapter = get_text_adapter()

    vector = text_adapter.embed_text(
        request.text
    )

    return EmbedTextResponse(
        vector=vector,
        model_name=text_adapter.model_name,
    )
