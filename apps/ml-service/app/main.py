import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from redis.asyncio import Redis

from .core.logging import configure_logging
from .routers import embed, health, match

configure_logging()

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 60

RATE_LIMIT_SCRIPT = """
local current = redis.call('INCR', KEYS[1])

if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end

return current
"""

redis_client = Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", "6379")),
    decode_responses=True,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_client.ping()
    yield
    await redis_client.aclose()


async def rate_limit(request: Request, call_next):
    if request.url.path.startswith(("/v1/embed/", "/v1/match/")):
        client_ip = request.client.host if request.client else "unknown"
        key = f"ml-rate-limit:{client_ip}"

        current = await redis_client.eval(
            RATE_LIMIT_SCRIPT,
            1,
            key,
            RATE_LIMIT_WINDOW_SECONDS,
        )

        if int(current) > RATE_LIMIT_MAX_REQUESTS:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"},
            )

    return await call_next(request)


app = FastAPI(
    title="Lost & Found ML Service",
    description="Stateless embeddings + matching-score API consumed by the NestJS Match Orchestrator worker.",
    version="0.1.0",
    lifespan=lifespan,
)

app.middleware("http")(rate_limit)

app.include_router(health.router)
app.include_router(embed.router)
app.include_router(match.router)
