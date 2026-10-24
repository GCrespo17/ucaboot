# Production image: builds the frontend and serves it with nginx, which also routes
# /api, /socket.io and /auth/v1. Build context: repo root (see docker-compose.yml).

FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
# Vite embeds VITE_* variables at build time
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN npm run build

FROM nginx:alpine
COPY nginx/templates/ /etc/nginx/templates/
COPY --from=frontend /app/dist /usr/share/nginx/html
