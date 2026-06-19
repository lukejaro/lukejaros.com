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

Deploys use a **self-hosted GitHub Actions runner** on the Mac mini. Push to `main` → site updates automatically.

**Full setup guide:** [deploy/MAC-MINI-SETUP.md](deploy/MAC-MINI-SETUP.md)

Quick summary:

1. On the **Mac mini**, install the runner: `REGISTRATION_TOKEN="..." bash deploy/install-runner.sh`
2. Create site directory: `sudo mkdir -p /var/www/lukejaros.com && sudo chown -R $(whoami):staff /var/www/lukejaros.com`
3. Install Caddy: `bash deploy/setup-mac-mini.sh`
4. Point DNS + forward ports 80/443

No SSH secrets needed — the runner on the Mac mini pulls jobs from GitHub directly.

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