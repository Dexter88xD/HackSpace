# HackSpace routes and endpoints

This is the current route map for local development. Frontend URLs are served
by Vite at `http://localhost:5173`; backend URLs are served by NestJS at
`http://localhost:3000`.

## Frontend pages

| Path | Page | Access | Notes |
| --- | --- | --- | --- |
| `/` | Home | Protected | Current authenticated landing page (placeholder content) |
| `/hackathons` | Hackathons | Protected | Hackathon listing page (placeholder content) |
| `/login` | Login | Public | Password login plus Google and 42 Intra OAuth |
| `/register` | Register | Public | Account registration |
| `/verify-otp` | OTP verification | Public | Email verification after registration or an unverified login |

## Backend HTTP endpoints

All endpoints below are relative to `http://localhost:3000`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Backend health/greeting response |
| `POST` | `/auth/register` | Public | Create an account and send an email verification code |
| `POST` | `/auth/verify` | Public | Verify an account's email with an OTP |
| `POST` | `/auth/resend-code` | Public | Send a new email verification code |
| `POST` | `/auth/signin` | Public | Sign in with username/email and password; sets the `accessToken` cookie |
| `GET` | `/auth/me` | Cookie | Return the currently authenticated user |
| `GET` | `/auth/oauth/google` | Public | Start Google OAuth |
| `GET` | `/auth/oauth/google/callback` | OAuth callback | Complete Google OAuth and redirect to the frontend |
| `GET` | `/auth/oauth/42` | Public | Start 42 Intra OAuth |
| `GET` | `/auth/oauth/42/callback` | OAuth callback | Complete 42 Intra OAuth and redirect to the frontend |
| `GET` | `/demo/greetings` | Public | Demo endpoint for stored Kafka greetings |
| `POST` | `/demo/send-name` | Public | Send a name to the demo Kafka topic |

## Development tools and integrations

| Path | Purpose |
| --- | --- |
| `http://localhost:3000/api` | Swagger UI for the NestJS API |
| `http://localhost:5173` | React/Vite frontend |
| `http://localhost:3000/auth/oauth/google` | Google OAuth start URL used by the login UI |
| `http://localhost:3000/auth/oauth/42` | 42 Intra OAuth start URL used by the login UI |

The OAuth provider credentials and callback URLs are configured in the
backend environment. The frontend only initiates the redirect; OAuth tokens
remain server-side and the backend sets the HttpOnly `accessToken` cookie.
