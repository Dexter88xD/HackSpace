_This project has been created as part of the 42 curriculum by hqannouc, aait-our, sel-maaq, aedarkao, sohamdan._

# HackSpace

HackSpace is a web platform for organising and participating in hackathons. Users can create and manage hackathons, discover events, manage profiles and skills, register for hackathons and form teams. The application is developed as the 42 **ft_transcendence** team project.

This repository is a Docker Compose monorepo containing a React/TypeScript frontend, a NestJS API and a PostgreSQL database. The backend uses TypeORM migrations rather than automatic schema synchronisation.

## Implemented functionality

- **Identity:** registration, email verification, sign-in, authenticated account lookup, Google OAuth and 42 Intra OAuth.
- **Profiles and skills:** profile creation/editing, skills catalogue, profile-skill assignments and catalogue management permissions.
- **Hackathons:** creation, exploration with filters, details, current phase, management listing, editing, registration, unregistration and membership lookup.
- **Lifecycle views:** responsive five-phase timeline, phase-specific information and actions, automatic schedule refresh, and completed-event results.
- **Teams:** create and edit teams, browse teams, request membership, accept/reject/cancel join requests, remove members and leave teams subject to phase and submission restrictions.
- **Submissions:** upload, download and delete project files using private object storage; submit or reopen a project during `IN_PROGRESS` subject to team size and file limits.
- **Jury and rankings:** assign judges, manage scoring criteria before their respective deadlines, evaluate finalized submissions, preview rankings as management during evaluation, and publish rankings to authenticated users when evaluation ends.
- **Team chat:** authenticated team members can load chat history over HTTP and exchange live messages through a Socket.IO WebSocket namespace.
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

Fill in the required development values, including `POSTGRES_PASSWORD`, `JWT_SECRET`, `MINIO_ROOT_PASSWORD` (at least 8 characters), and a distinct `MINIO_SECRET_KEY` (generate with `openssl rand -hex 32`). `MINIO_ROOT_USER` must contain at least 3 characters. Configure SMTP credentials for email verification and provider credentials when testing OAuth. The frontend uses the same-origin `/api` path through Caddy; any `VITE_` variable is browser-visible and **must not contain secrets**. Do not commit `.env`; use `.env.example` for safe placeholder values only.

### Start the application

```bash
make up
make ps
make migration
```

Open the application at `https://localhost:8443` through Caddy (`http://localhost:8080` redirects there). The browser may show a certificate warning because the local Caddy configuration uses an internally generated certificate. The frontend and backend are also exposed directly at `http://localhost:5173` and `http://localhost:3000` for development diagnostics; Adminer is available at `http://localhost:8081`.

Caddy exposes the MinIO S3 API at `https://minio.localhost:8443` and its console at `https://console.minio.localhost:8443`. Ports 9000 and 9001 are not published on the host. Containers reach storage at `http://minio:9000`; browser and host access uses Caddy HTTPS. Objects persist in the `minio_data` volume.

`make storage` starts PostgreSQL, MinIO, and the one-shot `minio-init` provisioning service. Provisioning creates the four private application buckets (`default`, `avatar`, `submission`, and `hackathon`) and the `MINIO_ACCESS_KEY` identity with `MINIO_SECRET_KEY`. Its policy permits object read/write/delete and bucket listing/location checks only in those buckets; it cannot administer MinIO or create/delete buckets. Root credentials are supplied only to MinIO and provisioning. The backend receives an explicit application environment allowlist and uses only the restricted credentials. It verifies bucket access at startup; it does not provision storage.

The generic `/api/files/upload` and `/api/files/:id` testing endpoints have been removed. Files are managed through authenticated feature endpoints. Each upload gets a UUID and an object key persisted as `storedName`; the original filename is preserved as `name`. Signed download URLs expire after one hour. For running a backend outside Docker, configure a reachable, trusted HTTPS MinIO endpoint and use the restricted application credentials.

Set `MINIO_PUBLIC_ENDPOINT=https://minio.localhost:8443` to sign browser-facing HTTPS URLs. `MINIO_API_DOMAIN=minio.localhost` and `MINIO_CONSOLE_DOMAIN=console.minio.localhost` configure Caddy's site names; Compose sets MinIO's console redirect URL from `MINIO_CONSOLE_DOMAIN`. This is used when signing download URLs; `MINIO_ENDPOINT` continues to handle uploads inside Docker. For deployment, use an HTTPS endpoint reachable by your users. Do not replace the hostname in a signed URL after generating it.

