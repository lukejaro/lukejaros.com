# lukejaros.com

Personal website for [lukejaros.com](https://lukejaros.com).

## Branches

| Branch | Purpose |
|--------|---------|
| `dev` | Development and staging — active work happens here |
| `main` | Production — deploys to the live site |

### Workflow

1. Make changes on `dev`
2. Preview and iterate locally with any static file server
3. Merge `dev` → `main` when ready to publish

```bash
# Preview locally
python3 -m http.server 8080
```

## Structure

- `index.html` — main page
- `styles.css` — site styles
- `script.js` — client-side behavior and Strava feed
- `data/strava-activities.json` — cached Strava activities (auto-updated)
- `api/strava.js` — serverless endpoint for live Strava fetches (Vercel)
- `scripts/sync-strava.js` — syncs activities into the JSON cache

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

The `Sync Strava activities` GitHub Action will update `data/strava-activities.json` every 15 minutes.

### 4. Optional: Vercel live API

If you deploy to Vercel, set the same three values as environment variables. The site will call `/api/strava` for on-demand activity fetches.

## Notion blog

The blog lives at `blog.html` and syncs from your Notion page:
https://cpqluke.notion.site/Blog-38451826f07e80fc92a3fdc2d45b6e35

### 1. Create a Notion integration

1. Go to https://www.notion.so/my-integrations
2. Create a new integration and copy the **Internal Integration Secret**

### 2. Share the Blog page

Open your Blog page in Notion → **⋯** → **Connect to** → select your integration.

### 3. Add GitHub secrets

- `NOTION_TOKEN` — integration secret
- `NOTION_BLOG_PAGE_ID` — optional, defaults to `38451826f07e80fc92a3fdc2d45b6e35`

The `Sync Notion blog` GitHub Action updates `data/blog-posts.json` hourly.

### 4. Optional: Vercel live API

Set `NOTION_TOKEN` (and optionally `NOTION_BLOG_PAGE_ID`) as Vercel environment variables for on-demand fetches via `/api/notion`.