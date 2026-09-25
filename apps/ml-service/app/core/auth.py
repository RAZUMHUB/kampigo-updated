import secrets

from fastapi import Header, HTTPException

from .config import get_settings


def require_ml_service_key(
    x_ml_service_key: str | None = Header(default=None),
) -> None:
    expected_key = get_settings().service_key

    if not expected_key:
        raise HTTPException(
            status_code=500,
            detail="ML service authentication is not configured",
        )

    if not x_ml_service_key or not secrets.compare_digest(
        x_ml_service_key,
        expected_key,
    ):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )
