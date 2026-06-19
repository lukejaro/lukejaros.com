#!/bin/bash
set -euo pipefail

# Run this script ON your Mac mini to prepare hosting for lukejaros.com.
# Usage: bash deploy/setup-mac-mini.sh

SITE_DIR="/var/www/lukejaros.com"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
CADDYFILE_SRC="$(cd "$(dirname "$0")" && pwd)/Caddyfile"

echo "==> Creating site directory at ${SITE_DIR}"
sudo mkdir -p "${SITE_DIR}"
sudo chown -R "${USER}:staff" "${SITE_DIR}"

echo "==> Installing Caddy (if needed)"
if ! command -v caddy >/dev/null 2>&1; then
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew is required. Install from https://brew.sh and re-run."
    exit 1
  fi
  brew install caddy
fi

echo "==> Installing Caddyfile"
sudo mkdir -p /etc/caddy /var/log/caddy
sudo cp "${CADDYFILE_SRC}" /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile

echo "==> Enable Caddy on boot"
echo "    brew services start caddy"
echo "    Or run manually: sudo caddy run --config /etc/caddy/Caddyfile"

echo ""
echo "Next steps:"
echo "1. Point DNS A records for lukejaros.com and www to your public IP"
echo "2. Forward ports 80 and 443 on your router to this Mac mini"
echo "3. Create a deploy user and SSH key for GitHub Actions"
echo "4. Add GitHub secrets: DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY, DEPLOY_PATH=${SITE_DIR}/"
echo ""
echo "Test locally: curl -I http://localhost"