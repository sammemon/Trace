# Deployment

## Local

1. Copy `.env.example` to `.env` and replace secrets.
2. Start Docker Desktop.
3. Run `docker compose up -d`.
4. Run `corepack pnpm db:generate`, `corepack pnpm db:migrate`, and `corepack pnpm db:seed`.
5. Start the workspace with `corepack pnpm dev`.

## Production checklist

- PostgreSQL 16 with automated backups and TLS
- Redis with authentication and persistence policy
- Private S3/R2 bucket with lifecycle rules and a CDN for public item images
- Strong `JWT_ACCESS_SECRET` and `PRIVATE_DATA_KEY` from a secret manager
- Restricted `ADMIN_ORIGIN` and HTTPS-only ingress
- API deployment on Render, Railway, or Fly.io
- Admin deployment on Vercel with the API URL configured
- Expo EAS development, preview, and production profiles
- Sentry DSNs and structured log shipping
- Run migrations before application rollout and verify `/health` plus `/ready`