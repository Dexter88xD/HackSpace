import asyncio
from contextlib import asynccontextmanager
from tracemalloc import stop
from fastapi import FastAPI
from src.kafka_test import consume_events, start_producer, stop_producer

@asynccontextmanager
async def lifespan(app: FastAPI):
    await start_producer()
    task = asyncio.create_task(consume_events())
    yield

    task.cancel()
    await stop_producer()