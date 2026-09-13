from fastapi import APIRouter

from ..adapters.factory import get_text_adapter
from ..models.schemas import (
    ScoreCandidateRequest,
    ScoreCandidateResponse,
)
from ..models.scoring import (
    attribute_similarity,
    best_pairwise_visual_similarity,
    ocr_similarity,
)

router = APIRouter(
    prefix="/v1/match",
    tags=["matching"],
)


@router.post(
    "/score",
    response_model=ScoreCandidateResponse,
)
async def score_candidate(
    request: ScoreCandidateRequest,
) -> ScoreCandidateResponse:
    text_adapter = get_text_adapter()

    visual_score = (
        best_pairwise_visual_similarity(
            request.lost_image_vectors,
            request.found_image_vectors,
        )
    )

    text_score = text_adapter.similarity(
        request.lost_text,
        request.found_text,
    )

    attribute_score = attribute_similarity(
        request.lost_attributes,
        request.found_attributes,
    )

    ocr_score = ocr_similarity(
        request.lost_ocr_text,
        request.found_ocr_text,
    )

    return ScoreCandidateResponse(
        visual_score=visual_score,
        text_score=text_score,
        attribute_score=attribute_score,
        ocr_score=ocr_score,
    )
