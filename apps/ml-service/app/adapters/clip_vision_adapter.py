"""
CLIP-style vision embedding adapter (openai/clip-vit-base-patch32 by default).
Good general-purpose zero-shot visual similarity; strong at category/product
level similarity. See dinov2_vision_adapter.py for an alternative better
suited to fine-grained, instance-specific similarity (scratches, wear, etc).
"""

import logging

import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

from .base import VisionEmbeddingAdapter

logger = logging.getLogger(__name__)


class ClipVisionAdapter(VisionEmbeddingAdapter):
    def __init__(self, model_name: str = "openai/clip-vit-base-patch32", device: str = "cpu"):
        self.model_name = model_name
        self.device = device
        logger.info("Loading CLIP vision model: %s", model_name)
        self.model = CLIPModel.from_pretrained(model_name).to(device).eval()
        self.processor = CLIPProcessor.from_pretrained(model_name)

    @torch.no_grad()
    def embed_image(self, image: Image.Image) -> list[float]:
        inputs = self.processor(images=image.convert("RGB"), return_tensors="pt").to(self.device)
        features = self.model.get_image_features(**inputs)
        normalized = features / features.norm(p=2, dim=-1, keepdim=True)
        return normalized.squeeze(0).tolist()
