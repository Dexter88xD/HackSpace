Place CI/CD, database backup, and deployment scripts here. Keep credentials in the deployment platform, not in scripts.

Infrastructure follow-up:

- Add PostgreSQL, MinIO, backend, and AI service healthchecks when those services have stable health endpoints.
- Wire health-based startup dependencies after the checks exist.
