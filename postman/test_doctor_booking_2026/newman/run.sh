#!/usr/bin/env bash
# Newman runner for test_doctor_booking_2026 API Automation Suite
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COLLECTION="$ROOT/test_doctor_booking_2026.postman_collection.json"
ENVIRONMENT="$ROOT/test_doctor_booking_2026.postman_environment.json"
REPORTS="$ROOT/reports"
mkdir -p "$REPORTS"

FOLDER="${1:-}"
DATA="${2:-}"

ARGS=(
  run "$COLLECTION"
  -e "$ENVIRONMENT"
  --reporters cli,htmlextra,json
  --reporter-htmlextra-export "$REPORTS/report.html"
  --reporter-json-export "$REPORTS/report.json"
  --timeout-request 10000
  --delay-request 100
)

if [[ -n "$FOLDER" ]]; then
  ARGS+=(--folder "$FOLDER")
else
  ARGS+=(-d "$ROOT/data/users_login.json")
fi

if [[ -n "$DATA" ]]; then
  ARGS+=(-d "$ROOT/data/$DATA")
fi

echo "Running: newman ${ARGS[*]}"
newman "${ARGS[@]}"
