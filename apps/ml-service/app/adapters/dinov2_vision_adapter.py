"""
DINOv2-style vision embedding adapter. DINOv2's self-supervised features tend
to carry richer fine-grained/instance-level detail than CLIP (useful for
distinguishing two physically-different items of the same product model),
at the cost of losing CLIP's text-image joint embedding space. Swappable via
VISION_MODEL_NAME=facebook/dinov2-base.
"""

import logging

import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModel

from .base import VisionEmbeddingAdapter

logger = logging.getLogger(__name__)


class Dinov2VisionAdapter(VisionEmbeddingAdapter):
    def __init__(self, model_name: str = "facebook/dinov2-base", device: str = "cpu"):
        self.model_name = model_name
        self.device = device
        logger.info("Loading DINOv2 vision model: %s", model_name)
        self.model = AutoModel.from_pretrained(model_name).to(device).eval()
        self.processor = AutoImageProcessor.from_pretrained(model_name)

    @torch.no_grad()
    def embed_image(self, image: Image.Image) -> list[float]:
        inputs = self.processor(images=image.convert("RGB"), return_tensors="pt").to(self.device)
        outputs = self.model(**inputs)
        # CLS token as the pooled image representation
        pooled = outputs.last_hidden_state[:, 0, :]
        normalized = pooled / pooled.norm(p=2, dim=-1, keepdim=True)
        return normalized.squeeze(0).tolist()
