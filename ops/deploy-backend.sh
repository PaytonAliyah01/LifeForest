#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/home/ubuntu}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  echo "Docker Compose is not available on this machine."
  exit 1
fi

cd "$DEPLOY_PATH"

echo "Pulling latest backend image..."
$COMPOSE_CMD -f "$COMPOSE_FILE" pull backend

echo "Removing old backend container if it exists..."
$COMPOSE_CMD -f "$COMPOSE_FILE" rm -sf backend || true

echo "Restarting backend service..."
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d backend

echo "Cleaning unused images..."
docker image prune -f

echo "Backend deploy complete."
