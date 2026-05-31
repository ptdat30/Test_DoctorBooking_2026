# ══════════════════════════════════════════════════════════════
# Stage 1 — Build  (Maven + JDK 21 Alpine)
# ══════════════════════════════════════════════════════════════
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# --- Layer 1: download dependencies (cached unless pom.xml changes) ---
COPY pom.xml .
RUN mvn dependency:go-offline -B --no-transfer-progress -q

# --- Layer 2: compile & package ---
COPY src ./src
RUN mvn clean package -DskipTests -B --no-transfer-progress -q \
    && ls -lh target/*.jar

# ══════════════════════════════════════════════════════════════
# Stage 2 — Runtime  (JRE 21 Alpine — ~85 MB)
# ══════════════════════════════════════════════════════════════
FROM eclipse-temurin:21-jre-alpine AS runtime

LABEL maintainer="DoctorBooking Team" \
      org.opencontainers.image.title="doctorbooking-backend" \
      org.opencontainers.image.description="Spring Boot 3.5 backend — production image" \
      org.opencontainers.image.version="1.0.0"

# --- Non-root user (security best practice) ---
RUN addgroup -S appgroup \
 && adduser  -S appuser -G appgroup -u 1001 -h /app -s /sbin/nologin \
 && apk add --no-cache tini

WORKDIR /app

# --- Copy entrypoint script (Docker Secrets loader) ---
COPY --chown=appuser:appgroup entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# --- Copy application JAR ---
COPY --from=builder --chown=appuser:appgroup /build/target/*.jar app.jar

USER appuser

EXPOSE 8080

# --- Healthcheck: Spring Boot Actuator /actuator/health ---
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--", "/app/entrypoint.sh"]