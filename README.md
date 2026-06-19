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
- `script.js` — light client-side behavior