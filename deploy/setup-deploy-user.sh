#!/bin/bash
set -euo pipefail

# Run on the Mac mini to create a dedicated deploy user for GitHub Actions.
# Usage: sudo bash deploy/setup-deploy-user.sh

DEPLOY_USER="${DEPLOY_USER:-deploy}"
SITE_DIR="/var/www/lukejaros.com"
KEY_DIR="/Users/${DEPLOY_USER}/.ssh"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo."
  exit 1
fi

if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  echo "==> Creating user ${DEPLOY_USER}"
  dscl . -create "/Users/${DEPLOY_USER}"
  dscl . -create "/Users/${DEPLOY_USER}" UserShell /bin/bash
  dscl . -create "/Users/${DEPLOY_USER}" RealName "Deploy User"
  dscl . -create "/Users/${DEPLOY_USER}" UniqueID "$(($(dscl . -list /Users UniqueID | awk '{print $2}' | sort -n | tail -1) + 1))"
  dscl . -create "/Users/${DEPLOY_USER}" PrimaryGroupID 20
  dscl . -create "/Users/${DEPLOY_USER}" NFSHomeDirectory "/Users/${DEPLOY_USER}"
  mkdir -p "/Users/${DEPLOY_USER}/.ssh"
  chmod 700 "/Users/${DEPLOY_USER}/.ssh"
  chown -R "${DEPLOY_USER}:staff" "/Users/${DEPLOY_USER}"
fi

mkdir -p "${SITE_DIR}"
chown -R "${DEPLOY_USER}:staff" "${SITE_DIR}"

echo "==> Add your GitHub Actions public key to:"
echo "   /Users/${DEPLOY_USER}/.ssh/authorized_keys"
echo ""
echo "Generate a key pair locally (on any machine):"
echo "   ssh-keygen -t ed25519 -C github-actions-lukejaros -f ~/.ssh/lukejaros_deploy -N \"\""
echo ""
echo "Copy the PUBLIC key to authorized_keys on this Mac mini."
echo "Add the PRIVATE key as the DEPLOY_SSH_KEY GitHub secret."