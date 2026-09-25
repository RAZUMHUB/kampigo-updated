import time
from collections import defaultdict, deque

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .core.logging import configure_logging
from .routers import embed, health, match

configure_logging()

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 60

_request_times: dict[str, deque[float]] = defaultdict(deque)


async def rate_limit(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()

    timestamps = _request_times[client_ip]

    while timestamps and now - timestamps[0] >= RATE_LIMIT_WINDOW_SECONDS:
        timestamps.popleft()

    if request.url.path.startswith(("/v1/embed/", "/v1/match/")):
        if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"},
            )

        timestamps.append(now)

    return await call_next(request)


app = FastAPI(
    title="Lost & Found ML Service",
    description="Stateless embeddings + matching-score API consumed by the NestJS Match Orchestrator worker.",
    version="0.1.0",
)

app.middleware("http")(rate_limit)

app.include_router(health.router)
app.include_router(embed.router)
app.include_router(match.router)
