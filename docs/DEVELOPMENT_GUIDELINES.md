# HackSpace Development Guidelines

> For explanations and examples, see [Development Learning Notes](./DEVELOPMENT_LEARNING_NOTES.md). For commands and local setup, see [Development Setup](./DEVELOPMENT_SETUP.md).
> The conventions below are mandatory for new work; existing inconsistencies are addressed through reviewed refactoring changes.

## 1. Principles

- Keep changes focused, reviewable, testable and consistent with the existing monorepo.
- Keep controllers thin, services responsible for business rules, and repositories responsible for persistence.
- Treat the backend as the authority for authentication, authorisation, validation and data integrity. UI checks are for user experience, **not** security.
- Update relevant tests and documentation whenever externally visible behaviour changes.
- Never commit secrets, generated output or unrelated formatting changes.
- For dependent changes, wait until their prerequisites are reviewed and merged, then work from updated `main`.

## 2. Naming and code organisation

| Layer / item | Target convention | Example |
| --- | --- | --- |
| TypeScript variables, functions, properties and methods | `camelCase` | `userId`, `organizationName`, `getHackathon()` |
| Classes, interfaces, types, enums and DTO classes | `PascalCase` | `UserProfile`, `CreateHackathonDto`, `HackRoleName` |
| Global constants and enum-like fixed configuration values | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Source filenames | `kebab-case` | `user-profile.entity.ts`, `create-hackathon.dto.ts` |
| PostgreSQL tables | `snake_case` | `user_profiles`, `hackathon_users` |
| PostgreSQL columns and foreign keys | `snake_case` | `organization_name`, `user_id`, `created_at` |
| HTTP JSON request and response fields | `camelCase` | `organizationName`, `startAt`, `createdAt` |
| URL paths | Lowercase resource-oriented paths, hyphenated where needed | `/hackathons/:id/current-phase` |

**One distinction matters:** TypeScript property names and physical SQL column names are **different interfaces**. Do not use a snake_case TypeScript property merely because its database column is snake_case.

Use TypeORM mappings when the names differ:

```ts
@Entity('hackathons')
export class Hackathon {
  @Column({ name: 'organization_name' })
  organizationName!: string;

  @Column({ name: 'start_at', type: 'timestamp' })
  startAt!: Date;
}
```

These are examples of the naming convention, not a copy of the current entity. Renaming a property requires updating references, query builders, response mappings, services, tests and frontend consumers together.

## 3. API contracts and validation

- Define request DTOs separately from TypeORM entities. Use `class-validator` to validate backend input; use React Hook Form and Zod for frontend forms where appropriate.
- **Use `camelCase` for API JSON fields**, including nested objects, pagination fields and date properties. When standardising a legacy response, update the backend contract and all consumers in the same PR.
- Do not expose persistence entities as the public API contract. Prefer response DTOs, serializers or explicit mapping functions that control field names and remove sensitive properties.
- Make changes to backend response shapes, frontend API clients/types and their tests **in the same functional PR**. Do not merge a broken consumer contract while waiting for a later PR.
- Use resource-oriented endpoints and correct HTTP methods. Keep route paths stable unless changing them is explicitly in scope.
- Use appropriate status codes: `200` read/update success, `201` created, `204` no content, `400` invalid input, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict.
- Where callers must distinguish errors, return a stable machine-readable `code` as well as a human-readable message. Do not branch on error message strings in the frontend.
- Keep [`api_contracts.yml`](./api_contracts.yml) and [`ROUTES.md`](./ROUTES.md) aligned with implemented endpoints. Expand contract coverage when changing undocumented endpoints.

## 4. Backend architecture

- **Controllers:** receive and validate requests, apply guards and delegate to services. Keep database and business logic out of controllers.
- **Services:** enforce domain rules and permissions; orchestrate repositories, transactions and external integrations.
- **DTOs:** validate and document the shapes accepted from clients. Keep response mapping separate from database entities.
- **Repositories / TypeORM:** use explicit relations and constraints; avoid unnecessary queries and unsafe assumptions about loaded relations.
- **Transactions:** use them for multi-record operations that must succeed or fail together (for example, creating a hackathon and its settings and organiser membership).
- Preserve established application/module boundaries unless the change has a clear architectural purpose and review agreement.

