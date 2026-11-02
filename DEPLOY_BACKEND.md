# Railway deployment configuration for TRACE Backend
# Create a service on Railway, connect this repo, then set env vars in Railway dashboard

# Required environment variables (set in Railway dashboard):
# NODE_ENV=production
# PORT=3000
# DATABASE_URL=postgresql://... (Supabase pooler URI, port 6543, pgbouncer)
# DIRECT_URL=postgresql://... (Supabase direct URI, port 5432)
# JWT_ACCESS_SECRET=<your-secret>
# PRIVATE_DATA_KEY=<your-32-byte-hex-key>
# STUDENT_ID_HMAC_SECRET=<your-secret>
# ALLOWED_EMAIL_DOMAINS=students.muet.edu.pk,faculty.muet.edu.pk,admin.muet.edu.pk,hod.muet.edu.pk
# UNIVERSITY_NAME=Mehran University (MUET)
# UNIVERSITY_TIMEZONE=Asia/Karachi
# CAMPUS_CENTER_LAT=24.8607
# CAMPUS_CENTER_LNG=67.0011
# REDIS_URL=redis://localhost:6379

# Build command: pnpm install
# Start command: pnpm --filter @trace/api start:prod
# Health check: https://your-app.up.railway.app/api/v1/health
