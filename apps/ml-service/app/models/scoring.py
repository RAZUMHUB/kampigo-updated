"""
Stage-2 deep scoring: combines per-image visual similarity, text similarity,
structured-attribute similarity, and OCR text similarity into four
sub-scores. The composite weighting across these sub-scores happens on the
Node/NestJS side (MatchingService) so the human-facing tier thresholds and
weighting policy live in one place; this module only computes the raw
per-signal similarities.

Kept intentionally simple and dependency-light (pure numpy) so it's easy to
benchmark and swap pieces (e.g. a smarter attribute-similarity function)
without touching the API contract.
"""

from difflib import SequenceMatcher

import numpy as np


def _cosine(a: list[float], b: list[float]) -> float:
    va, vb = np.array(a), np.array(b)
    if not va.any() or not vb.any():
        return 0.0
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb)))


def best_pairwise_visual_similarity(
    lost_vectors: list[list[float]], found_vectors: list[list[float]]
) -> float:
    """
    Instance-specific matching: compares EVERY lost-image / found-image pair
    and takes the single best match, rather than averaging all images into
    one blended vector first. This preserves distinguishing detail - e.g. a
    single found photo that clearly shows the same scratch as one lost photo
    should drive the score up even if the item's OTHER photos look generic.
    """
    if not lost_vectors or not found_vectors:
        return 0.0
    best = 0.0
    for lv in lost_vectors:
        for fv in found_vectors:
            sim = _cosine(lv, fv)
            if sim > best:
                best = sim
    # Cosine similarity can be negative for very dissimilar embeddings; clamp to [0, 1].
    return max(0.0, min(1.0, best))



def attribute_similarity(attrs_a: dict, attrs_b: dict) -> float:
    """
    Structured attribute similarity (brand, model, colors). Distinguishes
    "same product model" from "same physical item" is handled upstream by
    combining this with visual_score - two identical-model items score high
    here but only the correct physical pair should score high on
    best_pairwise_visual_similarity's fine-grained detail.
    """
    keys = ["brand", "model", "primaryColor", "secondaryColor"]
    scores = []
    for key in keys:
        a_val = str(attrs_a.get(key) or "").strip().lower()
        b_val = str(attrs_b.get(key) or "").strip().lower()
        if not a_val and not b_val:
            continue
        if not a_val or not b_val:
            scores.append(0.0)
            continue
        scores.append(SequenceMatcher(None, a_val, b_val).ratio())
    return sum(scores) / len(scores) if scores else 0.0


def ocr_similarity(ocr_a: list[str], ocr_b: list[str]) -> float:
    if not ocr_a or not ocr_b:
        return 0.0
    best = 0.0
    for a in ocr_a:
        for b in ocr_b:
            ratio = SequenceMatcher(None, a.lower(), b.lower()).ratio()
            if ratio > best:
                best = ratio
    return best
