# HackSpace routes and endpoints

This document maps the **current frontend pages** and **backend HTTP endpoints** used during local development. React Router controls frontend navigation; NestJS controllers define backend API routes. They are not interchangeable.

- Application (Caddy): `https://localhost:8443` (`http://localhost:8080` redirects to it)
- Frontend (direct Vite): `http://localhost:5173`
- Backend (direct NestJS): `http://localhost:3000`

## Frontend pages

The following paths are defined in `frontend/src/App.tsx`.

| Path                   | Page                 | Access        | Purpose                                                                         |
| ---------------------- | -------------------- | ------------- | ------------------------------------------------------------------------------- |
| `/`                    | Home                 | Authenticated | Landing page                                                                    |
| `/hackathon-explorer`  | Hackathon Explorer   | Authenticated | Discover, search and filter hackathons                                          |
| `/hackathons`          | Hackathon Management | Authenticated | Administrators see all hackathons; regular users see hackathons they organise   |
| `/hackathons/new`      | Create Hackathon     | Authenticated | Create a hackathon with team and file settings; not restricted to `ROLE_ADMIN`                              |
| `/hackathons/:id` | Hackathon Details | Authenticated | Show hackathon details and phases; edit controls use the backend's `canEdit` flag |
| `/hackathons/:id/edit` | Edit Hackathon       | Authenticated | Edit hackathon details and settings; organiser or platform administrator only |
| `/hackathons/:id/team` | Hackathon Team       | Authenticated | View, create, join or leave teams according to membership rules                 |
| `/profile`             | User Profile         | Authenticated | View and manage the user's profile and skills                                   |
| `/login`               | Login                | Public        | Password sign-in and OAuth initiation                                           |
| `/register`            | Register             | Public        | Account registration                                                            |
| `/verify-otp`          | OTP Verification     | Public        | Email verification                                                              |

Frontend `ProtectedRoute` verifies authentication using `GET /api/auth/me`; access controls in the UI do **not** replace backend permission checks.

## Backend HTTP endpoints

Paths below are listed relative to the backend `/api` prefix. Through the normal local entry point, prepend `/api` to serve them from `https://localhost:8443/api`. **Authenticated** means the endpoint requires a valid authenticated session via `JwtAuthGuard`. Additional permissions can be checked in services.

### Authentication

| Method | Path                          | Access         | Purpose                                           |
| ------ | ----------------------------- | -------------- | ------------------------------------------------- |
| `GET`  | `/`                           | Public         | Application greeting                              |
| `POST` | `/auth/register`              | Public         | Register account and initiate verification        |
| `POST` | `/auth/verify`                | Public         | Verify an email using an OTP                      |
| `POST` | `/auth/resend-code`           | Public         | Request another verification code                 |
| `POST` | `/auth/signin`                | Public         | Sign in and set the HttpOnly `accessToken` cookie |
| `POST` | `/auth/logout`                | Public         | Clear the HttpOnly `accessToken` cookie           |
| `GET`  | `/auth/me`                    | Authenticated  | Return current authenticated user details         |
| `GET`  | `/auth/oauth/google`          | Public         | Begin Google OAuth                                |
| `GET`  | `/auth/oauth/google/callback` | OAuth callback | Finish Google OAuth and redirect                  |
| `GET`  | `/auth/oauth/42`              | Public         | Begin 42 Intra OAuth                              |
| `GET`  | `/auth/oauth/42/callback`     | OAuth callback | Finish 42 Intra OAuth and redirect                |

### Hackathons

