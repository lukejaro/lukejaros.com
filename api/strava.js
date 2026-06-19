const { getStravaFeed } = require("../scripts/strava-client");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return res.status(503).json({
      error: "Strava API is not configured yet.",
      hint: "Add STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN.",
    });
  }

  try {
    const feed = await getStravaFeed({
      clientId,
      clientSecret,
      refreshToken,
      perPage: 6,
    });
    return res.status(200).json(feed);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load Strava activities.",
      detail: error.message,
    });
  }
};