# HackSpace Development Guidelines

This document defines the conventions and development practices for the HackSpace project.
The goal is to keep the codebase consistent, readable, maintainable, and easy for everyone on the team to work on.

---

## 1. General Naming Conventions

### TypeScript

| Type       | Convention       | Example                |
| ---------- | ---------------- | ---------------------- |
| Variables  | camelCase        | `userId`               |
| Functions  | camelCase        | `getUserById()`        |
| Classes    | PascalCase       | `AuthService`          |
| Interfaces | PascalCase       | `AuthenticatedRequest` |
| Types      | PascalCase       | `JwtPayload`           |
| Enums      | PascalCase       | `UserRole`             |
| Constants  | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`        |

### Files

Use **kebab-case** for filenames.

```text
auth.service.ts
login.dto.ts
jwt.strategy.ts
authenticated-request.interface.ts
user-profile.entity.ts
```

---

# 2. DTO Conventions

DTOs define the data received or sent through the API.

### File naming

```text
login.dto.ts
register.dto.ts
verify-otp.dto.ts
```

### Class naming

```ts
export class LoginDto {}
export class RegisterDto {}
export class VerifyOtpDto {}
```

### DTO/API fields MUST use camelCase

```ts
fullName
confirmPassword
emailVerified
otpExpiresAt
hackathonId
createdAt
```

Example:

```ts
export class RegisterDto {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}
```

Do **not** use database naming conventions inside DTOs:

```ts
// ❌
full_name
confirm_password
email_verified
```

The API uses camelCase even if the database uses snake_case.

---

# 3. DTO Validation

DTOs should validate incoming data using `class-validator`.

Example:

```ts
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

Validation belongs in DTOs, not inside controllers.

Global validation should be enabled:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
})
```

This means:

* unexpected fields are removed/rejected
* invalid input is rejected before reaching the service
* controllers receive validated data

---

# 4. DTO vs Entity

DTOs and entities have different responsibilities.

### DTO

Represents API data.

```ts
fullName
confirmPassword
```

### Entity

Represents database data.

```ts
full_name
password_hash
email_verified
created_at
```

Do not use entities directly as request DTOs.

---

# 5. Entities

Entities represent database tables.

Example:

```ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column()
  full_name!: string;

  @Column()
  email!: string;
}
```

Database columns should use **snake_case**.

Examples:

```text
full_name
password_hash
email_verified
created_at
updated_at
otp_hash
otp_expires_at
```

---

# 6. Controllers

Controllers are responsible for handling HTTP requests.

They should:

* receive requests
* validate DTOs
* use guards
* call services
* return responses

Controllers should remain thin.

Example:

```ts
@Post('signin')
signin(@Body() loginDto: LoginDto) {
  return this.authService.signin(loginDto);
}
```

Business logic belongs in the service.

Avoid putting database queries or authentication logic directly inside controllers.

---

# 7. Services

Services contain the application's business logic.

Example:

```ts
async signin(loginDto: LoginDto) {
  // authentication logic
}
```

Services can:

* access repositories
* validate business rules
* hash passwords
* generate tokens
* send emails
* perform database operations

Controllers should delegate this work to services.

---

# 8. Interfaces

Interfaces should describe custom structures that are not database entities.

Example:

```text
src/interfaces/authenticated-request.interface.ts
```

```ts
export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}
```

Use interfaces when extending existing structures or defining custom application-level shapes.

---

# 9. API Conventions

Use resource-oriented routes.

### Authentication

```text
POST /auth/register
POST /auth/signin
POST /auth/verify
POST /auth/resend
GET  /auth/me
```

### Resources

```text
GET    /hackathons
GET    /hackathons/:id
POST   /hackathons
PATCH  /hackathons/:id
DELETE /hackathons/:id
```

Use HTTP methods according to the operation.

---

# 10. API Request/Response Naming

API request and response fields use **camelCase**.

Example:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "emailVerified": true
}
```

Even though the database may contain:

```text
full_name
email_verified
```

The frontend should never need to know the database naming convention.

---

# 11. HTTP Status Codes

Use appropriate HTTP status codes.

| Status | Usage                                    |
| ------ | ---------------------------------------- |
| `200`  | Successful request                       |
| `201`  | Resource successfully created            |
| `204`  | Successful request with no response body |
| `400`  | Invalid request                          |
| `401`  | Authentication required/failed           |
| `403`  | Authenticated but not authorized         |
| `404`  | Resource not found                       |
| `409`  | Resource conflict                        |
| `500`  | Unexpected server error                  |

Example:

