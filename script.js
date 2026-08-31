const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const header = document.querySelector(".site-header");
if (header) {
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

const navCheckbox = document.querySelector(".nav-checkbox");
if (navCheckbox) {
  const syncNav = () => {
    navCheckbox.setAttribute("aria-expanded", String(navCheckbox.checked));
  };
  const closeNav = () => {
    navCheckbox.checked = false;
    syncNav();
  };

  syncNav();
  navCheckbox.addEventListener("change", syncNav);

  document.querySelectorAll("#site-nav a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });
}

const revealElements = document.querySelectorAll(".reveal");
if (revealElements.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

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
    year: "numeric",
  });
}

function formatUpdatedAt(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  return `Updated ${date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function renderStravaFeed(container, feed) {
  const activities = feed.activities || [];

  if (!activities.length) {
    container.innerHTML = `
      <div class="strava-empty">
        <p>No activities yet. Once Strava is connected, your latest runs and hikes will show up here.</p>
        <a class="button strava" href="https://strava.app.link/O4lWutDeKTb" target="_blank" rel="noopener noreferrer">
          <span class="strava-mark" aria-hidden="true"></span>
          View on Strava
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = activities
    .map(
      (activity) => `
        <a
          class="strava-card"
          href="${activity.url}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="strava-card-top">
            <span class="strava-type" aria-hidden="true">${activity.icon}</span>
            <div>
              <h3>${activity.name}</h3>
              <p class="strava-subtitle">${activity.type} · ${formatRelativeTime(activity.startDate) || activity.relativeTime}</p>
            </div>
          </div>
          <dl class="strava-stats">
            <div>
              <dt>Distance</dt>
              <dd>${activity.distanceLabel}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>${activity.durationLabel}</dd>
            </div>
            <div>
              <dt>Elevation</dt>
              <dd>${activity.elevationLabel}</dd>
            </div>
            <div>
              <dt>Pace</dt>
              <dd>${activity.paceLabel}</dd>
            </div>
          </dl>
        </a>
      `
    )
    .join("");
}

function renderStravaError(container, message) {
  container.innerHTML = `
    <div class="strava-empty">
      <p>${message}</p>
      <a class="button strava" href="https://strava.app.link/O4lWutDeKTb" target="_blank" rel="noopener noreferrer">
        <span class="strava-mark" aria-hidden="true"></span>
        Open Strava profile
      </a>
    </div>
  `;
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
  const meta = document.getElementById("strava-meta");
  if (!container) return;

  try {
    const feed = await fetchStravaFeed();
    renderStravaFeed(container, feed);

    if (meta) {
      const updated = formatUpdatedAt(feed.updatedAt);
      meta.textContent = updated
        ? `${updated} · auto-refreshes every 5 minutes`
        : "Auto-refreshes every 5 minutes";
    }
  } catch (error) {
    renderStravaError(
      container,
      "Strava feed is not connected yet. Add your API credentials to start showing live activities."
    );
    if (meta) {
      meta.textContent = "";
    }
  }
}

loadStravaFeed();
setInterval(loadStravaFeed, STRAVA_REFRESH_MS);