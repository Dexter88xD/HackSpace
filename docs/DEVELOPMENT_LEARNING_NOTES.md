# HackSpace Development Learning Notes

> Educational reference, separated from the enforceable [Development Guidelines](./DEVELOPMENT_GUIDELINES.md). The examples illustrate concepts; check current source before copying them into HackSpace. All **new code** must follow the target conventions established in the guidelines.

## 1. NestJS: request lifecycle and responsibilities

A typical request passes through middleware, guards, interceptors and pipes before reaching the controller and service (the precise ordering depends on the installed components).

- **Controller:** maps URLs and HTTP methods to handlers; delegates work to a service.
- **DTO and validation pipe:** validates incoming data before it reaches business logic.
- **Guard:** decides whether the request is authenticated or authorised.
- **Service:** enforces business rules and coordinates repositories, transactions and external calls.
- **Repository:** reads and writes entities through TypeORM.

```ts
@Post()
create(@Body() dto: CreateHackathonDto, @Req() req: AuthenticatedRequest) {
  return this.hackathonsService.create(dto, req.user.userId);
}
```

The controller above should not perform a database transaction or implement organiser checks itself.

### HTTP status codes

| Code | Meaning |
| --- | --- |
| `200` | Successful request |
| `201` | Resource created |
| `204` | Successful, no response body |
| `400` | Invalid input |
| `401` | Missing/invalid authentication |
| `403` | Authenticated but forbidden |
| `404` | Resource not found |
| `409` | State or uniqueness conflict |
| `500` | Unexpected server error |

Use stable error `code` values when a client needs distinct handling; do not compare mutable human-readable messages.

## 2. DTOs, entities and responses

These structures serve different purposes:

| Structure | Responsibility |
| --- | --- |
| Request DTO | Accepted client input and validation |
| TypeORM entity | Persistence model and relationships |
| Response DTO / mapper | Public API shape and safe returned fields |

Example of mapping TypeScript to SQL:

```ts
@Entity('users')
export class User {
  @Column({ name: 'full_name' })
  fullName!: string;
}
```

API request/response fields should be camelCase, even when physical SQL columns are snake_case. A response mapper is preferable to leaking every entity property to a client.

With `class-validator`, `@IsEmail()`, `@IsString()`, `@MinLength()` and similar decorators express field constraints. A correctly configured `ValidationPipe` rejects invalid requests before they reach the controller's service logic.

## 3. Authentication and authorisation

**Authentication** establishes identity; **authorisation** determines allowed actions.

- **JWT:** carries signed claims; the payload is readable by a holder of the token. Use `sub` for the user ID and keep secrets out of it.
- **Passport/JWT strategy:** verifies credentials or token and provides the authenticated identity.
- **`JwtAuthGuard`:** enforces authentication at protected routes.
- **Roles/permissions:** inspect trusted backend state, not arbitrary client-provided role strings.
- **OAuth:** involves provider redirects and a validated state parameter to prevent callback confusion.

HackSpace distinguishes global roles `ROLE_USER` / `ROLE_ADMIN` from hackathon membership roles. Hackathon organisers may edit their own hackathons; `ROLE_ADMIN` can override that organiser restriction, as implemented in the hackathon service. UI flags such as `canEdit` are not sufficient authorisation on their own.

`GET /auth/me` returns current-user information and must exclude password hashes, OTP secrets and similar sensitive data.

## 4. TypeORM and PostgreSQL

- `repository.create(data)` constructs an entity instance in memory; it does not persist.
- `repository.save(entity)` persists an entity (insert or update, depending on its identity and state).
- `findOne`, query builders and relations provide different ways to read data.
- `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany` describe cardinality.
- `@JoinColumn` identifies the foreign-key column on the owning side of relevant relations.
- `@JoinTable` defines a many-to-many junction table on its owning side.
- PostgreSQL primary/foreign keys, unique constraints and indexes help enforce correctness under concurrent requests.
- A **transaction** groups multiple writes so they commit or roll back together.

```ts
@ManyToOne(() => Hackathon, (hackathon) => hackathon.teams, {
  nullable: false,
  onDelete: 'CASCADE',
})
@JoinColumn({ name: 'hackathon_id' })
hackathon!: Hackathon;
```

A TypeScript property rename does not itself require a SQL column rename if the explicit mapping remains unchanged. A physical column rename changes the schema and must be reflected in migrations.

### Why migrations usually remain unchanged

An applied migration records a database's history; editing its source code does not change databases that already ran it. Normally, create a new migration for schema changes. When **all affected databases are disposable local development databases**, a coordinated reset can permit consolidating migration history, provided the new history is tested from an empty database. Never use that exception for shared or deployed databases.

