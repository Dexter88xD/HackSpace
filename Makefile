COMPOSE = docker compose -f docker-compose.yml --env-file .env

.DEFAULT_GOAL := all
.PHONY: help up backend ai frontend down logs db db-reset all

all: up

up:
	$(COMPOSE) up -d --build

help:
	@echo "make all      Start the entire stack"
	@echo "make up       Start PostgreSQL and MinIO"
	@echo "make backend  Start infrastructure and the backend"
	@echo "make ai       Start infrastructure and the AI service"
	@echo "make frontend Start infrastructure and the frontend"
	@echo "make broker   Start Kafka broker"
	@echo "make down     Stop the stack"
	@echo "make logs     Follow service logs"
	@echo "make db       Open a PostgreSQL shell"
	@echo "make db-reset Stop stack and delete the PostgreSQL volume"
	@echo "make ps       Show the status of the stack"
	@echo "make re       Restart the stack"

storage:
	$(COMPOSE) up -d --build db

backend:
	$(COMPOSE) up -d --build db backend

ai:
	$(COMPOSE) up -d --build ai_service

frontend:
	$(COMPOSE) up -d --build db frontend

lint:
	cd backend && npm run lint
	cd frontend && npm run lint

broker:
	$(COMPOSE) up -d --build broker

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

db:
	$(COMPOSE) exec -T db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

db-reset:
	$(COMPOSE) down --remove-orphans
	volume="$$(docker volume ls -q --filter label=com.docker.compose.volume=db_data)"; \
	if [ -n "$$volume" ]; then docker volume rm "$$volume"; fi

ps:
	$(COMPOSE) ps

re: down up
