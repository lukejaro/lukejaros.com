const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const STRAVA_REFRESH_MS = 5 * 60 * 1000;
const STRAVA_SOURCES = ["/api/strava", "data/strava-activities.json"];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatRelativeTime(isoDate) {
  if (!isoDate) return "";
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return "";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fallbackNote() {
  return `
    <p>
      the miles live
      <a href="https://strava.app.link/O4lWutDeKTb" target="_blank" rel="noopener noreferrer">over here</a>.
    </p>
  `;
}

function renderStravaFeed(container, feed) {
  const activities = (feed.activities || []).slice(0, 3);

  if (!activities.length) {
    container.innerHTML = fallbackNote();
    return;
  }

  container.innerHTML = activities
    .map((activity) => {
      const when = formatRelativeTime(activity.startDate) || activity.relativeTime || "";
      const bits = [activity.distanceLabel, when].filter(Boolean).join(" · ");
      return `
        <p>
          <a href="${escapeHtml(activity.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(activity.name)}${bits ? ` — ${escapeHtml(bits)}` : ""}
          </a>
        </p>
      `;
    })
    .join("");
}

async function fetchStravaFeed() {
  let lastError = null;

  for (const source of STRAVA_SOURCES) {
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) {
        lastError = new Error(`${source} returned ${response.status}`);
        continue;
      }

      const feed = await response.json();
      if (feed.error && !feed.activities?.length) {
        lastError = new Error(feed.error);
        continue;
      }

      return feed;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to load Strava feed.");
}

async function loadStravaFeed() {
  const container = document.getElementById("strava-feed");
  if (!container) return;

  try {
    const feed = await fetchStravaFeed();
    renderStravaFeed(container, feed);
  } catch (error) {
    container.innerHTML = fallbackNote();
  }
}

loadStravaFeed();
setInterval(loadStravaFeed, STRAVA_REFRESH_MS);
