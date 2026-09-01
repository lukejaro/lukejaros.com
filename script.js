const STRAVA_REFRESH_MS = 5 * 60 * 1000;
const STRAVA_SOURCES = ["/api/strava", "data/strava-activities.json"];

function formatRelativeTime(isoDate) {
  if (!isoDate) return "";
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return "";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffSeconds < 604800) {
    const days = Math.floor(diffSeconds / 86400);
    return `${days}d ago`;
  }

  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function latestActivityLine(activity) {
  const when =
    formatRelativeTime(activity.startDate) || activity.relativeTime || "";
  const bits = [activity.name, activity.distanceLabel, when].filter(Boolean);
  return bits.join(" · ");
}

function renderQuietStrava(container, feed) {
  const activity = (feed.activities || [])[0];
  if (!activity) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  const link = document.createElement("a");
  link.href = activity.url || "https://strava.app.link/O4lWutDeKTb";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = latestActivityLine(activity);

  container.replaceChildren(link);
  container.hidden = false;
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
    renderQuietStrava(container, feed);
  } catch {
    container.hidden = true;
    container.replaceChildren();
  }
}

loadStravaFeed();
setInterval(loadStravaFeed, STRAVA_REFRESH_MS);
