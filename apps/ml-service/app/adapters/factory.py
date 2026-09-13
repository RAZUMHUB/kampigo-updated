"""
Configuration-driven adapter factory.
"""

from functools import lru_cache

from ..core.config import Settings, get_settings
from .base import (
    ObjectDetectionAdapter,
    OcrAdapter,
    TextEmbeddingAdapter,
    VisionEmbeddingAdapter,
)


@lru_cache
def get_vision_adapter() -> VisionEmbeddingAdapter:
    settings: Settings = get_settings()

    if "dinov2" in settings.vision_model_name.lower():
        from .dinov2_vision_adapter import (
            Dinov2VisionAdapter,
        )

        return Dinov2VisionAdapter(
            settings.vision_model_name,
            settings.device,
        )

    from .clip_vision_adapter import ClipVisionAdapter

    return ClipVisionAdapter(
        settings.vision_model_name,
        settings.device,
    )


@lru_cache
def get_text_adapter() -> TextEmbeddingAdapter:
    settings: Settings = get_settings()

    from .sentence_transformer_text_adapter import (
        SentenceTransformerTextAdapter,
    )

    return SentenceTransformerTextAdapter(
        settings.text_model_name,
        settings.device,
    )


@lru_cache
def get_ocr_adapter() -> OcrAdapter:
    settings: Settings = get_settings()

    if settings.ocr_engine == "paddleocr":
        from .paddleocr_adapter import PaddleOcrAdapter

        return PaddleOcrAdapter()

    from .tesseract_ocr_adapter import TesseractOcrAdapter

    return TesseractOcrAdapter()


@lru_cache
def get_detection_adapter() -> ObjectDetectionAdapter:
    settings: Settings = get_settings()

    from .yolo_detection_adapter import (
        YoloDetectionAdapter,
    )

    return YoloDetectionAdapter(
        settings.detection_model_name,
    )
