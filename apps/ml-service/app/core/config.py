import os
from functools import lru_cache


class Settings:
    """
    Central config. Model choices are deliberately environment-driven so the
    "replaceable adapter" requirement holds in practice, not just in theory -
    swapping VISION_MODEL_NAME or OCR_ENGINE from an env var picks a
    different adapter with no code changes.
    """

    vision_model_name: str = os.getenv("VISION_MODEL_NAME", "openai/clip-vit-base-patch32")
    text_model_name: str = os.getenv("TEXT_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
    ocr_engine: str = os.getenv("OCR_ENGINE", "tesseract")  # "tesseract" | "paddleocr"
    detection_model_name: str = os.getenv("DETECTION_MODEL_NAME", "yolov8n")
    enable_segmentation: bool = os.getenv("ENABLE_SEGMENTATION", "false").lower() == "true"
    device: str = os.getenv("ML_DEVICE", "cpu")


@lru_cache
def get_settings() -> Settings:
    return Settings()
