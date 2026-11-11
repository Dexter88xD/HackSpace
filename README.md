_This project has been created as part of the 42 curriculum by hqannouc, aait-our, sel-maaq, aedarkao, sohamdan._

# HackSpace

HackSpace is a web platform for organising and participating in hackathons. Users can create and manage hackathons, discover events, manage profiles and skills, register for hackathons and form teams. The application is developed as the 42 **ft_transcendence** team project.

This repository is a Docker Compose monorepo containing a React/TypeScript frontend, a NestJS API and a PostgreSQL database. The backend uses TypeORM migrations rather than automatic schema synchronisation.

## Implemented functionality

- **Identity:** registration, email verification, sign-in, authenticated account lookup, Google OAuth and 42 Intra OAuth.
- **Profiles and skills:** profile creation/editing, skills catalogue, profile-skill assignments and catalogue management permissions.
- **Hackathons:** creation, exploration with filters, details, current phase, management listing, editing, registration, unregistration and membership lookup.
- **Teams:** create teams for a hackathon, browse teams, view your own team, join and leave teams.
- **Authorisation:** platform-level `ROLE_USER` and `ROLE_ADMIN` roles, plus hackathon-specific membership roles. An authenticated user can create a hackathon; its organiser or a platform administrator can edit it.

MinIO runs as local object storage using a Chainguard image pinned by immutable digest. Application uploads are not implemented yet. Nginx is not part of the running development stack.

## Technology stack and rationale

| Layer                   | Technology                                  | Purpose                                                           |
| ----------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| Frontend                | React, TypeScript, Vite, Tailwind CSS       | Component-based SPA, typed interfaces and fast development builds |
| Frontend data/forms     | Axios, TanStack Query, React Hook Form, Zod | HTTP requests, server-state caching and form validation           |
| Backend                 | NestJS, TypeScript, Passport/JWT            | Modular HTTP API, authentication and server-side permissions      |
| Persistence             | PostgreSQL 15, TypeORM                      | Relational data, constraints, transactions and migrations         |
| Development environment | Docker Compose, GNU Make                    | Reproducible service orchestration and shared developer commands  |
| Automated checks        | ESLint, TypeScript, Jest, GitHub Actions    | Linting, typechecking, tests and pull-request validation          |

## Run locally

### Prerequisites

- Docker Engine and the Docker Compose v2 plugin
- GNU Make
- Git

Application dependencies are managed inside the containers for the documented workflow.

### Configure the environment

Create **one** local environment file in the repository root:

```bash
cp .env.example .env
```

Fill in the required development values, including `POSTGRES_PASSWORD`, `JWT_SECRET`, and `MINIO_ROOT_PASSWORD` (at least 8 characters). `MINIO_ROOT_USER` must contain at least 3 characters. Configure SMTP credentials for email verification and provider credentials when testing OAuth. The `VITE_API_BASE_URL` variable is browser-visible and **must not contain secrets**. Do not commit `.env`; use `.env.example` for safe placeholder values only.

### Start the application

```bash
make up
make ps
make migration
```

Open the frontend at `http://localhost:5173`; the backend API is served at `http://localhost:3000` and Adminer at `http://localhost:8081` in the current local Compose configuration.

The MinIO S3 API is at `http://localhost:9000` and its console at `http://localhost:9001`; sign in using the MinIO credentials from `.env`. Containers reach the S3 API at `http://minio:9000`. Objects persist in the `minio_data` volume. `make storage` starts PostgreSQL and MinIO, and the backend waits for MinIO to become healthy.

The development database can be populated with sample accounts, skills and hackathons. First enable development-only seeding and set the required seed credentials in `.env`, then run:

```bash
make seed
```

The full setup, seed safety checks, troubleshooting and destructive database reset procedure are documented in [Development Setup](docs/DEVELOPMENT_SETUP.md).

### Development commands

| Command                        | Action                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `make help`                    | List all available targets                                                               |
| `make up` / `make down`        | Start or stop the current Compose stack                                                  |
| `make logs` / `make ps`        | Inspect service logs and state                                                           |
| `make migration` / `make seed` | Apply database migrations and seed development data                                      |
| `make migration-generate name=<Name>` | Generate a migration from entity changes (run `make migration` first) |
| `make lint` / `make lint-fix`  | Check or automatically fix supported ESLint errors                                       |
| `make typecheck`               | Typecheck backend and frontend application code                                          |
| `make build`                   | Run NestJS and Vite application builds                                                   |
| `make build-images`            | Build Docker images without starting them                                                |
| `make test`                    | Run backend Jest tests                                                                   |
| `make db-reset`                | **Delete this project's development PostgreSQL data**; see the safety instructions first |

