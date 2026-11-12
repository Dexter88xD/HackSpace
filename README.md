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

MinIO runs as local object storage using a Chainguard image pinned by immutable digest. The backend uploads files through an S3 file manager strategy. Caddy is enabled in the development stack as the local HTTPS reverse proxy; it routes `/api/*` to the backend and other requests to the frontend.

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

Fill in the required development values, including `POSTGRES_PASSWORD`, `JWT_SECRET`, and `MINIO_ROOT_PASSWORD` (at least 8 characters). `MINIO_ROOT_USER` must contain at least 3 characters. Configure SMTP credentials for email verification and provider credentials when testing OAuth. The frontend uses the same-origin `/api` path through Caddy; any `VITE_` variable is browser-visible and **must not contain secrets**. Do not commit `.env`; use `.env.example` for safe placeholder values only.

### Start the application

```bash
make up
make ps
make migration
```

Open the application at `https://localhost` through Caddy. The browser may show a certificate warning because the local Caddy configuration uses an internally generated certificate. The frontend and backend are also exposed directly at `http://localhost:5173` and `http://localhost:3000` for development diagnostics; Adminer is available at `http://localhost:8081`.

Caddy exposes the MinIO S3 API at `https://minio.localhost` and its console at `https://console.minio.localhost`. Direct diagnostic access remains available at `http://localhost:9000` (API) and `http://localhost:9001` (console); sign in using the MinIO credentials from `.env`. Containers reach the S3 API at `http://minio:9000`. Objects persist in the `minio_data` volume. `make storage` starts PostgreSQL and MinIO, and the backend waits for MinIO to become healthy.

The backend uses `MINIO_ENDPOINT` (default `http://minio:9000`) and the existing `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` credentials. When running the backend outside Docker, set `MINIO_ENDPOINT=http://localhost:9000` in its environment.

Upload with `curl -F 'file=@./example.txt' -F 'bucket=uploads' https://localhost/api/files/upload`. The optional `bucket` field defaults to `default`; missing buckets are created automatically. Each upload uses a fresh UUID as its database ID and `<uuid><original extension>` as its object key, while the original filename is preserved in metadata. Repeated uploads of the same filename are stored separately. A successful request returns `{ "url": "<signed download URL>" }`, valid for one hour and usable in an image's `src`. This demonstration endpoint is unauthenticated; bucket contents remain private.

Set `MINIO_PUBLIC_ENDPOINT=https://minio.localhost` to sign browser-facing HTTPS URLs. `MINIO_API_DOMAIN=minio.localhost` and `MINIO_CONSOLE_DOMAIN=console.minio.localhost` configure Caddy's site names; Compose sets MinIO's console redirect URL from `MINIO_CONSOLE_DOMAIN`. This is used when signing download URLs; `MINIO_ENDPOINT` continues to handle uploads inside Docker. For deployment, use an HTTPS endpoint reachable by your users. Do not replace the hostname in a signed URL after generating it.

MinIO's S3 API is proxied at its hostname's root so request paths, query strings, and Host headers remain valid for signatures. The console uses its own hostname and retains MinIO authentication. After changing these settings, run `docker compose up -d --force-recreate backend minio caddy`.

Trust Caddy's existing local CA certificate in your operating system/browser for all three HTTPS sites. You can extract it with `docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt /tmp/hackspace-caddy-root.crt` and use `curl --cacert /tmp/hackspace-caddy-root.crt https://minio.localhost/minio/health/live`. If your machine does not resolve the MinIO hostnames to loopback automatically, add `127.0.0.1 minio.localhost console.minio.localhost` to your hosts file. For a one-off curl check, use `--resolve minio.localhost:443:127.0.0.1`.

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

The API uses HTTP-only access-token cookies for authentication. Through the local Caddy entry point, Google and 42 Intra OAuth start at `/api/auth/oauth/google` and `/api/auth/oauth/42`, with callbacks under the corresponding `/callback` paths. OAuth redirects use `FRONTEND_URL`.

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

The current Compose environment is for **local development**, using Caddy's local HTTPS certificate and development-oriented settings. It is **not a production deployment guide**. Production use requires a verified HTTPS setup, secure cookie configuration, appropriate secrets management and deployment-specific hardening.

File metadata is stored in the `files` table after a successful upload. Run the TypeORM migrations before using this endpoint. Allowed extensions are PDF, DOCX, PPTX, TXT, CSV, JPG/JPEG, and PNG, with matching declared MIME types; file contents are not inspected. Optional multipart `hackathonId` and `teamId` fields link files to existing records. A team determines its hackathon, and conflicting IDs are rejected. The stored metadata URL is unsigned; the response URL is signed for one hour.

Delete a stored file with `DELETE /files/<uuid>` (204 on success, 404 if absent). The file manager removes the storage object first, then its database row. Storage failures retain metadata; database failures after storage deletion are returned to the caller, allowing a retry to finish removing the row. Deletion uses the existing unauthenticated demonstration files controller.

`MAX_FILE_UPLOAD_BYTES` sets the maximum upload size in bytes (default `10485760`, or 10 MiB). It must be a positive integer. The file manager rejects larger buffers with HTTP 413 before storage or metadata operations; files exactly at the limit are accepted.
