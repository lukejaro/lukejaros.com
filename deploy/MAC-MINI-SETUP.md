# Mac mini setup guide

Set this up **on the Mac mini**, not your MacBook Air. Your MacBook is where you code and push to GitHub; the Mac mini hosts the site and runs the deploy runner.

## How it works

```
MacBook Air                    GitHub                         Mac mini
───────────                    ──────                         ────────
edit on dev  ──push──►  lukejaro/lukejaros.com
merge to main ──push──►  triggers "Deploy to Mac mini"
                              │
                              └──► self-hosted runner picks up job
                                   └──► copies files to /var/www/lukejaros.com
```

Every push to `main` automatically updates the live site on the Mac mini.

---

## Step 1: Prepare the Mac mini

SSH or sit at the Mac mini and run:

```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Clone the repo
git clone https://github.com/lukejaro/lukejaros.com.git
cd lukejaros.com
```

## Step 2: Create the site directory

```bash
sudo mkdir -p /var/www/lukejaros.com
sudo chown -R "$(whoami):staff" /var/www/lukejaros.com
```

## Step 3: Install the GitHub Actions runner

1. On your MacBook (or any browser), open:
   **https://github.com/lukejaro/lukejaros.com/settings/actions/runners/new**

2. Select **macOS** → **ARM64** (Apple Silicon) or **x64** (Intel Mac mini)

3. Copy the **registration token** shown on that page

4. Back on the **Mac mini**, run:

```bash
cd ~/lukejaros.com
REGISTRATION_TOKEN="paste-token-here" bash deploy/install-runner.sh
```

5. Confirm the runner appears as **Idle** at:
   **https://github.com/lukejaro/lukejaros.com/settings/actions/runners**

The runner installs as a background service and starts automatically on boot.

## Step 4: Serve the site (Caddy + HTTPS)

```bash
bash deploy/setup-mac-mini.sh
brew services start caddy
```

## Step 5: DNS and router

**DNS** (at your registrar):

| Host | Type | Value |
|------|------|-------|
| `@` | A | your public IP |
| `www` | A | your public IP |

**Router:** forward ports **80** and **443** to the Mac mini's local IP.

---

## Step 6: Test the deploy

On your **MacBook Air**:

```bash
cd lukejaros.com
git checkout main
git pull
# make a tiny change, or just:
git commit --allow-empty -m "Test deploy pipeline"
git push origin main
```

Watch the workflow at:
**https://github.com/lukejaro/lukejaros.com/actions**

On the Mac mini, confirm files updated:

```bash
ls -la /var/www/lukejaros.com
```

---

## Daily workflow (MacBook Air)

```bash
git checkout dev
# ... make changes ...
git add -A && git commit -m "Your message" && git push origin dev

# when ready for production:
git checkout main
git merge dev
git push origin main    # ← this triggers deploy on Mac mini
git checkout dev
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Runner offline | On Mac mini: `cd ~/actions-runner && sudo ./svc.sh status` |
| Job queued forever | Runner must be online; check labels match `mac-mini` |
| Permission denied on deploy | `sudo chown -R $(whoami):staff /var/www/lukejaros.com` |
| Intel Mac mini | Edit `install-runner.sh` to download `actions-runner-osx-x64-*.tar.gz` instead |

### Runner commands (on Mac mini)

```bash
cd ~/actions-runner
sudo ./svc.sh status
sudo ./svc.sh stop
sudo ./svc.sh start
```