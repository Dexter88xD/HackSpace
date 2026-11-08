
COMPOSE = docker compose -f docker-compose.yml --env-file .env

.DEFAULT_GOAL := all

.PHONY: all help up down start stop re ps logs \
        storage backend frontend ai broker \
        migration seed db db-reset \
        lint lint-fix typecheck build build-images test

# ==============================
# General
# ==============================

all: up

help:
	@echo ""
	@echo "HackSpace - Available Commands"
	@echo "=========================================="
	@echo ""
	@echo "General:"
	@echo "  make help       Show this help message"
	@echo "  make all        Start the entire stack (default)"
	@echo "  make up         Build and start the entire stack"
	@echo "  make down       Stop the entire stack"
	@echo "  make start      Start existing containers"
	@echo "  make stop       Stop running containers"
	@echo "  make re         Restart and rebuild the stack"
	@echo "  make ps         Show running containers"
	@echo "  make logs       Follow container logs"
	@echo ""
	@echo "Services:"
	@echo "  make storage    Start PostgreSQL"
	@echo "  make backend    Start backend and dependencies"
	@echo "  make frontend   Start frontend and PostgreSQL"
	@echo "  make ai         Start AI service and dependencies"
	@echo "  make broker     Start Kafka broker"
	@echo ""
	@echo "Database:"
	@echo "  make db         Open PostgreSQL shell"
	@echo "  make migration  Run TypeORM migrations"
	@echo "  make seed       Seed development users, profiles, skills and hackathons"
	@echo "  make db-reset   Stop stack and DELETE PostgreSQL data"
	@echo ""
	@echo "Quality:"
	@echo "  make lint         Run backend and frontend lint checks"
	@echo "  make lint-fix     Automatically fix supported lint issues"
	@echo "  make typecheck    Check frontend and backend TypeScript"
	@echo "  make build        Build frontend and backend applications"
	@echo "  make build-images Build Docker images"
	@echo "  make test         Run backend Jest tests"
	@echo ""

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

start:
	$(COMPOSE) start

stop:
	$(COMPOSE) stop

re: down up

ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

# ==============================
# Services
# ==============================

storage:
	$(COMPOSE) up -d --build db

backend:
	$(COMPOSE) up -d --build db backend

frontend:
	$(COMPOSE) up -d --build db frontend

ai:
	$(COMPOSE) up -d --build ai_service

broker:
	$(COMPOSE) up -d --build broker

# ==============================
# Database
# ==============================

db:
	$(COMPOSE) exec -T db sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'

migration:
	$(COMPOSE) exec backend npm run typeorm migration:run -- -d src/database/data-source.ts

seed:
	$(COMPOSE) exec backend npm run seed:dev

db-reset:
	@set -eu; \
	project="$$( $(COMPOSE) config | sed -n 's/^name: //p' | head -n 1 )"; \
	if [ -z "$$project" ]; then \
		echo "Error: could not determine the Compose project name; database untouched." >&2; \
		exit 1; \
	fi; \
	volumes="$$(docker volume ls -q \
		--filter "label=com.docker.compose.project=$$project" \
		--filter "label=com.docker.compose.volume=db_data")"; \
	set -- $$volumes; \
	if [ "$$#" -gt 1 ]; then \
		echo "Error: multiple db_data volumes matched project $$project; database untouched." >&2; \
		exit 1; \
	fi; \
	echo "Stopping Compose project: $$project"; \
	if [ "$$#" -eq 1 ]; then \
		echo "PostgreSQL volume to remove: $$1"; \
	fi; \
	$(COMPOSE) down --remove-orphans; \
	if [ "$$#" -eq 1 ]; then \
		docker volume rm "$$1"; \
	else \
		echo "No db_data volume found for Compose project $$project."; \
	fi

# ==============================
# Quality & Builds
# ==============================

lint:
	$(COMPOSE) exec -T backend npm run lint
	$(COMPOSE) exec -T frontend npm run lint

lint-fix:
	$(COMPOSE) exec -T backend npm run lint:fix
	$(COMPOSE) exec -T frontend npm run lint:fix

typecheck:
	$(COMPOSE) exec -T backend npm run typecheck
	$(COMPOSE) exec -T frontend npm run typecheck

build:
	$(COMPOSE) exec -T backend npm run build
	$(COMPOSE) exec -T frontend npm run build

build-images:
	$(COMPOSE) build

test:
	$(COMPOSE) exec -T backend npm test