## 5. Authentication and authorisation

- Use the established JWT/Passport strategy and NestJS guards. Read the authenticated user identity from verified server-side authentication, not from a client-supplied user ID or role.
- Use `sub` as the JWT subject/user identifier; do not put secrets or password hashes into tokens.
- Distinguish platform roles (`ROLE_USER`, `ROLE_ADMIN`) from per-hackathon membership roles (`ORGANIZER`, `PARTICIPANT`, `JURY`, `MENTOR`). These roles have different scopes.
- **Platform administrators have an administrative override** of ordinary ownership/organiser restrictions where supported by the resource's backend authorisation logic. Override never skips login, input validation or other safety checks.

### Hackathon permissions

| Operation | Rule |
| --- | --- |
| Create a hackathon (`POST /hackathons`) | Any authenticated user, whether `ROLE_USER` or `ROLE_ADMIN` |
| Create-time membership | The creator is assigned the hackathon-specific `ORGANIZER` role |
| Edit a hackathon (`PATCH /hackathons/:id`) | A member with `ORGANIZER` for that hackathon **or** a platform `ROLE_ADMIN` |
| Read hackathons | Requires authentication under the current controller guard |
| Other hackathon/team/skill actions | Enforce and test the endpoint's own business and role rules; don't infer them from this table |

The repository currently implements the admin override in `HackathonsService.canEditHackathon()`. Its `canEdit` response field may help the UI, but the service must independently enforce permission on update. There is **no** frontend `/admin/hackathons` route; the current routes use `/hackathons`, `/hackathons/new` and `/hackathons/:id/edit`.

For all protected operations, distinguish `401` (no valid authentication) from `403` (authenticated but lacking access). Test the allowed and denied paths, including the admin override.

## 6. Database, entities and migrations

- Keep PostgreSQL tables, physical columns and foreign keys in **snake_case**. Correct legacy exceptions through a coordinated schema and application change.
- Use **camelCase TypeScript entity properties** and explicit `@Column({ name: 'snake_case_column' })` / date-column mappings where needed.
- On the **owning side** of a `@ManyToOne` or owning `@OneToOne` that has an FK, specify the actual FK name with `@JoinColumn({ name: 'foreign_key_column' })`. Place `@JoinColumn` on **one owning side only** for a one-to-one relation.
- Define join-table names and their column names explicitly with `@JoinTable` when using many-to-many mappings.
- Keep correct relation ownership, inverse properties, `nullable`, uniqueness, on-delete behaviour and constraints. **Do not move the `hackathon_settings` one-to-one FK to another table** merely for naming consistency.
- Never enable `synchronize: true` as a replacement for migrations. The final entity metadata and migration SQL must agree.

### Migration management

- Prefer forward-only migrations once migration history has been applied to a database that must be retained. Do not edit applied migrations on shared, staging or production databases.
- An exception is possible during **coordinated local-only development resets**, but only when every affected database is disposable and the team has explicitly agreed to discard its data.
- When consolidating development migrations, validate the **complete migration sequence against an empty database**, preserve constraints and relationships, run the seed scripts and rerun application tests.
- Never assume a changed migration file updates a database that already recorded that migration as applied.
- The destructive reset process is documented in [Development Setup](./DEVELOPMENT_SETUP.md). Check the Compose project and volumes before using it.

## 7. Frontend architecture

- Keep server requests in the established `frontend/src/api/` layer rather than scattering Axios calls across components.
- Prefer TanStack Query for server state (`useQuery` for reads, `useMutation` for changes); maintain meaningful query keys and invalidate/update affected cached data after mutations.
- Keep shared UI components reusable and pages focused. Reuse existing components, including shadcn-based components where suitable, instead of duplicating them.
- Put form schemas in the existing `src/schemas/` structure when applicable. Match field names, loading/error states and mutation results to the actual backend contract.
- Protected React routes improve navigation, but **backend guards and domain services must always verify permissions**.