Profile avatars use authenticated `POST /api/users/me/profile/avatar` (multipart `file`, JPG/PNG), returning a signed URL string, and `DELETE /api/users/me/profile/avatar` (204, including when no avatar exists). Uploading replaces the profile reference before deleting the previous file. Failed replacement saves clean up the new upload; cleanup failures are logged with the file ID. Profile responses include `avatarFileId` and `avatarUrl`; profile create/update accepts only profile fields, with avatar changes handled through the dedicated endpoints. The profile header provides upload and removal controls. It displays avatars through authenticated `GET /api/users/me/profile/avatar`, which streams the current image through the same app hostname with private, non-cacheable responses. Browser image display therefore does not require access to the MinIO hostname or trusting its certificate separately. Signed URLs remain available in profile and upload responses.

The `StoreFileObjectNames1795000000003` migration preserves existing object keys from file URLs without moving objects. Its rollback reconstructs URLs using `MINIO_PUBLIC_ENDPOINT`, which must be configured.

MinIO's S3 API is proxied at its hostname's root so request paths, query strings, and Host headers remain valid for signatures. The console uses its own hostname and retains MinIO authentication. After changing these settings, run `docker compose up -d --force-recreate backend minio caddy`.

Trust Caddy's existing local CA certificate in your operating system/browser for all three HTTPS sites. You can extract it with `docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt /tmp/hackspace-caddy-root.crt` and use `curl --cacert /tmp/hackspace-caddy-root.crt https://minio.localhost:8443/minio/health/live`. If your machine does not resolve the MinIO hostnames to loopback automatically, add `127.0.0.1 minio.localhost console.minio.localhost` to your hosts file. For a one-off curl check, use `--resolve minio.localhost:8443:127.0.0.1`.

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

## Team chat and WebSockets

Team chat uses two transports:

- `GET /api/chat-rooms/:chatRoomId/messages` loads persisted message history.
- Socket.IO namespace `/chat` handles room membership and live messages.

The local Caddy entry point proxies Socket.IO traffic at `/socket.io/*` to the backend. The browser-facing development connection is therefore created from the HTTPS application origin, for example:

```ts
io("https://localhost/chat", {
  withCredentials: true,
  transports: ["websocket"],
});
```

The `accessToken` HTTP-only cookie is used during the Socket.IO handshake. The gateway verifies it before accepting the connection. Connecting to the `/chat` namespace does not grant access to every team room: the client must emit `join-chat`, and the backend verifies chat membership before joining `chat:<chatRoomId>`.

The live event flow is:

1. Client emits `join-chat` with `{ chatRoomId }`; the server acknowledges success or failure.
2. Client emits `send-message` with `{ chatRoomId, content }`; the server validates membership, persists the message and acknowledges the result.
3. The server broadcasts `new-message` to the room `chat:<chatRoomId>`.
4. Room members update their cached message list.

Socket acknowledgements use a five-second client timeout. The client must handle both a server response (`success: true` or `success: false`) and a timeout error.

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

File metadata is stored in the `files` table with a persistent object key, not a URL. Run migrations before using avatar endpoints. The internal file manager accepts PDF, DOCX, PPTX, TXT, CSV, JPG/JPEG, and PNG with matching declared MIME types; it does not inspect file contents. Avatar endpoints accept JPG/PNG and always resolve the authenticated user's own profile. Future file endpoints must implement their own ownership or team/hackathon authorization before calling the file manager.

Deletion removes the storage object before its database row. Storage failures retain metadata for retry; database failures after object deletion can be retried to finish removing metadata. No generic file upload or delete route is exposed.

`MAX_FILE_UPLOAD_BYTES` sets the maximum upload size in bytes (default `10485760`, or 10 MiB). It must be a positive integer. Multer rejects oversized multipart uploads with HTTP 413 while processing the request, before calling the file manager. The file manager also checks buffer size for direct callers. Files exactly at the limit are accepted.

Profile avatars are stored as a nullable one-to-one relation to a JPG/PNG `StoredFile`, with `avatar_file_id` on `user_profiles`. Avatar changes use the authenticated upload/delete endpoints; ordinary profile writes do not accept avatar fields. Responses include `avatarFileId` and a freshly signed `avatarUrl`; the profile UI displays images through the authenticated same-origin streaming endpoint. Deleting a file clears its avatar reference.

The bucket/avatar migration was generated with TypeORM against a disposable database built from existing migrations, then reviewed to replace destructive column conversions with backfilling and data-preserving casts. It refuses to proceed if files use non-default buckets, avatar matches are ambiguous, or multiple profiles would share one file. Matching JPG/PNG avatar URLs (ignoring query strings) are linked; unmatched URLs are cleared. Rollback restores linked unsigned URLs, but cannot recover cleared unmatched URLs. Apply it with `make migration` after resolving these preconditions; implementation validation does not migrate the application database.
