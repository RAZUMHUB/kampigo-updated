import logging

from sentence_transformers import SentenceTransformer, util

from .base import TextEmbeddingAdapter

logger = logging.getLogger(__name__)


class SentenceTransformerTextAdapter(TextEmbeddingAdapter):
    def __init__(
        self,
        model_name: str = (
            "sentence-transformers/all-MiniLM-L6-v2"
        ),
        device: str = "cpu",
    ):
        self.model_name = model_name
        logger.info(
            "Loading text embedding model: %s",
            model_name,
        )
        self.model = SentenceTransformer(
            model_name,
            device=device,
        )

    def embed_text(self, text: str) -> list[float]:
        vector = self.model.encode(
            text,
            normalize_embeddings=True,
        )
        return vector.tolist()

    def similarity(
        self,
        text_a: str,
        text_b: str,
    ) -> float:
        if not text_a.strip() or not text_b.strip():
            return 0.0

        vector_a = self.model.encode(
            text_a,
            normalize_embeddings=True,
            convert_to_tensor=True,
        )
        vector_b = self.model.encode(
            text_b,
            normalize_embeddings=True,
            convert_to_tensor=True,
        )

        score = float(
            util.cos_sim(vector_a, vector_b).item()
        )

        return max(0.0, min(1.0, score))
