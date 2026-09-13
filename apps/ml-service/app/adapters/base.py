"""
Adapter interfaces for the ML service.

Concrete model implementations stay behind these interfaces so model
selection remains configuration-driven.
"""

from abc import ABC, abstractmethod
from typing import Optional

from PIL import Image


class VisionEmbeddingAdapter(ABC):
    model_name: str

    @abstractmethod
    def embed_image(self, image: Image.Image) -> list[float]:
        raise NotImplementedError


class TextEmbeddingAdapter(ABC):
    model_name: str

    @abstractmethod
    def embed_text(self, text: str) -> list[float]:
        raise NotImplementedError

    @abstractmethod
    def similarity(self, text_a: str, text_b: str) -> float:
        raise NotImplementedError


class OcrAdapter(ABC):
    @abstractmethod
    def extract_text(self, image: Image.Image) -> Optional[str]:
        raise NotImplementedError


class ObjectDetectionAdapter(ABC):
    @abstractmethod
    def detect(self, image: Image.Image) -> list[dict]:
        raise NotImplementedError
