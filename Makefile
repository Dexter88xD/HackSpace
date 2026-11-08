
COMPOSE = docker compose -f docker-compose.yml --env-file .env

.DEFAULT_GOAL := all

.PHONY: all help up down start stop re ps logs \
        storage backend frontend ai broker \
        migration seed db db-reset \
        lint test

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
	@echo "  make lint       Run backend and frontend lint checks"
	@echo "  make test       Run backend Jest tests"
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
	$(COMPOSE) down --remove-orphans
	@volume="$$(docker volume ls -q --filter label=com.docker.compose.volume=db_data)"; \
	if [ -n "$$volume" ]; then \
		echo "Removing PostgreSQL volume: $$volume"; \
		docker volume rm "$$volume"; \
	else \
		echo "No PostgreSQL volume found."; \
	fi

# ==============================
# Quality
# ==============================

lint:
	$(COMPOSE) exec backend npm run lint
	$(COMPOSE) exec frontend npm run lint

test:
	$(COMPOSE) exec backend npm test
