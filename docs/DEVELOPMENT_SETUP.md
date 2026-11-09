# HackSpace Development Setup

This guide covers local development with Docker Compose, PostgreSQL, the development seed data and the repository's Makefile commands. Coding conventions and review rules live in [Development Guidelines](./DEVELOPMENT_GUIDELINES.md).

## 1. Prerequisites

- Docker Engine with the Docker Compose v2 plugin (`docker compose`).
- GNU Make.
- Git and access to the HackSpace repository.

Application dependencies are installed inside the Docker containers. A local Node.js or Python installation is not required for the documented Makefile workflow.

## 2. Configure the environment

HackSpace uses **one local environment file**, `.env` at the repository root, and one committed template, `.env.example`. From the repository root:

```bash
cp .env.example .env
```

Configure `POSTGRES_PASSWORD` and `JWT_SECRET` in the root `.env`. Add `MAIL_USER` and `MAIL_PASS` there when testing email verification, and fill in the relevant OAuth credentials if needed. Set `VITE_API_BASE_URL` for frontend API requests and `FRONTEND_URL` for backend OAuth redirects; the example defaults are `http://localhost:3000` and `http://localhost:5173` respectively.

**Do not create** `backend/.env` or `frontend/.env` for the Compose workflow. If you already have those files, first copy any still-needed values into the root `.env`, then delete the redundant local files. Remove the tracked `backend/.env.example` and `frontend/.env.example` templates as part of this consolidation PR after transferring all required example variables into the root `.env.example`.

The Makefile provides `--env-file .env` to Docker Compose. Compose uses it to resolve `${...}` expressions in `docker-compose.yml`. The backend also receive the root file through its `env_file` settings. The frontend receives **only** the browser-safe `VITE_API_BASE_URL` setting through `environment`, so database, JWT, OAuth and mail secrets are not unnecessarily injected into its container. Never put a secret in a `VITE_` variable: Vite can expose these values in client-side code.

These instructions cover the **Docker Compose workflow**. Starting NestJS or Vite directly outside Docker may require loading the root `.env` into that process separately.

The seed runner only runs in a development environment. To use it, configure the root `.env` with:

```dotenv
NODE_ENV=development
SEED_DEV_DATA=true
SEED_EXPECTED_DB=transcendence
SEED_ADMIN_PASSWORD=<development-password-of-at-least-12-characters>
SEED_USER_PASSWORD=<development-password-of-at-least-12-characters>
```

`SEED_EXPECTED_DB` must exactly match `POSTGRES_DB`; the seed runner also checks the database host and rejects names that look like staging or production databases. Use development-only credentials. **Never commit the local `.env` or any secrets.**

## 3. Start HackSpace

```bash
make up
make ps
```

`make up` builds and starts the currently configured Docker Compose stack. The local application endpoints in the checked-in Compose configuration are:

| Service    | Local address           |
| ---------- | ----------------------- |
| Frontend   | `http://localhost:5173` |
| Backend    | `http://localhost:3000` |
| PostgreSQL | `localhost:5432`        |
| Adminer    | `http://localhost:8081` |

These are **local development** addresses, not production HTTPS endpoints. Other enabled services and ports are defined in `docker-compose.yml`.

For container status and logs:

```bash
make ps
make logs
```

`make logs` follows all container logs; use `Ctrl+C` to stop following them.

## 4. Apply migrations and seed development data

Run migrations **before** the seed script:

```bash
make migration
make seed
```

The seed currently creates, on an empty migrated database:

- Seven verified development accounts: `dev_admin`, `dev_user` and `dev_user_1` through `dev_user_5`.
- A profile for each account.
- 100 catalogue skills and five skill assignments for each numbered development user (25 assignments in total).
- 200 sample hackathons, their settings and scheduled phases (1,000 phases in total).

