# lukejaros.com

Personal website for [lukejaros.com](https://lukejaros.com).

## Branches

| Branch | Purpose |
|--------|---------|
| `dev` | Development and staging — active work happens here |
| `main` | Production — deploys to the live site |

### Workflow

1. Make changes on `dev`
2. Preview locally: `python3 -m http.server 8080`
3. Merge `dev` → `main` when ready to publish
4. Push to `main` triggers automatic deployment to the Mac mini

## Structure

- `index.html` — main page
- `styles.css` — site styles
- `script.js` — client-side behavior and Strava feed
- `data/strava-activities.json` — cached Strava activities (auto-updated)
- `deploy/` — Mac mini hosting setup (Caddy, scripts)

## Hosting on Mac mini

The site is a static HTML/CSS/JS site served by **Caddy** on your Mac mini.

### 1. Prepare the Mac mini

SSH into the Mac mini and clone the repo (or copy the `deploy/` folder), then run:

```bash
bash deploy/setup-mac-mini.sh
sudo bash deploy/setup-deploy-user.sh
```

### 2. DNS

At your domain registrar, add **A records** pointing to your home public IP:

| Host | Type | Value |
|------|------|-------|
| `@` | A | your public IP |
| `www` | A | your public IP |

If your IP changes often, use a **Cloudflare Tunnel** or dynamic DNS instead.

### 3. Router

Forward ports **80** and **443** to the Mac mini's local IP.

### 4. GitHub Actions deploy secrets

In the repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Example | Purpose |
|--------|---------|---------|
| `DEPLOY_HOST` | `192.168.1.50` or `macmini.yourdomain.com` | Mac mini SSH host |
| `DEPLOY_USER` | `deploy` | SSH user with write access to the site folder |
| `DEPLOY_SSH_KEY` | private key contents | SSH key for deploy user |
| `DEPLOY_PATH` | `/var/www/lukejaros.com/` | Remote directory (trailing slash required) |

Generate a deploy key:

```bash
ssh-keygen -t ed25519 -C github-actions-lukejaros -f ~/.ssh/lukejaros_deploy -N ""
```

Add `lukejaros_deploy.pub` to `/Users/deploy/.ssh/authorized_keys` on the Mac mini.
Add the **private** key as `DEPLOY_SSH_KEY`.

### 5. Deploy

Every push to `main` runs `.github/workflows/deploy.yml` and rsyncs the site to the Mac mini.

Manual deploy: **Actions → Deploy to Mac mini → Run workflow**

## Strava live feed

The site shows your latest Strava activities and refreshes every 5 minutes.

### 1. Create a Strava API app

1. Go to https://www.strava.com/settings/api
2. Create an application
3. Set **Authorization Callback Domain** to `localhost` for local testing

### 2. Get a refresh token

Open this URL (replace `YOUR_CLIENT_ID`):

```
https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
```

Exchange the returned `code` for tokens:

```bash
curl -X POST https://www.strava.com/oauth/token \
  -F client_id=YOUR_CLIENT_ID \
  -F client_secret=YOUR_CLIENT_SECRET \
  -F code=YOUR_CODE \
  -F grant_type=authorization_code
```

Save the `refresh_token` from the response.

### 3. Add GitHub secrets

In the repo settings, add:

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REFRESH_TOKEN`

The `Sync Strava activities` GitHub Action updates `data/strava-activities.json` every 15 minutes on `main`.