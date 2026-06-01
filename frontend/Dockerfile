# ══════════════════════════════════════════════════════════════
# Stage 1 — Build  (Node 20 Alpine)
# ══════════════════════════════════════════════════════════════
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# --- Layer 1: install dependencies (cached unless package*.json changes) ---
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit --no-fund --silent

# --- Layer 2: copy source and build ---
COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build \
    && echo "=== Build output ===" \
    && du -sh dist/

# ══════════════════════════════════════════════════════════════
# Stage 2 — Runtime  (nginx-unprivileged Alpine — non-root, port 8080)
# ══════════════════════════════════════════════════════════════
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

LABEL maintainer="DoctorBooking Team" \
      org.opencontainers.image.title="doctorbooking-frontend" \
      org.opencontainers.image.description="React 19 + Vite frontend served by Nginx — production image" \
      org.opencontainers.image.version="1.0.0"

# --- Copy built static assets ---
COPY --from=builder /app/dist /usr/share/nginx/html

# --- Copy nginx config template (envsubst replaces ${VITE_API_TARGET}) ---
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080

# --- Healthcheck ---
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO/dev/null --tries=1 http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]