The administrator account uses `SEED_ADMIN_PASSWORD`; the other accounts use `SEED_USER_PASSWORD`. The seed transaction runs users, skills and hackathons in order. Reruns are designed to fill missing seeded records rather than replace existing data, but conflicting accounts or roles cause the transaction to fail.

To access the PostgreSQL command-line client through Docker:

```bash
make db
```

## 5. Common development commands

Run Makefile targets from the **repository root**.

| Command                    | Behaviour                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `make help`                | Show the available targets                                                                                                                |
| `make up`                  | Build and start the configured Compose stack                                                                                              |
| `make down`                | Stop and remove Compose containers without deliberately removing the database volume                                                      |
| `make start` / `make stop` | Start or stop existing containers                                                                                                         |
| `make re`                  | Bring the stack down, then rebuild and restart it                                                                                         |
| `make ps`                  | Show container status                                                                                                                     |
| `make logs`                | Follow Compose logs                                                                                                                       |
| `make storage`             | Start PostgreSQL                                                                                                                          |
| `make backend`             | Start the backend and its configured Compose dependencies                                                                                 |
| `make frontend`            | Start the frontend and PostgreSQL                                                                                                         |
| `make db`                  | Open a PostgreSQL command-line session                                                                                                    |
| `make migration`           | Apply TypeORM migrations                                                                                                                  |
| `make migration-generate name=<Name>` | Generate a migration from the differences between entities and the database (run `make migration` first) |
| `make seed`                | Run the development seed script                                                                                                           |
| `make db-reset`            | **Destructive:** stop the active Compose stack and remove only its `db_data` PostgreSQL volume (selected using project and volume labels) |
| `make lint`                | Check backend and frontend with ESLint                                                                                                    |
| `make lint-fix`            | Apply supported ESLint fixes to both applications                                                                                         |
| `make typecheck`           | Check backend and frontend application TypeScript                                                                                         |
| `make build`               | Run the NestJS and Vite application builds                                                                                                |
| `make build-images`        | Build Docker images, **not** application bundles                                                                                          |
| `make test`                | Run the backend Jest test suite                                                                                                           |

The scripts invoked by `make lint`, `make lint-fix`, `make typecheck`, `make build` and `make test` use `docker compose exec`, so the corresponding containers **must already be running**. `make build-images` does not require them to be running.

The frontend and backend expose the same `typecheck` script name, but use different TypeScript configurations. The backend application check excludes `*.spec.ts`; Jest runs test files separately. Refer to the guidelines for quality-gate expectations.

## 6. Reset the development database

**Destructive operation:** this deletes local development PostgreSQL data. The reset target now selects the `db_data` volume using **both** the active Docker Compose project name and the `com.docker.compose.volume=db_data` label. It prints the selected project and volume before deletion. Do not run against valuable, shared, staging or production data. This target has not yet been exercised against your local Docker installation; verify it on your machine before relying on it for the team reset.

```bash
make db-reset
make up
make migration
make seed
```

Resetting is appropriate only when the team has agreed that existing local data can be discarded, such as after coordinated development migration changes.

## 7. Troubleshooting

- **`service ... is not running`** when executing a quality command: run `make up`, then retry the command.
- **Seed refuses to run:** check `NODE_ENV=development`, `SEED_DEV_DATA=true`, `POSTGRES_DB`, `SEED_EXPECTED_DB`, `POSTGRES_HOST` and the seed passwords in the root `.env`.
- **Missing tables or roles during seeding:** run `make migration` first.
- **`migration-generate` reports no changes:** the entities already match the database; apply pending migrations with `make migration` and check that your entity change was saved.
- **Port already allocated:** identify the conflicting local service before changing Compose port mappings; coordinate changes so other developers know the required values.
- **Changed dependencies not visible inside a container:** rebuild/recreate the affected service so the container installs the updated package manifest.

For repository conventions, permissions and review requirements, see [Development Guidelines](./DEVELOPMENT_GUIDELINES.md). For current HTTP routes, see [Routes](./ROUTES.md).
