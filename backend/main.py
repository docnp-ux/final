"""
FastAPI Application — Main Entry Point

Creates the FastAPI instance, wires up:
  - Lifespan events (DB table creation on startup)
  - CORS middleware
  - Custom timing middleware
  - Exception handlers
  - All routers (auth, users, devices, measurements, energy, servo)

Run:  uv run uvicorn app.main:app --reload
Docs: http://127.0.0.1:8000/docs
"""

import time
import uuid
from contextlib import asynccontextmanager

from backend.app.routers import auth, devices, energy, measurements, servo
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from backend.app.config import get_settings
from backend.app.db import create_db_and_tables
from backend.app.exceptions import register_exception_handlers
from backend.app.routers import users

settings = get_settings()


# --- Lifespan ---


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables. Shutdown: cleanup."""
    create_db_and_tables()
    print("Database ready [OK]")
    yield
    print("Shutting down...")


# --- App Instance ---

app = FastAPI(
    title="Solar Tracker API",
    description=(
        "IoT solar tracker backend: device telemetry ingestion, "
        "role-based dashboards, and manual servo override control."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# --- Middleware ---

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom timing middleware
class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        start = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.4f}"
        response.headers["X-Request-ID"] = request_id
        return response


app.add_middleware(TimingMiddleware)


# --- Exception Handlers ---

register_exception_handlers(app)


# --- Routers ---

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(devices.router)
app.include_router(measurements.router)
app.include_router(energy.router)
app.include_router(servo.router)


# --- Root ---


@app.get("/", tags=["root"])
def root():
    """Health check / welcome endpoint."""
    return {"message": "Solar Tracker API", "docs": "/docs"}
