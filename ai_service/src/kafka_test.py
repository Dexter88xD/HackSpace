import asyncio
import json
import logging
import os
from aiokafka import AIOKafkaConsumer
from aiokafka import AIOKafkaProducer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kafka_consumer")

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "broker:9092")

producer: AIOKafkaProducer | None = None

async def start_producer():
    """Instantiate and start the producer once the event loop is running."""
    global producer
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BROKER,
        value_serializer=lambda v: v.encode('utf-8')
    )
    await producer.start()
    logger.info("Kafka Producer started and ready.")

async def stop_producer():
    global producer
    if producer:
        await producer.stop()
        logger.info("Kafka Producer disconnected.")

async def consume_events():
    """Background task that runs the Kafka consumer loop."""
    consumer = AIOKafkaConsumer(
        'name',
        bootstrap_servers=KAFKA_BROKER,
        group_id='fastapi-async-group',
        auto_offset_reset='earliest',
        retry_backoff_ms=500,
        api_version="2.8.1"
    )

    await consumer.start()
    logger.info("Kafka Consumer started and listening...")

    try:
        async for msg in consumer:
            try:
                value = msg.value.decode('utf-8') if msg.value else None
                logger.info(f"Processed: topic={msg.topic}, value={value}")
                await producer.send('greeting', f"Hello {value}")
                # Pass data to your domain services here

            except Exception as e:
                logger.error(f"Failed to process message: {e}")

    except asyncio.CancelledError:
        logger.info("Shutdown signal received. Cancelling consumer loop...")
    finally:
        await consumer.stop()
        logger.info("Kafka Consumer cleanly disconnected.")

