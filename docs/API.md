# API

Base URL: `http://localhost:3000/api/v1`

All successful responses use `{ data, meta? }`. Errors use `{ error: { code, message, details? } }`.

## Core routes

- Auth: `/auth/register`, `/auth/verify-email`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/change-password`
- Users: `/users/me`, `/users/:id/public`, device-token and notification-preference routes
- Items: `/items`, `/items/:id`, `/items/mine`, ownership lifecycle, bookmarks, categories and locations
- Claims: `/items/:itemId/claims`, claim review, approval/rejection, handover code and completion
- Chat: `/conversations`, `/conversations/:id/messages`, claim conversation creation
- Notifications: `/notifications`, unread count, read actions
- Reports: `/reports`, `/admin/reports`, moderator resolution
- Uploads: `/uploads/presign`, `/uploads/confirm`

Interactive Swagger documentation is served at `/docs` when the API is running. Socket.IO uses `/realtime` and authenticates with `handshake.auth.token`.