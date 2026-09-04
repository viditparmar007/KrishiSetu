from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine

from app.models import (
    user,
    farmer,
    farm,
    crop,
    centre,
    officer,
    slot,
    booking,
)  # noqa: F401

from app.routes import (
    auth,
    farmers,
    farms,
    crops,
    dashboard,
    centres,
    officer,
    admin,
    booking,
)


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI app ONLY ONCE
app = FastAPI(
    title="KrishiSetu API",
    version="0.4.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Phase 1
app.include_router(auth.router)
app.include_router(farmers.router)

# Phase 2
app.include_router(farms.router)
app.include_router(crops.router)
app.include_router(dashboard.router)

# Phase 3
app.include_router(centres.router)
app.include_router(officer.router)
app.include_router(admin.router)

# Phase 4
app.include_router(auth.router)
app.include_router(farmers.router)

app.include_router(farms.router)
app.include_router(crops.router)
app.include_router(dashboard.router)

app.include_router(centres.router)
app.include_router(officer.router)
app.include_router(admin.router)

app.include_router(booking.router)

app.include_router(booking.router)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "KrishiSetu backend",
    }