| Method   | Path                            | Access                                     | Purpose                                                          |
| -------- | ------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `GET`    | `/hackathons`                   | Authenticated                              | List and filter hackathons                                       |
| `GET`    | `/hackathons/mine`              | Authenticated                              | List hackathons where the user is an `ORGANIZER`                 |
| `GET`    | `/hackathons/:id`               | Authenticated                              | Retrieve details, settings, and the `canEdit` flag                    |
| `GET`    | `/hackathons/:id/current-phase` | Authenticated                              | Get the current hackathon phase                                  |
| `POST`   | `/hackathons`                   | Authenticated                              | Create a hackathon with default/custom settings; creator becomes `ORGANIZER` |
| `PATCH`  | `/hackathons/:id`               | `ORGANIZER` or `ROLE_ADMIN`                | Edit details/settings; `409` if proposed maximum is below an existing team size                   |
| `POST`   | `/hackathons/:id/register`      | Authenticated; phase and membership checks | Register to participate                                          |
| `DELETE` | `/hackathons/:id/unregister`    | Authenticated; membership checks           | Unregister from a hackathon                                      |
| `GET`    | `/hackathons/:id/membership`    | Authenticated                              | Get the current user's hackathon membership                      |

Hackathon settings use camelCase in JSON: `minTeamMembers`, `maxTeamMembers`,
`filesLimit`, and `fileMaxSize` (bytes). Defaults are 1, 5, 1, and 10485760
respectively; the frontend presents file sizes in MiB. File limits must be at
least 1, and `minTeamMembers` cannot exceed `maxTeamMembers`. Settings updates
can be partial. New maximum team sizes cannot be below an existing team's
membership count; the minimum team size is checked at submission time.

**Platform and hackathon roles are distinct.** Any authenticated `ROLE_USER` or `ROLE_ADMIN` may create a hackathon. A user may edit a hackathon if they are an `ORGANIZER` for it, or if their platform role is `ROLE_ADMIN`. The edit rule is enforced by `HackathonsService.canEditHackathon()`. Lack of valid authentication normally produces `401`; a denied update produces `403`.

### Teams

| Method   | Path                                | Access                               | Purpose                                      |
| -------- | ----------------------------------- | ------------------------------------ | -------------------------------------------- |
| `POST`   | `/hackathons/:hackathonId/teams`    | Authenticated registered participant | Create a team and join as its first member   |
| `GET`    | `/hackathons/:hackathonId/teams`    | Authenticated                        | List teams and their member counts           |
| `GET`    | `/hackathons/:hackathonId/teams/me` | Authenticated                        | Get the user's team in the hackathon, if any |
| `GET`    | `/teams/:id`                        | Authenticated                        | Get a team with its members                  |
| `POST`   | `/teams/:id/join`                   | Authenticated registered participant | Join an eligible team                        |
| `DELETE` | `/teams/:id/leave`                  | Authenticated team member            | Leave a team                                 |

Team operations also enforce applicable constraints on membership, team capacity and hackathon state within `TeamsService`.

### Chat history

| Method | Path                              | Access              | Purpose                         |
| ------ | --------------------------------- | ------------------- | ------------------------------- |
| `GET`  | `/chat-rooms/:chatRoomId/messages` | Authenticated member | Load persisted team chat history |

The chat history endpoint returns messages in ascending `sentAt` order. Each message contains only the fields needed by the frontend:

```json
{
  "id": 1,
  "content": "Hello team",
  "sentAt": "2026-11-16T12:00:00.000Z",
  "sender": {
    "id": 7,
    "username": "example"
  }
}
```

Authentication alone is not sufficient: the authenticated user must be a member of the requested chat room. A non-member receives `403`.

## Socket.IO chat protocol

Socket.IO uses the `/chat` namespace. Through the normal local Caddy entry point, the Socket.IO transport is proxied at `/socket.io/*`; the browser connects to the HTTPS application origin with credentials so the `accessToken` cookie is available during the handshake.

### Connection authentication

The gateway verifies the `accessToken` cookie during the Socket.IO handshake. If the cookie is missing or invalid, the connection is rejected. A connected socket still must join an individual room before it can receive team messages.

### Client-to-server events

| Event        | Payload                         | Acknowledgement                                      | Purpose                                      |
| ------------ | ------------------------------- | ---------------------------------------------------- | -------------------------------------------- |
| `join-chat`  | `{ chatRoomId: number }`         | `{ success: boolean, error?: string }`               | Verify membership and join `chat:<chatRoomId>` |
| `send-message` | `{ chatRoomId: number, content: string }` | `{ success: boolean, message?: Message, error?: string }` | Validate, persist and broadcast a message |

