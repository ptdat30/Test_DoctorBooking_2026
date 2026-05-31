#!/bin/sh
# ══════════════════════════════════════════════════════════════
# DoctorBooking Backend — Entrypoint Script
# Loads Docker Secrets → environment variables, then starts JVM
# ══════════════════════════════════════════════════════════════
set -e

# ── Docker Secrets Loader ─────────────────────────────────────
# Reads /run/secrets/<name> and exports as $VAR_NAME if file exists.
load_secret() {
  local var_name="$1"
  local secret_name="$2"
  local secret_file="/run/secrets/${secret_name}"
  if [ -f "$secret_file" ]; then
    # shellcheck disable=SC2163
    export "$var_name"="$(cat "$secret_file")"
    echo "[entrypoint] Secret '${secret_name}' loaded into \$${var_name}" >&2
  fi
}

load_secret DB_PASSWORD         db_password
load_secret JWT_SECRET          jwt_secret
load_secret GOOGLE_AI_API_KEY   google_ai_api_key
load_secret GROQ_API_KEY        groq_api_key
load_secret SMTP_PASSWORD       smtp_password
load_secret VNPAY_HASH_SECRET   vnpay_hash_secret

# ── JVM Flags (container-aware) ───────────────────────────────
JAVA_OPTS="${JAVA_OPTS:-} \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -XX:+UseG1GC \
  -XX:+ExitOnOutOfMemoryError \
  -Djava.security.egd=file:/dev/./urandom \
  -Dfile.encoding=UTF-8 \
  -Dspring.output.ansi.enabled=NEVER"

# ── Spring Boot Structured Logging (JSON → stdout) ────────────
# Spring Boot 3.4+ native JSON logging (ECS format)
export SPRING_LOGGING_STRUCTURED_FORMAT_CONSOLE="${SPRING_LOGGING_STRUCTURED_FORMAT_CONSOLE:-ecs}"

echo "[entrypoint] Starting DoctorBooking backend..." >&2

# exec replaces shell process so tini/PID1 gets the JVM
# shellcheck disable=SC2086
exec java $JAVA_OPTS -jar /app/app.jar "$@"
