# HackSpace Development Setup

## Environment configuration

Copy the example environment files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Configure the development credentials and enable seeding in the root `.env`:

```dotenv
SEED_DEV_DATA=true
SEED_ADMIN_PASSWORD=<your-development-admin-password>
SEED_USER_PASSWORD=<your-development-user-password>
```

Use development-only passwords of at least 12 characters. Never commit real `.env` files.

## Start and populate the database

```bash
make up
make migration
make seed
```

The seed script creates:

- A verified administrator: `dev_admin`
- A verified regular user: `dev_user`
- Five additional verified users: `dev_user_1` through `dev_user_5`
- Profiles for all seven accounts
- 100 skills, with five assigned to each additional user (25 profile-skill assignments)
- 200 sample hackathons
- 200 associated settings records
- 1,000 scheduled phases

New accounts use the passwords from the environment variables above: `SEED_ADMIN_PASSWORD` for the administrator and `SEED_USER_PASSWORD` for all regular users. Passwords are required only when creating the corresponding accounts.

The shared runner executes users, skills, then hackathons in one transaction. Reruns skip existing records and fill missing profiles, skills, settings, phases, organizers, and profile-skill assignments. Existing passwords, profile fields, skill names, hackathon dates, and extra assignments are preserved. Conflicting usernames, emails, or account roles stop the run and roll back its changes. Run migrations before seeding; no seed-history table is used.

## Reset and reseed the database

**Warning:** The following workflow permanently deletes the local PostgreSQL development volume and its data.

```bash
make db-reset
make up
make migration
make seed
```

Only run this when you intend to discard your current development database.

## Useful Makefile commands

| Command | Description |
|---|---|
| `make help` | List available commands |
| `make up` | Build and start the stack |
| `make down` | Stop the stack |
| `make migration` | Apply TypeORM migrations |
| `make seed` | Populate development data |
| `make db` | Open the PostgreSQL shell |
| `make db-reset` | Delete the development PostgreSQL volume |
| `make lint` | Run backend and frontend lint |
| `make test` | Run backend tests |

Use `make help` for the complete command list.
