from typing import Optional

from pydantic import BaseModel, Field


class EmbedImageRequest(BaseModel):
    image_url: str
    item_image_id: str


class EmbedImageResponse(BaseModel):
    item_image_id: str
    vector: list[float]
    model_name: str
    ocr_text: Optional[str] = None


class EmbedTextRequest(BaseModel):
    text: str


class EmbedTextResponse(BaseModel):
    vector: list[float]
    model_name: str


class ScoreCandidateRequest(BaseModel):
    lost_image_vectors: list[list[float]] = Field(default_factory=list)
    found_image_vectors: list[list[float]] = Field(default_factory=list)
    lost_text: str
    found_text: str
    lost_attributes: dict = Field(default_factory=dict)
    found_attributes: dict = Field(default_factory=dict)
    lost_ocr_text: list[str] = Field(default_factory=list)
    found_ocr_text: list[str] = Field(default_factory=list)


class ScoreCandidateResponse(BaseModel):
    visual_score: float
    text_score: float
    attribute_score: float
    ocr_score: float