The frontend applies a five-second timeout to acknowledgement-based events. Timeout errors are separate from a server response with `success: false` and must be handled separately.

### Server-to-client events

| Event         | Payload   | Recipients                              | Purpose                         |
| ------------- | --------- | --------------------------------------- | ------------------------------- |
| `new-message` | `Message` | Members of `chat:<chatRoomId>`          | Deliver a persisted live message |

`Message` has the same shape as the HTTP history response:

```ts
type Message = {
  id: number;
  content: string;
  sentAt: string;
  sender: {
    id: number;
    username: string;
  };
};
```

The backend obtains the sender identity from the verified JWT rather than trusting a user ID supplied by the browser. The sender relation is loaded with `id` and `username` before the live message is emitted.

### Profiles and skills

| Method   | Path                          | Access                                         | Purpose                                                      |
| -------- | ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `GET`    | `/users/me/profile`           | Authenticated                                  | Read own profile                                             |
| `POST`   | `/users/me/profile`           | Authenticated                                  | Create own profile                                           |
| `PATCH`  | `/users/me/profile`           | Authenticated                                  | Update own profile                                           |
| `GET`    | `/skills`                     | Authenticated                                  | List skills                                                  |
| `GET`    | `/skills/by-name`             | Authenticated                                  | Look up a skill by name                                      |
| `POST`   | `/skills`                     | Authenticated; profile ownership if applicable | Find/create skill and optionally associate it with a profile |
| `POST`   | `/skills/batch`               | Authenticated; profile ownership if applicable | Add multiple skills                                          |
| `GET`    | `/skills/profiles/:profileId` | Authenticated                                  | List a profile's skills                                      |
| `DELETE` | `/skills/profiles/:profileId` | Profile owner or `ROLE_ADMIN`                  | Remove profile-skill associations                            |
| `GET`    | `/skills/:id`                 | Authenticated                                  | Get a skill by ID                                            |
| `PATCH`  | `/skills/:id`                 | `ROLE_ADMIN`                                   | Update catalogue skill metadata                              |
| `DELETE` | `/skills/:id`                 | `ROLE_ADMIN`                                   | Delete a catalogue skill                                     |

These skill-specific permissions are enforced in `SkillsService`, including the administrative override for editing another user's profile-skill associations.

## Frontend-to-API mapping

| Frontend page                        | Main backend endpoints                                           |
| ------------------------------------ | ---------------------------------------------------------------- |
| `/hackathon-explorer`                | `GET /hackathons`, `GET /hackathons/:id`                         |
| `/hackathons`                        | `GET /hackathons` (admin), `GET /hackathons/mine` (regular user) |
| `/hackathons/new`                    | `POST /hackathons`                                               |
| `/hackathons/:id`                    | `GET /hackathons/:id`, membership and registration endpoints     |
| `/hackathons/:id/edit`               | `GET /hackathons/:id`, `PATCH /hackathons/:id`                   |
| `/hackathons/:id/team`               | Team listing, current team, create, join and leave endpoints     |
| `/profile`                           | `/users/me/profile` and `/skills` endpoints                      |
| `/login`, `/register`, `/verify-otp` | `/auth` endpoints                                                |

## Local development tools

| URL                         | Purpose                          |
| --------------------------- | -------------------------------- |
| `https://localhost:8443/api/docs` | Swagger UI                       |
| `http://localhost:5173`     | Frontend application             |
| `http://localhost:8081`     | Adminer, when enabled in Compose |

For local setup and environment variables, see [Development Setup](./DEVELOPMENT_SETUP.md). For coding standards and permissions, see [Development Guidelines](./DEVELOPMENT_GUIDELINES.md).

**API contract:** HackSpace application request and response fields now use `camelCase`, while PostgreSQL columns remain `snake_case`. See [API Contracts](./api_contracts.yml) for current payload schemas. Application endpoints use the `/api` prefix; the interactive Swagger UI is hosted at `/api/docs`.
