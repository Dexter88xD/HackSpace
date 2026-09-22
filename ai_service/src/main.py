from core.lifespan import lifespan
from fastapi import FastAPI

app = FastAPI(lifespan=lifespan)

@app.get("/")
def hello()-> str:
    return "Hello, World!"