```ts
throw new ConflictException('Username is already taken');
```

---

# 12. API Error Codes

When the frontend needs to react differently to different errors, use a custom error code.

Example:

```ts
throw new UnauthorizedException({
  message: 'Invalid email or password',
  code: 'INVALID_CREDENTIALS',
});
```

Frontend:

```ts
if (error.response?.data.code === 'INVALID_CREDENTIALS') {
  // handle invalid credentials
}
```

Do not make frontend logic depend on error messages.

Avoid:

```ts
if (error.message === 'Invalid email or password')
```

Messages can change. Error codes should remain stable.

---

# 13. Authentication

Authentication is responsible for determining **who the user is**.

Authorization determines **what the user is allowed to do**.

The backend is the final authority for authentication and authorization.

Never trust frontend checks as security.

---

# 14. JWT Conventions

JWT payloads should contain only the information necessary to identify the user.

Example:

```ts
{
  sub: user.id
}
```

Use `sub` for the user ID.

Do not put sensitive information inside the JWT.

Avoid:

```ts
{
  password: user.password,
  passwordHash: user.password_hash
}
```

The JWT is signed, not encrypted. Anyone holding the token can decode its payload.

---

# 15. Guards

Use guards to protect authenticated routes.

Example:

```ts
@UseGuards(JwtAuthGuard)
@Get('me')
getMe() {
  // ...
}
```

The guard verifies the JWT before the controller is executed.

---

# 16. `req.user`

After JWT authentication, the JWT strategy should attach the authenticated user's information to `req.user`.

Example:

```ts
validate(payload: JwtPayload) {
  return {
    userId: payload.sub,
  };
}
```

Then:

```ts
req.user.userId
```

can be used inside protected routes.

Keep the structure consistent across the application.

---

# 17. `/auth/me`

Use `/auth/me` to retrieve the currently authenticated user.

Example:

```text
GET /auth/me
Authorization: Bearer <token>
```

The endpoint should:

1. Validate the JWT.
2. Get the user ID from `req.user`.
3. Find the user.
4. Return safe user information.

Do not return sensitive fields such as:

```text
password_hash
otp_hash
otp_expires_at
```

Example response:

```json
{
  "id": 1,
  "username": "aymen",
  "fullName": "Aymen Aitouraies",
  "email": "aymen@example.com",
  "emailVerified": true
}
```

---

# 18. TypeORM

Everyone working with the backend should understand:

* Entities
* Repositories
* Relations
* `findOne`
* `find`
* `create`
* `save`
* `update`
* Migrations
* Transactions
* `forRoot`
* `forFeature`
* `@InjectRepository`

Example:

```ts
@InjectRepository(User)
private readonly userRepository: Repository<User>
```

`repository.create()` creates an entity instance in memory.

```ts
const user = repository.create(data);
```

`repository.save()` persists it to the database.

```ts
await repository.save(user);
```

---

# 19. TypeORM Relations

Understand the difference between:

```ts
@OneToOne()
@OneToMany()
@ManyToOne()
@ManyToMany()
```

Relations should correctly represent the database relationship.

Example:

```ts
@OneToOne(() => UserProfile, (profile) => profile.user)
profile!: UserProfile;
```

Make sure related entities are registered with TypeORM.

---

# 20. TypeORM Migrations

Database schema changes must be handled through migrations.

Do not manually modify the database schema in production.

Typical workflow:

```bash
npm run typeorm migration:generate -- src/database/migrations/SomeChange -d src/database/data-source.ts
```

Then:

```bash
npm run typeorm migration:run -- -d src/database/data-source.ts
```

Migrations must be committed to Git.

Do not use:

```ts
synchronize: true
```

for the project database.

---

# 21. Frontend Data Fetching

Use **TanStack Query** for server state.

### `useQuery`

Use for retrieving data.

```ts
useQuery({
  queryKey: ['me'],
  queryFn: getMe,
});
```

Examples:

```text
GET /auth/me
GET /hackathons
GET /hackathons/:id
```

### `useMutation`

Use for actions that change data or trigger an operation.

Examples:

```text
POST /auth/register
POST /auth/signin
POST /auth/verify
POST /auth/resend
POST /hackathons
PATCH /hackathons/:id
DELETE /hackathons/:id
```

Mental model:

```text
useQuery    → "Give me data"
useMutation → "Do this"
```

---

# 22. React Forms

Use:

* React Hook Form
* Zod
* `@hookform/resolvers`

Example:

```ts
useForm({
  resolver: zodResolver(schema),
});
```

Keep validation schemas separate from components when possible.

