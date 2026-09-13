from fastapi import FastAPI

from .core.logging import configure_logging
from .routers import embed, health, match

configure_logging()

app = FastAPI(
    title="Lost & Found ML Service",
    description="Stateless embeddings + matching-score API consumed by the NestJS Match Orchestrator worker.",
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(embed.router)
app.include_router(match.router)
