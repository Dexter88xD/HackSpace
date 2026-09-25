# ft_transcendence

Monorepo for the hackathon platform. The project is being built incrementally;
the default Docker stack currently contains infrastructure only.

## Services

- `backend`: NestJS core API with TypeORM
- `service_ai`: FastAPI processing service
- `frontend`: React single-page application
- `db`: PostgreSQL
- `minio`: object storage

## Run the stack

Requirements: Docker and Docker Compose.

```sh
cp .env.example .env # keep the committed development values or adjust them locally
make up
```

The infrastructure stack starts PostgreSQL and MinIO. Kafka and nginx will be
added when the application needs them.

## Run services independently

Start only the service you are actively working on:

```sh
make backend         # PostgreSQL + MinIO + NestJS
make ai              # PostgreSQL + MinIO + FastAPI
make frontend        # PostgreSQL + MinIO + React frontend
make db-reset        # Stop the stack and recreate PostgreSQL from scratch
```

The application services remain defined in Compose, but `make up` starts only
the infrastructure until their application code is ready. Run the service
target you are actively working on.

`make db-reset` is destructive: it deletes only the PostgreSQL volume. Use it
after changing database initialization variables such as `POSTGRES_DB`,
`POSTGRES_USER`, or `POSTGRES_PASSWORD`.

## Development

Use feature branches and pull requests. Backend schema changes belong in TypeORM migrations. Keep shared API changes documented in `docs/api_contracts.yml`.

