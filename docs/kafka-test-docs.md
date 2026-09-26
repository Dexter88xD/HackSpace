# Kafka Event-Driven Architecture Documentation

This document outlines the local Kafka infrastructure utilized in the Hackspace project to facilitate asynchronous, event-driven communication between the NestJS (`backend`) and FastAPI (`ai_service`) microservices.

## Architecture Overview

The project uses a single-node Apache Kafka cluster running in **KRaft mode** (without Zookeeper).

```mermaid
graph TD
    classDef nest fill:#e0234e,stroke:#fff,stroke-width:2px,color:#fff;
    classDef fast fill:#009688,stroke:#fff,stroke-width:2px,color:#fff;
    classDef kafka fill:#231f20,stroke:#fff,stroke-width:2px,color:#fff;
    classDef db fill:#f0db4f,stroke:#333,stroke-width:2px,color:#333;

    subgraph NestJS Application
        direction TB
        PostName["POST /demo/send-name"]:::nest
        GetGreetings["GET /demo/greetings"]:::nest
        NestConsumer["@EventPattern('greeting')"]:::nest
        MemoryArray[("In-Memory Array")]:::db
    end

    subgraph Kafka Broker
        direction LR
        TopicName(("Topic: name")):::kafka
        TopicGreeting(("Topic: greeting")):::kafka
    end

    subgraph FastAPI Application
        direction TB
        FastConsumer["AIOKafkaConsumer"]:::fast
        FastProducer["AIOKafkaProducer"]:::fast
    end

    PostName -- "1. emits message" --> TopicName
    TopicName -- "2. consumed by" --> FastConsumer
    FastConsumer -. "3. formats plain string" .-> FastProducer
    FastProducer -- "4. produces UTF-8 string" --> TopicGreeting
    TopicGreeting -- "5. consumed by" --> NestConsumer
    NestConsumer -- "6. pushes to" --> MemoryArray
    GetGreetings -- "7. fetches from" --> MemoryArray
```

## Infrastructure Components

The Kafka infrastructure is defined in `docker-compose.yml` and consists of three specialized containers:

### 1. `broker`
The core Kafka server operating in KRaft mode, acting as both a broker and its own controller.
*   **Image:** `apache/kafka:latest`
*   **Ports:** `9092` (Client traffic)
*   **Configuration Highlights:**
    *   `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1`: Critical for single-node development. Without this, the `__consumer_offsets` topic fails to build, permanently breaking consumer groups.
    *   `KAFKA_PROCESS_ROLES: broker,controller`: Enables KRaft mode.
    *   **Healthcheck:** Lists topics via `kafka-topics.sh` every 10 seconds to ensure the process is ready to accept connections.

### 2. `init-kafka`
An ephemeral bootstrap container responsible for automatically creating required topics before any microservice connects.
*   **Execution:** Mounts and runs `./infrastructure/scripts/kafka-init.sh`.
*   **Dependency:** Waits for the `broker` container to pass its healthcheck (`condition: service_healthy`) before executing.

### 3. `kafka-ui`
A web-based graphical interface for inspecting the cluster.
*   **Access:** Available at `http://localhost:8080`.
*   **Capabilities:** View live message streams, inspect consumer group offsets, and manually publish test messages.

## Service Integration Strategy

To prevent race conditions where consumers attempt to connect to topics that do not exist yet, both the `backend` and `ai_service` enforce a strict boot sequence in Docker Compose:

```yaml
depends_on:
  init-kafka:
    condition: service_completed_successfully
```

This ensures that the application servers remain suspended until `init-kafka` successfully finishes building the topics and gracefully exits with a status code of `0`.

## Developer Guidelines & Troubleshooting

When developing or modifying the Kafka integration between NestJS and FastAPI, observe the following behavior and constraints:

*   **Payload contract:** `POST /demo/send-name` emits the request's `name` as a plain string on `name`. The AI consumer decodes it, prefixes it with `Hello` and a space, and the producer's serializer encodes that plain string as UTF-8 bytes on `greeting`. NestJS receives it as a string through `@Payload()` and stores it in the in-memory greetings array. Do not document or test this path as a JSON-object payload unless the producer and consumer are changed together.
*   **Group Coordinator Failures:** The Compose file does not declare a persistent volume for Kafka. If broker metadata or consumer groups become unhealthy, recreate the broker and topic-initializer containers without removing unrelated database or MinIO data:
    `docker compose stop broker init-kafka && docker compose rm -f broker init-kafka && docker compose up -d broker init-kafka backend ai_service`
*   **NestJS historical offsets:** The `DemoModule` Kafka client sets `subscribe.fromBeginning: true`, but the server-side Kafka microservice in `backend/src/main.ts` does not. The `@EventPattern('greeting')` consumer therefore uses the server's default offset behavior; add `fromBeginning` to that server configuration if replaying earlier messages after a new consumer group is required.
*   **Microservice Registration:** NestJS requires `await app.startAllMicroservices()` in `main.ts`. Omitting this will silently disable all `@EventPattern` decorators without throwing an error.