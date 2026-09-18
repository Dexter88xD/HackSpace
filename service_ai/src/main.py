from fastapi import FastAPI

app = FastAPI(title="AI service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "service_ai"}