Quality commands using `docker compose exec` require the corresponding containers to be running. Backend `typecheck` currently excludes test source files; Jest runs the tests separately.

## Project layout

```text
HackSpace/
├── frontend/           React + Vite application
├── backend/            NestJS API, TypeORM entities and migrations, seeds
├── infrastructure/     Infrastructure configuration and scripts
├── docs/               Development rules, setup, routes and schema notes
├── .github/workflows/  Pull-request CI
├── docker-compose.yml  Local service orchestration
├── Makefile            Team development commands
└── .env.example        Single shared configuration template
```

## Authentication and permissions

The API uses HTTP-only access-token cookies for authentication. Google and 42 Intra OAuth start at `/auth/oauth/google` and `/auth/oauth/42`, with callbacks under the corresponding `/callback` paths. OAuth redirects use `FRONTEND_URL`.

Hackathon permissions distinguish **global platform roles** from **membership roles**:

- Any authenticated `ROLE_USER` or `ROLE_ADMIN` may create a hackathon; the creator becomes its organiser.
- A hackathon organiser can edit that hackathon.
- A platform `ROLE_ADMIN` may also edit a hackathon without organiser membership.
- The backend must enforce authorisation independently of frontend route protection or the `canEdit` UI flag.

See [Routes](docs/ROUTES.md) for existing frontend and HTTP endpoints. Existing API request and response naming is not yet uniform; the [Development Guidelines](docs/DEVELOPMENT_GUIDELINES.md) describe the agreed conventions for new and standardised code.

## Development workflow and quality

The team works on focused branches and pull requests. Each PR must have **at least one approval from another developer and passing required CI checks** before merging to `main`. Backend and frontend lint/typechecks/builds are validated in GitHub Actions; backend tests run with Jest.

For conventions, architecture rules and review requirements, see [Development Guidelines](docs/DEVELOPMENT_GUIDELINES.md). For conceptual explanations, see [Development Learning Notes](docs/DEVELOPMENT_LEARNING_NOTES.md).

## Database design and API reference

PostgreSQL is the primary persistent store, with TypeORM entities and migration files under `backend/src/database/`. The application models accounts, profiles, roles, OAuth identities, skills, hackathons, phases, settings, memberships and teams.

- [Database schema notes](docs/db_schema.md) — being brought into line with the final schema.
- [API contracts](docs/api_contracts.yml) — currently documents part of the API, not every endpoint.
- [Implemented HTTP routes](docs/ROUTES.md)

## Team and project organisation

The project is developed by five contributors: **Soulaiman, Saad, Aymen, Hatim and Amine**. The team uses Jira to plan and track work, GitHub pull requests for peer review, and a shared definition of done.

**Complete before submission:** add each contributor's verified 42 login and a concise account of their final responsibilities and implemented contributions. Sprint assignments alone should not be presented as proof of completed work.

## 42 subject modules and points

**Complete before submission:** identify the exact selected modules, their mandatory/major/minor classification and point values against the subject version used for evaluation, and explain how each module is implemented. Do not claim points for unimplemented features or infrastructure demonstrations.

## Resources and AI-tool usage

Project development draws on the [NestJS documentation](https://docs.nestjs.com/), [React documentation](https://react.dev/), [TypeORM documentation](https://typeorm.io/), [PostgreSQL documentation](https://www.postgresql.org/docs/) and [Docker Compose documentation](https://docs.docker.com/compose/), as well as the 42 subject.

AI assistance (including ChatGPT) has been used for learning, documentation drafting and code-review support. The team remains responsible for reviewing generated suggestions, understanding their implementation and validating changes with tests. **Before evaluation, document any additional AI-assisted implementation tasks and the corresponding verification performed by contributors.**

## Security and deployment scope

The current Compose environment is for **local development**, using HTTP and development-oriented settings. It is **not a production deployment guide**. Production use requires a verified HTTPS setup, secure cookie configuration, appropriate secrets management and deployment-specific hardening.
