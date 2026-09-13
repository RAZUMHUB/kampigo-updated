import logging
from typing import Optional

import pytesseract
from PIL import Image

from .base import OcrAdapter

logger = logging.getLogger(__name__)


class TesseractOcrAdapter(OcrAdapter):
    """
    Fast, dependency-light OCR. Good default for short strings (serial
    numbers, name tags, stickers). Requires the `tesseract-ocr` system
    package to be installed (see Dockerfile).
    """

    def extract_text(self, image: Image.Image) -> Optional[str]:
        try:
            text = pytesseract.image_to_string(image.convert("L"))
            cleaned = text.strip()
            return cleaned or None
        except Exception:
            logger.exception("Tesseract OCR failed")
            return None
