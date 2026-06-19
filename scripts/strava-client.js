const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";

async function refreshAccessToken({
  clientId,
  clientSecret,
  refreshToken,
}) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Strava token refresh failed (${response.status}): ${detail}`);
  }

  return response.json();
}

async function fetchRecentActivities(accessToken, perPage = 6) {
  const url = new URL(STRAVA_ACTIVITIES_URL);
  url.searchParams.set("per_page", String(perPage));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Strava activities fetch failed (${response.status}): ${detail}`);
  }

  return response.json();
}

function formatDistance(meters, useMetric = false) {
  if (!meters) return "—";
  if (useMetric) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${(meters / 1609.344).toFixed(1)} mi`;
}

function formatElevation(meters, useMetric = false) {
  if (!meters) return "—";
  if (useMetric) {
    return `${Math.round(meters)} m`;
  }
  return `${Math.round(meters * 3.28084)} ft`;
}

function formatDuration(seconds) {
  if (!seconds) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatPace(activity, useMetric = false) {
  if (!activity.distance || !activity.moving_time) return "—";
  const perUnit = useMetric
    ? activity.moving_time / (activity.distance / 1000)
    : activity.moving_time / (activity.distance / 1609.344);
  const minutes = Math.floor(perUnit / 60);
  const seconds = Math.round(perUnit % 60)
    .toString()
    .padStart(2, "0");
  return useMetric
    ? `${minutes}:${seconds} /km`
    : `${minutes}:${seconds} /mi`;
}

function formatRelativeTime(isoDate) {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - then) / 1000));

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

function activityIcon(type) {
  const icons = {
    Run: "🏃",
    Ride: "🚴",
    Hike: "🥾",
    Walk: "🚶",
    Swim: "🏊",
    Workout: "💪",
    WeightTraining: "🏋️",
    VirtualRide: "🚴",
    VirtualRun: "🏃",
  };
  return icons[type] || "⚡";
}

function normalizeActivity(activity) {
  return {
    id: activity.id,
    name: activity.name,
    type: activity.sport_type || activity.type,
    icon: activityIcon(activity.sport_type || activity.type),
    startDate: activity.start_date,
    relativeTime: formatRelativeTime(activity.start_date),
    distance: activity.distance,
    distanceLabel: formatDistance(activity.distance),
    elevation: activity.total_elevation_gain,
    elevationLabel: formatElevation(activity.total_elevation_gain),
    duration: activity.moving_time,
    durationLabel: formatDuration(activity.moving_time),
    paceLabel: formatPace(activity),
    url: `https://www.strava.com/activities/${activity.id}`,
  };
}

async function getStravaFeed({ clientId, clientSecret, refreshToken, perPage = 6 }) {
  const token = await refreshAccessToken({ clientId, clientSecret, refreshToken });
  const activities = await fetchRecentActivities(token.access_token, perPage);

  return {
    updatedAt: new Date().toISOString(),
    athleteId: token.athlete?.id || null,
    activities: activities.map(normalizeActivity),
  };
}

module.exports = {
  getStravaFeed,
  normalizeActivity,
  formatDistance,
  formatDuration,
  formatElevation,
  formatPace,
  formatRelativeTime,
  activityIcon,
};