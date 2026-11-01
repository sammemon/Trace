# Deployment

## Local without Docker

1. Create a Supabase project and open Project Settings > Database.
2. Copy the Prisma/transaction pooler connection string into `DATABASE_URL`; keep the direct connection in `DIRECT_URL` for migrations if Supabase provides one.
3. Copy `.env.example` to `.env` and replace the Supabase project reference, password, region, and server-only secrets.
4. Run `corepack pnpm db:generate`, `corepack pnpm db:migrate`, and `corepack pnpm db:seed`.
5. Start the API directly with Node using `corepack pnpm --filter @trace/api dev`.
6. Start the web app with `corepack pnpm --filter @trace/admin dev`.

The API uses Prisma directly against Supabase PostgreSQL. A Supabase API key alone is not a database connection and must not be used as `DATABASE_URL`. Never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser.

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