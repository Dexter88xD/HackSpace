# HackSpace routes and endpoints

This document maps the **current frontend pages** and **backend HTTP endpoints** used during local development. React Router controls frontend navigation; NestJS controllers define backend API routes. They are not interchangeable.

- Application (Caddy): `https://localhost:8443` (`http://localhost:8080` redirects to it)
- Frontend (direct Vite): `http://localhost:5173`
- Backend (direct NestJS): `http://localhost:3000`

## Frontend pages

The following paths are defined in `frontend/src/App.tsx`.

| Path                   | Page                 | Access        | Purpose                                                                         |
| ---------------------- | -------------------- | ------------- | ------------------------------------------------------------------------------- |
| `/`                    | Landing / Home       | Public        | Public landing for guests; personalised home for authenticated users; session loading/error states |
| `/hackathon-explorer`  | Hackathon Explorer   | Authenticated | Discover, search and filter hackathons                                          |
| `/hackathons`          | Hackathon Management | Authenticated | Administrators see all hackathons; regular users see hackathons they organise   |
| `/hackathons/new`      | Create Hackathon     | Authenticated | Create a hackathon with team and file settings; not restricted to `ROLE_ADMIN`                              |
| `/hackathons/:id` | Hackathon Details | Authenticated | Show hackathon details and phases; edit controls use the backend's `canEdit` flag |
| `/hackathons/:id/edit` | Edit Hackathon       | Authenticated | Edit hackathon details and settings; organiser or platform administrator only |
| `/hackathons/:id/team` | Hackathon Team       | Authenticated | Manage team membership and the team's submission                               |
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

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/hackathons` | Authenticated | List, filter and sort hackathons; supports `upcomingOnly=true` for events whose start time is strictly in the future |
| `GET` | `/hackathons/mine` | Authenticated | List hackathons where the user is an `ORGANIZER` |
| `GET` | `/hackathons/:id` | Authenticated | Retrieve details, settings, and the `canEdit` flag |
| `GET` | `/hackathons/:id/current-phase` | Authenticated | Get the current hackathon phase |
| `POST` | `/hackathons` | Authenticated | Create a hackathon with default/custom settings; creator becomes `ORGANIZER` |
| `PATCH` | `/hackathons/:id` | `ORGANIZER` or `ROLE_ADMIN` | Edit details/settings; `409` if proposed maximum is below an existing team size |
| `POST` | `/hackathons/:id/register` | Authenticated; phase and membership checks | Register to participate |
| `DELETE` | `/hackathons/:id/unregister` | Authenticated; membership checks | Unregister from a hackathon |
| `GET` | `/hackathons/:id/membership` | Authenticated | Get the current user's hackathon membership |

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

### Team submissions

All routes require authentication. Mutations require membership in the specified team. The two GET routes also allow a judge assigned to the same hackathon to read or download a finalised submission during active `EVALUATION`. `:teamId` is the team ID, and `:fileId` is the UUID of a file in that team's submission.

| Method   | Path                                      | Success | Purpose                                                                |
| -------- | ----------------------------------------- | ------- | ---------------------------------------------------------------------- |
| `GET`    | `/teams/:teamId/submission`               | `200`   | Read submission status, files, limits, and blocked actions             |
| `POST`   | `/teams/:teamId/submission/files`         | `201`   | Upload one file as the `file` field in a `multipart/form-data` request |
| `GET`    | `/teams/:teamId/submission/files/:fileId` | `200`   | Download a file as an attachment                                       |
| `DELETE` | `/teams/:teamId/submission/files/:fileId` | `200`   | Remove a file from the draft                                           |
| `POST`   | `/teams/:teamId/submission/submit`        | `201`   | Submit the draft and record its submission time                        |
| `POST`   | `/teams/:teamId/submission/unsubmit`      | `201`   | Reopen the draft and clear its submission time while keeping the files |

Members can view and download files in any phase. Upload, delete, submit, and unsubmit require the `IN_PROGRESS` phase and a team size within the hackathon's configured range. Submit requires at least one file and locks uploads and deletions until the team unsubmits. Uploads respect the configured file count and the lower of the hackathon's per-file size limit and the server upload limit.

All successful requests except downloads return the current submission state. It includes `isSubmitted`, `submittedAt` (ISO timestamp or `null`), `files` (each with `id`, `name`, and `fileType`), `filesLimit`, and `fileMaxSize` in bytes. The `blocked` object gives a reason for each unavailable action (`upload`, `delete`, `submit`, or `unsubmit`), or `null` if the action is allowed.

Common errors include `401` for missing or invalid authentication, `403` for unauthorised access, `404` for a missing team or file outside the team's submission, `409` for a blocked action, and `413` for an oversized upload.

### Jury, scoring and rankings

All routes require authentication. Management permissions mean hackathon `ORGANIZER` or platform `ROLE_ADMIN`.

| Method | Path                                               | Access                                                               | Purpose                                                                         |
| ------ | -------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `POST` | `/hackathons/:hackathonId/judges`                  | Management; before evaluation starts                                 | Assign an existing user as `JURY` (`201`)                                       |
| `DELETE` | `/hackathons/:hackathonId/judges/:judgeId` | Management; before evaluation starts | Remove the specified JURY membership (`204`) |
| `GET`  | `/hackathons/:hackathonId/judges`                  | Authenticated                                                        | List judges (`200`)                                                             |
| `POST` | `/hackathons/:hackathonId/criteria`                | Management; before `IN_PROGRESS` starts                        | Create a scoring criterion (`201`)                                              |
| `PATCH` | `/hackathons/:hackathonId/criteria/:criterionId` | Management; before `IN_PROGRESS` starts | Partially update a scoring criterion (`200`) |
| `DELETE` | `/hackathons/:hackathonId/criteria/:criterionId` | Management; before `IN_PROGRESS` starts | Delete a scoring criterion (`204`) |
| `GET`  | `/hackathons/:hackathonId/criteria`                | Authenticated                                                        | List criteria (`200`)                                                           |
| `GET`  | `/hackathons/:hackathonId/jury/teams`              | Assigned judge; active `EVALUATION`                                  | List finalised submissions and personal evaluation progress (`200`)             |
| `PUT`  | `/hackathons/:hackathonId/teams/:teamId/scores`    | Assigned judge; active `EVALUATION`                                  | Insert or update personal criterion scores (`200`)                              |
| `GET`  | `/hackathons/:hackathonId/teams/:teamId/scores/me` | Assigned judge; finalised submission                                 | Read personal scores, including unscored criteria (`200`); no phase restriction |
| `GET`  | `/hackathons/:hackathonId/rankings`                | Management before evaluation ends; any authenticated user afterwards | Read calculated rankings (`200`)                                                |

- Criteria creation, editing and deletion are allowed before the scheduled `IN_PROGRESS` start, including before launch. Judge assignment and removal are allowed before the scheduled `EVALUATION` start. Both cutoffs are exclusive and apply to administrators too; a missing required phase returns `400`.
- Assigning a user who already has any hackathon membership returns `409`. Criterion titles are trimmed, non-empty, at most 100 characters before trimming, and unique within the hackathon. PATCH requires at least one field; omitted fields are preserved, a null title is invalid, and a null description clears it.
- Judge removal uses `judgeId` (the `hackathon_users.id` membership ID, not `users.id`) and only deletes a JURY membership in the specified hackathon. The account and other memberships remain intact; the removed judge may register as a participant if registration is open. Criterion editing and deletion are likewise scoped to the specified hackathon.
- Evaluation uses the interval `startAt <= now < endAt`. Scores are integers from 0 to 10; partial updates are accepted, duplicate or foreign criterion IDs are rejected, and only finalised teams can be scored. Omitted comments preserve previous feedback; explicit null or whitespace-only comments clear it. Comments have a maximum length of 1,000 characters.
- A judge's evaluation is complete only when at least one criterion exists and all criteria are scored. Rankings average the criterion scores of each complete evaluation, then average those judge averages equally. Partial evaluations are excluded. Round each team average to two decimal places before sorting by rounded average descending, then team ID ascending. Equal rounded averages share competition ranks (for example, `1, 1, 3`); the team ID only determines ordering within ties. Finalised teams without complete evaluations have null rank and average and appear last, ordered by ID.
- `400` indicates invalid input, a disallowed phase or an ineligible submission; `401` missing authentication; `403` insufficient permissions; `404` missing hackathon, team, target user, judge membership or criterion as applicable; `409` duplicate membership or criterion title.
- The hackathon details UI provides management controls before their respective cutoffs, judge evaluation during evaluation, management ranking previews during evaluation, and published rankings after evaluation ends. Submission viewing and downloads reuse the team submission GET endpoints above.

### Chat history

| Method | Path                               | Access               | Purpose                          |
| ------ | ---------------------------------- | -------------------- | -------------------------------- |
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

| Event          | Payload                                   | Acknowledgement                                           | Purpose                                        |
| -------------- | ----------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| `join-chat`    | `{ chatRoomId: number }`                  | `{ success: boolean, error?: string }`                    | Verify membership and join `chat:<chatRoomId>` |
| `send-message` | `{ chatRoomId: number, content: string }` | `{ success: boolean, message?: Message, error?: string }` | Validate, persist and broadcast a message      |

The frontend applies a five-second timeout to acknowledgement-based events. Timeout errors are separate from a server response with `success: false` and must be handled separately.

### Server-to-client events

| Event         | Payload   | Recipients                     | Purpose                          |
| ------------- | --------- | ------------------------------ | -------------------------------- |
| `new-message` | `Message` | Members of `chat:<chatRoomId>` | Deliver a persisted live message |

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

| Frontend page                        | Main backend endpoints                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `/hackathon-explorer`                | `GET /hackathons`, `GET /hackathons/:id`                                                          |
| `/hackathons`                        | `GET /hackathons` (admin), `GET /hackathons/mine` (regular user)                                  |
| `/hackathons/new`                    | `POST /hackathons`                                                                                |
| `/hackathons/:id`                    | `GET /hackathons/:id`, membership, registration, jury, criteria, evaluation and ranking endpoints |
| `/hackathons/:id/edit`               | `GET /hackathons/:id`, `PATCH /hackathons/:id`                                                    |
| `/hackathons/:id/team`               | Team membership and `/teams/:teamId/submission` endpoints                                         |
| `/profile`                           | `/users/me/profile` and `/skills` endpoints                                                       |
| `/login`, `/register`, `/verify-otp` | `/auth` endpoints                                                                                 |

## Local development tools

| URL                               | Purpose                          |
| --------------------------------- | -------------------------------- |
| `https://localhost:8443/api/docs` | Swagger UI                       |
| `http://localhost:5173`           | Frontend application             |
| `http://localhost:8081`           | Adminer, when enabled in Compose |

For local setup and environment variables, see [Development Setup](./DEVELOPMENT_SETUP.md). For coding standards and permissions, see [Development Guidelines](./DEVELOPMENT_GUIDELINES.md).

**API contract:** HackSpace application request and response fields now use `camelCase`, while PostgreSQL columns remain `snake_case`. See [API Contracts](./api_contracts.yml) for current payload schemas. Application endpoints use the `/api` prefix; the interactive Swagger UI is hosted at `/api/docs`.
