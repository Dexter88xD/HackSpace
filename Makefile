.DEFAULT_GOAL := help
.PHONY: help up backend ai frontend down logs db db-reset

help:
	@echo "make up       Start PostgreSQL and MinIO"
	@echo "make backend  Start infrastructure and the backend"
	@echo "make ai       Start infrastructure and the AI service"
	@echo "make frontend Start infrastructure and the frontend"
	@echo "make down     Stop the stack"
	@echo "make logs     Follow service logs"
	@echo "make db       Open a PostgreSQL shell"
	@echo "make db-reset Stop stack and delete the PostgreSQL volume"

up:
	docker compose up -d db minio

backend:
	docker compose up --build db minio backend

ai:
	docker compose up --build db minio ai_service

frontend:
	docker compose up --build db minio frontend

down:
	docker compose down

logs:
	docker compose logs -f

db:
	docker compose exec -T db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

db-reset:
	docker compose down --remove-orphans
	volume="$$(docker volume ls -q --filter label=com.docker.compose.volume=db_data)"; \
	if [ -n "$$volume" ]; then docker volume rm "$$volume"; fi
