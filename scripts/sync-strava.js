#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { getStravaFeed } = require("./strava-client");

async function main() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error(
      "Missing Strava credentials. Set STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN."
    );
    process.exit(1);
  }

  const feed = await getStravaFeed({
    clientId,
    clientSecret,
    refreshToken,
    perPage: 6,
  });

  const outputPath = path.join(__dirname, "..", "data", "strava-activities.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  let previous = {};
  try {
    previous = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } catch {
    previous = {};
  }

  if (activityFingerprint(previous) === activityFingerprint(feed)) {
    console.log("No activity changes; leaving existing feed in place.");
    return;
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(feed, null, 2)}\n`);
  console.log(`Wrote ${feed.activities.length} activities to ${outputPath}`);
}

function activityFingerprint(feed) {
  return JSON.stringify(
    (feed.activities || []).map((activity) => ({
      id: activity.id,
      name: activity.name,
      type: activity.type,
      startDate: activity.startDate,
      distance: activity.distance,
      elevation: activity.elevation,
      duration: activity.duration,
      distanceLabel: activity.distanceLabel,
      elevationLabel: activity.elevationLabel,
      durationLabel: activity.durationLabel,
      paceLabel: activity.paceLabel,
      url: activity.url,
    }))
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});