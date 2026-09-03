from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine

# Import models so SQLAlchemy knows about every table before create_all runs
from app.models import user, farmer  # noqa: F401

from app.routes import auth, farmers

Base.metadata.create_all(bind=engine)

app = FastAPI(title="KrishiSetu API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(farmers.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "KrishiSetu backend"}