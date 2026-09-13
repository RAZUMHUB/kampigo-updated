import logging
from typing import Optional

from PIL import Image

from .base import OcrAdapter

logger = logging.getLogger(__name__)


class PaddleOcrAdapter(OcrAdapter):
    """
    PaddleOCR alternative - generally stronger on stylized fonts, small text,
    and non-Latin scripts than Tesseract, at a heavier dependency/runtime
    cost. Lazily imports `paddleocr` so choosing OCR_ENGINE=tesseract never
    requires paddle to be installed at all.
    """

    def __init__(self):
        self._engine = None

    def _get_engine(self):
        if self._engine is None:
            from paddleocr import PaddleOCR  # lazy import - heavy dependency

            self._engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        return self._engine

    def extract_text(self, image: Image.Image) -> Optional[str]:
        try:
            import numpy as np

            engine = self._get_engine()
            result = engine.ocr(np.array(image.convert("RGB")), cls=True)
            lines = [line[1][0] for block in result for line in block] if result else []
            joined = " ".join(lines).strip()
            return joined or None
        except Exception:
            logger.exception("PaddleOCR failed")
            return None
