# HackSpace routes and endpoints

This document maps the **frontend pages** and **backend HTTP endpoints** used during local development. These routes are separate: React Router controls frontend navigation; NestJS controllers define HTTP API endpoints.

- Frontend (Vite): http://localhost:5173
- Backend (NestJS): http://localhost:3000

## Frontend pages

| Path                  | Page                     | Access    | Notes                                                                            |
| --------------------- | ------------------------ | --------- | -------------------------------------------------------------------------------- |
| `/`                   | Home                     | Protected | Authenticated landing page; placeholder content                                  |
| `/admin/hackathons`   | Hackathon administration | Admin     | Create and edit hackathons; uses backend management APIs                         |
| `/hackathon-explorer` | Hackathon Explorer       | Protected | Discover, search and filter hackathons                                           |
| `/hackathons/:id`     | Hackathon details        | Protected | View a hackathon's details; edit controls depend on the `canEdit` response field |
| `/hackathons/:id/team` | Hackathon team | Protected | Shows the user's team, or a form to create one if they are a registered participant |
| `/login`              | Login                    | Public    | Password login plus Google and 42 Intra OAuth                                    |
| `/register`           | Register                 | Public    | Account registration                                                             |
| `/verify-otp`         | OTP verification         | Public    | Email verification after registration or an unverified login                     |

**Removed frontend route:** `/hackathons`. This does **not** remove the backend `/hackathons` API.

## Backend HTTP endpoints

All paths below are relative to `http://localhost:3000`.

| Method  | Path                          | Auth           | Purpose                                                    |
| ------- | ----------------------------- | -------------- | ---------------------------------------------------------- |
| `GET`   | `/`                           | Public         | Backend health/greeting response                           |
| `POST`  | `/auth/register`              | Public         | Register an account and send a verification code           |
| `POST`  | `/auth/verify`                | Public         | Verify email with an OTP                                   |
| `POST`  | `/auth/resend-code`           | Public         | Send a new email verification code                         |
| `POST`  | `/auth/signin`                | Public         | Sign in with username/email and password                   |
| `GET`   | `/auth/me`                    | Authenticated  | Return the authenticated user                              |
| `GET`   | `/auth/oauth/google`          | Public         | Start Google OAuth                                         |
| `GET`   | `/auth/oauth/google/callback` | OAuth callback | Complete Google OAuth and redirect                         |
| `GET`   | `/auth/oauth/42`              | Public         | Start 42 Intra OAuth                                       |
| `GET`   | `/auth/oauth/42/callback`     | OAuth callback | Complete 42 Intra OAuth and redirect                       |
| `GET`   | `/hackathons`                 | Authenticated  | List hackathons; supports search, dates, phase, pagination |
| `GET`   | `/hackathons/:id`             | Authenticated  | Retrieve hackathon by ID, including the `canEdit` field    |
| `POST`  | `/hackathons`                 | `ROLE_ADMIN`   | Create hackathon and its default settings                  |
| `PATCH` | `/hackathons/:id`             | `ROLE_ADMIN`   | Update supported hackathon properties                      |
| `POST`  | `/hackathons/:hackathonId/teams` | Registered participant | Create a team; the creator becomes its first member |
| `GET`   | `/hackathons/:hackathonId/teams/me` | Authenticated | Return the user's team in this hackathon, or `{ team: null }` |
| `GET`   | `/teams/:id` | Authenticated | Retrieve a team with its members and size limits |
| `GET`   | `/demo/greetings`             | Public         | Demo endpoint for stored Kafka greetings                   |
| `POST`  | `/demo/send-name`             | Public         | Send a name to the demo Kafka topic                        |

The hackathon endpoints use `JwtAuthGuard`. POST and PATCH additionally use `RolesGuard` with `ROLE_ADMIN`. Unauthenticated requests return `401`; authenticated non-admin users attempting protected admin operations return `403`.

## Frontend and API mapping

| Frontend page         | Backend endpoint(s)                                                                   |
| --------------------- | ------------------------------------------------------------------------------------- |
| `/hackathon-explorer` | `GET /hackathons`, `GET /hackathons/:id`                                              |
| `/hackathons/:id`     | `GET /hackathons/:id`                                                                 |
| `/hackathons/:id/team` | `GET /hackathons/:hackathonId/teams/me`, `POST /hackathons/:hackathonId/teams` |
| `/admin/hackathons`   | `GET /hackathons`, `GET /hackathons/:id`, `POST /hackathons`, `PATCH /hackathons/:id` |

**RBAC HTTP tests:** `hackathons.rbac.spec.ts` should continue to request `/hackathons` and `/hackathons/:id`. It tests backend endpoints, not frontend pages.

## Development tools and integrations

| URL                                     | Purpose                             |
| --------------------------------------- | ----------------------------------- |
| http://localhost:3000/api               | Swagger UI (when enabled in NestJS) |
| http://localhost:5173                   | React/Vite frontend                 |
| http://localhost:8081                   | Adminer database interface          |
| http://localhost:8080                   | Kafka UI                            |
| http://localhost:3000/auth/oauth/google | Google OAuth start URL              |
| http://localhost:3000/auth/oauth/42     | 42 Intra OAuth start URL            |

OAuth provider credentials and callback URLs are configured in the backend environment. The frontend initiates redirects; the backend handles OAuth tokens and the HttpOnly `accessToken` cookie.

> Auth and demo endpoint descriptions above are retained from the existing route map; the new hackathon endpoint details match the provided `HackathonsController`.