Example:

```text
src/schemas/login.schema.ts
src/schemas/register.schema.ts
```

---

# 23. API Client

API calls should be kept inside:

```text
src/api/
```

Example:

```text
src/api/auth.ts
src/api/hackathons.ts
src/api/users.ts
```

Do not repeatedly write Axios requests directly inside components.

Bad:

```tsx
axios.get('/auth/me');
```

Better:

```ts
const getMe = () => api.get('/auth/me');
```

Then use:

```ts
useQuery({
  queryKey: ['me'],
  queryFn: getMe,
});
```

---

# 24. React Components

Keep components focused.

A component should not contain large amounts of unrelated business logic.

Prefer:

```text
components/
pages/
api/
schemas/
```

Follow the existing project structure instead of creating a new architecture without discussing it with the team.

---

# 25. shadcn/ui

Use shadcn/ui components when an appropriate component already exists.

Examples:

```text
Button
Input
Dialog
DropdownMenu
Spinner
Alert
```

Avoid creating custom versions of components that already exist in the project unless there is a specific reason.

---

# 26. Environment Variables

Never commit secrets.

Do not commit:

```text
JWT_SECRET
DATABASE_PASSWORD
API_KEYS
EMAIL_API_KEYS
```

Use `.env` files locally and environment configuration for deployment.

Never hardcode secrets:

```ts
// ❌
const secret = 'my-super-secret';
```

---

# 27. Git Branch Naming

Use descriptive branch names.

```text
feat/<feature>
fix/<bug>
refactor/<area>
docs/<topic>
```

Examples:

```text
feat/standard-auth
feat/hackathon-registration
fix/jwt-authentication
refactor/user-service
docs/development-guidelines
```

---

# 28. Commit Messages

Use clear commit messages.

Recommended format:

```text
feat: add user registration
fix: handle expired verification codes
refactor: simplify auth service
docs: update development guidelines
```

Keep commits focused on one logical change.

Avoid:

```text
fix stuff
changes
update
final
test
```

---

# 29. Pull Requests

Before creating a PR, verify:

* [ ] Naming conventions are followed
* [ ] DTO fields use camelCase
* [ ] Database fields use snake_case
* [ ] DTO validation is implemented
* [ ] No secrets are committed
* [ ] Correct HTTP status codes are used
* [ ] Custom API error codes are used where needed
* [ ] Swagger documentation is updated when necessary
* [ ] TypeScript has no errors
* [ ] ESLint passes
* [ ] Docker build works
* [ ] Database migrations are included when necessary
* [ ] The feature was tested locally
* [ ] No unrelated files were changed

---

# 30. Concepts Everyone Should Learn

Everyone contributing to the backend should understand:

### NestJS

* Modules
* Controllers
* Providers
* Dependency Injection
* DTOs
* Pipes
* Guards
* Interceptors
* Exception handling

### Authentication

* Password hashing
* JWT
* Access tokens
* Refresh tokens
* Passport
* Authentication vs authorization
* HTTP status codes
* CORS
* CSRF

### TypeORM

* Entities
* Repositories
* Relations
* Migrations
* Transactions
* Query building

### PostgreSQL

* Tables
* Primary keys
* Foreign keys
* Constraints
* Indexes
* Unique constraints
* Transactions

### React

* Components
* Props
* State
* Hooks
* Forms
* Routing

### TanStack Query

* Queries
* Mutations
* Query keys
* Caching
* Loading states
* Error states
* Invalidating queries

### TypeScript

* Types
* Interfaces
* Generics
* Union types
* Optional properties
* Type narrowing
* Async/await

### Git

* Branches
* Commits
* Pull requests
* Rebasing
* Merge conflicts

---

# 31. Golden Rules

1. **Follow the existing project structure.**
2. **Use camelCase for API and DTO fields.**
3. **Use snake_case for database columns.**
4. **Do not use entities as DTOs.**
5. **Keep controllers thin.**
6. **Put business logic in services.**
7. **Validate input through DTOs.**
8. **The backend is the security authority.**
9. **Never commit secrets.**
10. **Use migrations for database schema changes.**
11. **Use `useQuery` for reading server data.**
12. **Use `useMutation` for actions and changes.**
13. **Keep API calls inside `src/api`.**
14. **Use custom error codes when the frontend needs to distinguish errors.**
15. **Do not rely on error message strings for frontend logic.**
16. **Return only safe user data from `/auth/me`.**
17. **Follow existing conventions before introducing new ones.**
18. **If a new convention is needed, discuss it with the team first.**