## 8. Branches, commits, PR reviews and CI

- Create a branch from an up-to-date `main`. Prefer `feat/`, `fix/`, `refactor/`, `docs/`, `chore/` or `ci/` followed by a focused kebab-case description.
- Write Conventional Commit-style messages: `feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`, `chore: ...`, `ci: ...`.
- A PR should have one coherent objective. Identify affected services, contracts, migrations and tests; include UI evidence when helpful.
- **Every PR into `main` requires at least one approval from another developer and passing required GitHub Actions CI checks before merge.** The author must not self-approve. Resolve review feedback and rerun checks after changes.
- For dependent maintenance PRs, **wait for the previous PR to be reviewed and merged**, then branch from updated `main`.
- A local green build is not a substitute for required CI. Do not silently bypass failing or unavailable checks.

### Shared npm scripts and Make targets

| Command | Meaning |
| --- | --- |
| `npm run lint` | Check with ESLint, without modifying files |
| `npm run lint:fix` | Apply safe ESLint autofixes |
| `npm run typecheck` | Check the application TypeScript project(s) |
| `npm run build` | Build the application with its own build tool |
| `make lint` / `make lint-fix` | Lint or autofix both apps in running containers |
| `make typecheck` | Typecheck backend and frontend applications |
| `make build` | Run the NestJS and frontend application builds |
| `make build-images` | Build images with Docker Compose; does not launch containers |
| `make test` | Run backend Jest tests |

The backend and frontend use different TypeScript compiler flags deliberately. The **shared contract is the npm script name and purpose**, not identical arguments.

**TypeScript check coverage:** backend `typecheck` currently uses `tsconfig.build.json` and excludes `*.spec.ts`. Jest executes the tests, but passing Jest does not prove test source passes a full TypeScript compilation check. Test changes should be checked appropriately; expand CI type coverage when the test typing is corrected.

Commands that use `docker compose exec` require running containers. Refer to [`DEVELOPMENT_SETUP.md`](./DEVELOPMENT_SETUP.md) for setup and reset instructions.

## 9. Security and environment

- Keep development secrets in the ignored root `.env` or a proper secret-management solution. Commit safe placeholders in the root `.env.example`; do not add service-specific `.env` files for the Compose workflow.
- Never hard-code API keys, passwords, tokens, OAuth secrets, email credentials or database passwords.
- Use secure cookie flags and HTTPS appropriate to the deployment environment. A development-only cookie setting must not be assumed suitable for production.
- Validate request input and authorisation on the server, including in requests with valid JWTs. Do not return password hashes, OTP secrets or other sensitive columns in API responses.
- Enforce relevant uniqueness and integrity constraints in PostgreSQL and handle races (for example, duplicate registration) with correct errors.
- Pass only required environment variables to each container; never expose secrets via `VITE_` variables or commit local `.env` files.

## 10. Definition of Done

Before requesting review:

- [ ] The change stays within its stated PR scope and follows the agreed **target** naming conventions (or clearly identifies deferred legacy work).
- [ ] Backend API changes, response mappings, frontend consumers and tests agree.
- [ ] Authentication, authorisation and failure paths are tested where applicable.
- [ ] No secret, generated build output or unrelated file is included.
- [ ] `make lint`, `make typecheck`, `make build` and applicable tests pass; known check limitations are disclosed.
- [ ] Database changes have a tested migration plan; any development-only reset is clearly documented and coordinated.
- [ ] Relevant README, routes, API contracts and schema documentation are updated.

**Before merging:** at least one other developer must approve the PR and all required CI checks must pass.

---

**Related documentation:** [Development Setup](./DEVELOPMENT_SETUP.md) · [Development Learning Notes](./DEVELOPMENT_LEARNING_NOTES.md) · [Routes](./ROUTES.md) · [API Contracts](./api_contracts.yml) · [Database Schema](./db_schema.md)