## 5. React components, forms and server state

Keep pages focused, use existing shared components and put API calls in `frontend/src/api/`.

**TanStack Query**:

```ts
useQuery({
  queryKey: ['hackathons', filters],
  queryFn: () => getHackathons(filters),
});
```

Use `useQuery` for cached reads, and `useMutation` for operations that change backend state. After a mutation, invalidate or update affected query keys so the UI doesn't show stale information.

**React Hook Form + Zod**:

```ts
useForm({
  resolver: zodResolver(schema),
});
```

Put reusable validation schemas in `frontend/src/schemas/`; keep forms, API types and backend DTOs aligned. Protecting a React route improves UX but cannot replace backend authorisation.

## 6. WebSockets and Socket.IO chat

HackSpace team chat combines HTTP for history with Socket.IO for live updates:

```text
GET /chat-rooms/:chatRoomId/messages  -> existing messages
Socket.IO /chat                       -> live connection
chat:<chatRoomId>                     -> one team chat room
```

### Namespace, connection and room

- A **namespace** is a logical Socket.IO endpoint. The chat gateway uses `/chat`.
- A **socket connection** is the authenticated, long-lived client connection to that namespace.
- A **room** is a server-side group of sockets. Team messages are broadcast to `chat:<chatRoomId>`.

Being connected to the namespace does not automatically grant access to every room. The gateway verifies the `accessToken` cookie during the handshake, then verifies database membership when it receives `join-chat`.

### Events and acknowledgements

Socket.IO events are named messages. The client emits:

```ts
socket.emit("join-chat", { chatRoomId }, callback);
socket.emit("send-message", { chatRoomId, content }, callback);
```

The callback is an **acknowledgement** for that specific request. It is not the same as a broadcast. The server calls it with a result such as:

```ts
{ success: true }
{ success: false, error: "You are not a member of this chat room" }
```

The server broadcasts a saved message separately:

```ts
server.to(`chat:${chatRoomId}`).emit("new-message", message);
```

When an acknowledgement is used with a client timeout, the callback must handle both arguments:

```ts
(err, response) => {
  if (err) {
    // No acknowledgement arrived before the timeout.
    return;
  }

  if (!response.success) {
    // The server rejected the request.
    return;
  }

  // The server confirmed success.
}
```

The timeout branch must return before reading `response`, because a timeout may not provide a response object.

### Chat message flow

1. The frontend connects to `/chat` with credentials.
2. The gateway verifies the `accessToken` cookie and stores the trusted user identity on the socket.
3. The frontend emits `join-chat`.
4. The gateway checks `ChatMember` membership and joins the socket to `chat:<chatRoomId>`.
5. The frontend loads older messages through the authenticated HTTP endpoint.
6. The frontend listens for `new-message` and updates its TanStack Query cache.
7. On `send-message`, the backend validates the payload and checks membership again.
8. The service persists the message and reloads the sender fields needed by the client.
9. The gateway broadcasts the saved message to the room and acknowledges the sender.

Membership must be checked both when joining and sending. A previous successful join must not be treated as permanent authorization after a user leaves a team.

### Debugging checklist

- `connect_error`: inspect the URL, local TLS certificate, CORS origin and `accessToken` cookie.
- Connected but no live messages: verify `join-chat` succeeded and that both clients use the same `chatRoomId`.
- Sender name missing on live messages: verify the backend loads `sender.id` and `sender.username` before broadcasting.
- Timeout: verify the backend calls the acknowledgement on every success and failure path.

## 7. Git and PR workflow reference

Know how to create focused branches, write conventional commits, review a diff, resolve conflicts and rebase only when appropriate for the team's workflow.

The team requires at least one other developer's approval and passing CI before merging to `main`. Start dependent work from the updated `main` branch after its prerequisites have merged.

## 8. Suggested learning checklist

- **NestJS:** modules, providers, dependency injection, controllers, pipes, guards, interceptors, exceptions.
- **Authentication:** password hashing, JWT, Passport, OAuth, cookies, CORS, CSRF.
- **TypeORM:** entities, repositories, relations, joins, transactions, migrations, query builders.
- **PostgreSQL:** primary keys, foreign keys, constraints, indexes, transactions, concurrency.
- **React:** props, state, hooks, forms, routing, reusable components.
- **TanStack Query:** queries, mutations, caching, loading/error states, invalidation.
- **TypeScript:** types, interfaces, generics, unions, narrowing, async/await.
- **Git:** branches, commits, PRs, review, rebasing, merge conflicts.

For project-specific rules and commands, return to the [Development Guidelines](./DEVELOPMENT_GUIDELINES.md) and [Development Setup](./DEVELOPMENT_SETUP.md).
