#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { getNotionBlogFeed } = require("./notion-client");

async function main() {
  const token = process.env.NOTION_TOKEN;
  const blogPageId =
    process.env.NOTION_BLOG_PAGE_ID || "38451826-f07e-80fc-92a3-fdc2d45b6e35";

  if (!token) {
    console.error("Missing NOTION_TOKEN environment variable.");
    process.exit(1);
  }

  const feed = await getNotionBlogFeed({
    token,
    blogPageId,
  });

  const outputPath = path.join(__dirname, "..", "data", "blog-posts.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(feed, null, 2)}\n`);

  console.log(`Wrote ${feed.posts.length} posts to ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});