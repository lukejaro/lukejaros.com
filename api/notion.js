const { getNotionBlogFeed } = require("../scripts/notion-client");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  const token = process.env.NOTION_TOKEN;
  const blogPageId =
    process.env.NOTION_BLOG_PAGE_ID || "38451826-f07e-80fc-92a3-fdc2d45b6e35";

  if (!token) {
    return res.status(503).json({
      error: "Notion API is not configured yet.",
      hint: "Add NOTION_TOKEN and optionally NOTION_BLOG_PAGE_ID.",
    });
  }

  try {
    const feed = await getNotionBlogFeed({ token, blogPageId });
    return res.status(200).json(feed);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load Notion blog posts.",
      detail: error.message,
    });
  }
};