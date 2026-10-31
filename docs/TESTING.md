# Testing

## Local commands

```powershell
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test
```

The API unit suites cover authentication, profile privacy, item ownership, claims, handover lockout, chat masking/isolation, moderation side effects, scheduled expiry jobs, and saved searches. Shared contracts have Vitest coverage. Admin and mobile currently have no test files and use pass-with-no-tests scripts.

## Live verification

With Docker running, migrate and seed the database, start the API, then verify registration, OTP, login, item creation, claim approval, conversation creation, handover completion, report resolution, audit logging, and MinIO uploads.