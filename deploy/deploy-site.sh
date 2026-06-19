#!/bin/bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/lukejaros.com}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Deploying from ${REPO_ROOT} to ${DEPLOY_PATH}"

mkdir -p "${DEPLOY_PATH}"

rsync -av --delete \
  --exclude=".git" \
  --exclude=".github" \
  --exclude="deploy" \
  --exclude="scripts" \
  --exclude="api" \
  "${REPO_ROOT}/" "${DEPLOY_PATH}/"

echo "Deploy complete."
ls -la "${DEPLOY_PATH}" | head -20