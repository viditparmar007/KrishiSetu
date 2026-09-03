from fastapi import FastAPI


app = FastAPI(
    title="KrishiSetu API",
    description="Smart Farmer Procurement Platform",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "KrishiSetu Backend is running successfully"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }