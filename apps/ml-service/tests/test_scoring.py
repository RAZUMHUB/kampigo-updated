"""
Tests for the pure-numpy scoring functions that don't require downloading
any model weights (best_pairwise_visual_similarity, attribute_similarity,
ocr_similarity). text_similarity is exercised indirectly via the router in
an integration test that requires network access to fetch model weights,
and is intentionally NOT run in this offline test suite.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models.scoring import attribute_similarity, best_pairwise_visual_similarity, ocr_similarity


def test_best_pairwise_visual_similarity_identical_vectors():
    v = [1.0, 0.0, 0.0]
    assert best_pairwise_visual_similarity([v], [v]) == 1.0


def test_best_pairwise_visual_similarity_orthogonal_vectors():
    a = [1.0, 0.0]
    b = [0.0, 1.0]
    assert best_pairwise_visual_similarity([a], [b]) == 0.0


def test_best_pairwise_visual_similarity_takes_best_pair_not_average():
    lost = [[1.0, 0.0], [0.0, 1.0]]
    found = [[1.0, 0.0]]
    # One lost image is a perfect match; averaging would drag the score down,
    # but "best pair" must return 1.0.
    assert best_pairwise_visual_similarity(lost, found) == 1.0


def test_best_pairwise_visual_similarity_empty_inputs():
    assert best_pairwise_visual_similarity([], []) == 0.0
    assert best_pairwise_visual_similarity([[1.0, 0.0]], []) == 0.0


def test_attribute_similarity_identical_attributes():
    attrs = {"brand": "Boat", "model": "Airdopes 141", "primaryColor": "black"}
    assert attribute_similarity(attrs, attrs) == 1.0


def test_attribute_similarity_different_brand():
    a = {"brand": "Boat"}
    b = {"brand": "JBL"}
    score = attribute_similarity(a, b)
    assert 0.0 <= score < 1.0


def test_attribute_similarity_no_overlapping_fields():
    assert attribute_similarity({}, {}) == 0.0


def test_ocr_similarity_matching_text():
    assert ocr_similarity(["ABC123"], ["ABC123"]) == 1.0


def test_ocr_similarity_no_text():
    assert ocr_similarity([], []) == 0.0
