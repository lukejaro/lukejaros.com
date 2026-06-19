#!/bin/bash
set -euo pipefail

# Run this script ON THE MAC MINI (not your MacBook Air).
# It installs the GitHub Actions self-hosted runner for lukejaros.com.
#
# Before running:
# 1. On GitHub: repo → Settings → Actions → Runners → New self-hosted runner → macOS
# 2. Copy the registration token from that page (expires in ~1 hour)
# 3. Run: REGISTRATION_TOKEN="your-token" bash deploy/install-runner.sh

REPO_URL="https://github.com/lukejaro/lukejaros.com"
RUNNER_NAME="${RUNNER_NAME:-mac-mini}"
RUNNER_LABELS="${RUNNER_LABELS:-mac-mini,macOS}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner}"
RUNNER_VERSION="2.323.0"

if [[ -z "${REGISTRATION_TOKEN:-}" ]]; then
  echo "ERROR: Set REGISTRATION_TOKEN before running."
  echo ""
  echo "Get a token from:"
  echo "  ${REPO_URL}/settings/actions/runners/new"
  echo ""
  echo "Then run:"
  echo "  REGISTRATION_TOKEN=\"paste-token-here\" bash deploy/install-runner.sh"
  exit 1
fi

echo "==> Preparing runner directory at ${RUNNER_DIR}"
mkdir -p "${RUNNER_DIR}"
cd "${RUNNER_DIR}"

if [[ ! -f ./config.sh ]]; then
  ARCH="$(uname -m)"
  if [[ "${ARCH}" == "arm64" ]]; then
    RUNNER_ARCH="arm64"
  else
    RUNNER_ARCH="x64"
  fi

  echo "==> Downloading GitHub Actions runner v${RUNNER_VERSION} (${RUNNER_ARCH})"
  curl -o "actions-runner-osx-${RUNNER_ARCH}.tar.gz" -L \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-osx-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
  tar xzf "actions-runner-osx-${RUNNER_ARCH}.tar.gz"
  rm "actions-runner-osx-${RUNNER_ARCH}.tar.gz"
fi

echo "==> Configuring runner"
./config.sh \
  --url "${REPO_URL}" \
  --token "${REGISTRATION_TOKEN}" \
  --name "${RUNNER_NAME}" \
  --labels "${RUNNER_LABELS}" \
  --unattended \
  --replace

echo "==> Installing runner as a background service"
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status

echo ""
echo "Runner installed. Verify at:"
echo "  ${REPO_URL}/settings/actions/runners"
echo ""
echo "Next: ensure the site directory exists"
echo "  sudo mkdir -p /var/www/lukejaros.com"
echo "  sudo chown -R $(whoami):staff /var/www/lukejaros.com"
echo ""
echo "Optional: install Caddy for HTTPS"
echo "  bash deploy/setup-mac-mini.sh"