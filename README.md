# lukejaros.com

Personal website for [lukejaros.com](https://lukejaros.com).

## Branches

| Branch | Purpose |
|--------|---------|
| `dev` | Development and staging — active work happens here |
| `main` | Production — deploys to the live site |

### Workflow

1. Make changes on `dev` (Cloudflare publishes a preview URL for this branch)
2. Preview locally: `python3 -m http.server 8080`
3. Merge `dev` → `main` when ready to publish
4. Push to `main` deploys production on Cloudflare Pages

## Structure

- `index.html` — full-screen photo journal
- `styles.css` — stills, captions, and the last-frame links
- `script.js` — optional quiet Strava line on the last still
- `404.html` — same look as the opening still
- `data/strava-activities.json` — cached Strava activities (auto-updated)
- `_headers` / `_redirects` / `wrangler.toml` — Cloudflare Pages config
- `deploy/` — previous Mac mini hosting setup (Caddy, scripts)

## Hosting on Cloudflare Pages

The live site is a static HTML/CSS/JS project. Cloudflare Pages builds from GitHub: push to `main` → [lukejaros.com](https://lukejaros.com) updates. No Mac mini, port forwarding, or Caddy required.

**Dashboard:** [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**

### Connect the repo (first time)

1. Create a free Cloudflare account.
2. **Workers & Pages** → **Create** → **Pages** → **Import an existing Git repository**.
3. Authorize GitHub and select `lukejaro/lukejaros.com`.
4. Use these build settings:

| Setting | Value |
|--------|--------|
| Project name | `lukejaros` |
| Production branch | `main` |
| Build command | `exit 0` |
| Build output directory | `/` |

5. Deploy. You should get a URL like `https://lukejaros.pages.dev`.

`wrangler.toml` already sets `pages_build_output_dir = "."`. Preview deploys from `dev` happen automatically.

### Point lukejaros.com at Cloudflare

Apex domains (`lukejaros.com`) need the domain on Cloudflare DNS (free).

1. In Cloudflare, **Add a site** → `lukejaros.com` → Free plan.
2. Cloudflare will show two nameservers (like `ada.ns.cloudflare.com` and `bob.ns.cloudflare.com`).
3. At the registrar (Squarespace), replace the current nameservers with Cloudflare’s. Keep any **MX / email** records — copy them into the Cloudflare DNS zone first if they exist.
4. Wait until the zone is **Active**.
5. In the Pages project → **Custom domains** → add `lukejaros.com` and `www.lukejaros.com`.
6. Cloudflare creates the DNS records. HTTPS is automatic.

`_redirects` sends `www.lukejaros.com` → `lukejaros.com`.

Until nameservers finish propagating, `*.pages.dev` is live.

### After cutover

You can stop the Mac mini runner and ignore [deploy/MAC-MINI-SETUP.md](deploy/MAC-MINI-SETUP.md). `.github/workflows/deploy.yml` still deploys to the mini until you delete it — leave it until DNS is on Cloudflare so the old host stays as a fallback.

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