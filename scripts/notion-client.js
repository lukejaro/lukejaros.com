const NOTION_VERSION = "2022-06-28";
const NOTION_API = "https://api.notion.com/v1";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function richTextToPlain(richText = []) {
  return richText.map((item) => item.plain_text).join("");
}

function richTextToHtml(richText = []) {
  return richText
    .map((item) => {
      let text = item.plain_text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      if (item.annotations?.code) {
        text = `<code>${text}</code>`;
      }
      if (item.annotations?.bold) {
        text = `<strong>${text}</strong>`;
      }
      if (item.annotations?.italic) {
        text = `<em>${text}</em>`;
      }
      if (item.href) {
        text = `<a href="${item.href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      return text;
    })
    .join("");
}

async function notionRequest(token, path, options = {}) {
  const response = await fetch(`${NOTION_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Notion API ${path} failed (${response.status}): ${detail}`);
  }

  return response.json();
}

async function getAllBlockChildren(token, blockId) {
  const blocks = [];
  let cursor;

  do {
    const query = cursor ? `?start_cursor=${cursor}` : "";
    const data = await notionRequest(token, `/blocks/${blockId}/children${query}`);
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return blocks;
}

function blockToHtml(block) {
  const type = block.type;

  switch (type) {
    case "paragraph": {
      const text = richTextToHtml(block.paragraph.rich_text);
      return text ? `<p>${text}</p>` : "";
    }
    case "heading_1":
      return `<h2>${richTextToHtml(block.heading_1.rich_text)}</h2>`;
    case "heading_2":
      return `<h3>${richTextToHtml(block.heading_2.rich_text)}</h3>`;
    case "heading_3":
      return `<h4>${richTextToHtml(block.heading_3.rich_text)}</h4>`;
    case "bulleted_list_item":
      return `<li>${richTextToHtml(block.bulleted_list_item.rich_text)}</li>`;
    case "numbered_list_item":
      return `<li>${richTextToHtml(block.numbered_list_item.rich_text)}</li>`;
    case "quote":
      return `<blockquote>${richTextToHtml(block.quote.rich_text)}</blockquote>`;
    case "divider":
      return "<hr />";
    case "code":
      return `<pre><code>${richTextToPlain(block.code.rich_text)}</code></pre>`;
    case "image": {
      const src =
        block.image.type === "external"
          ? block.image.external.url
          : block.image.file?.url;
      const caption = richTextToPlain(block.image.caption);
      return src
        ? `<figure><img src="${src}" alt="${caption || ""}" loading="lazy" />${
            caption ? `<figcaption>${caption}</figcaption>` : ""
          }</figure>`
        : "";
    }
    case "callout":
      return `<div class="notion-callout">${richTextToHtml(block.callout.rich_text)}</div>`;
    default:
      return "";
  }
}

async function blocksToHtml(token, blockId) {
  const blocks = await getAllBlockChildren(token, blockId);
  let html = "";
  let listType = null;

  const flushList = () => {
    if (!listType) return;
    html += `</${listType}>`;
    listType = null;
  };

  for (const block of blocks) {
    if (block.type === "bulleted_list_item") {
      if (listType !== "ul") {
        flushList();
        html += "<ul>";
        listType = "ul";
      }
      html += blockToHtml(block);
      continue;
    }

    if (block.type === "numbered_list_item") {
      if (listType !== "ol") {
        flushList();
        html += "<ol>";
        listType = "ol";
      }
      html += blockToHtml(block);
      continue;
    }

    flushList();
    html += blockToHtml(block);
  }

  flushList();
  return html;
}

function getTitleFromPage(page) {
  const props = page.properties || {};
  if (props.Name?.title) {
    return richTextToPlain(props.Name.title);
  }
  if (props.Title?.title) {
    return richTextToPlain(props.Title.title);
  }
  return page.title || "Untitled";
}

function getDateFromPage(page) {
  const props = page.properties || {};
  const dateProp =
    props.Date?.date?.start ||
    props.Published?.date?.start ||
    props["Publish Date"]?.date?.start;
  return dateProp || page.created_time?.slice(0, 10) || null;
}

function getExcerptFromPage(page, fallback = "") {
  const props = page.properties || {};
  const summary =
    props.Summary?.rich_text ||
    props.Excerpt?.rich_text ||
    props.Description?.rich_text;
  if (summary?.length) {
    return richTextToPlain(summary);
  }
  return fallback;
}

async function tryFetchDatabasePosts(token, blogId) {
  try {
    const data = await notionRequest(token, `/databases/${blogId}/query`, {
      method: "POST",
      body: JSON.stringify({
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      }),
    });

    return data.results;
  } catch (error) {
    if (String(error.message).includes("(404)")) {
      return null;
    }
    throw error;
  }
}

async function fetchChildPagePosts(token, blogId) {
  const blocks = await getAllBlockChildren(token, blogId);
  const childPages = blocks.filter((block) => block.type === "child_page");

  return childPages.map((block) => ({
    id: block.id,
    title: block.child_page.title,
    created_time: block.created_time,
    last_edited_time: block.last_edited_time,
    properties: {},
    public_url: null,
  }));
}

async function buildPost(token, page, publicSiteBase) {
  const title = getTitleFromPage(page);
  const slug = slugify(title);
  const contentHtml = await blocksToHtml(token, page.id);
  const plain = contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const excerpt = getExcerptFromPage(page, plain.slice(0, 180));

  return {
    id: page.id,
    slug,
    title,
    excerpt,
    date: getDateFromPage(page),
    notionUrl:
      page.public_url ||
      page.url ||
      `${publicSiteBase}/${slug}-${page.id.replace(/-/g, "")}`,
    contentHtml,
  };
}

async function getNotionBlogFeed({
  token,
  blogPageId,
  publicSiteUrl = "https://cpqluke.notion.site/Blog-38451826f07e80fc92a3fdc2d45b6e35",
}) {
  const databasePages = await tryFetchDatabasePosts(token, blogPageId);
  const pages =
    databasePages || (await fetchChildPagePosts(token, blogPageId));

  const posts = [];
  for (const page of pages) {
    posts.push(await buildPost(token, page, publicSiteUrl));
  }

  posts.sort((a, b) => {
    const aDate = a.date || "";
    const bDate = b.date || "";
    return bDate.localeCompare(aDate);
  });

  return {
    updatedAt: new Date().toISOString(),
    sourceUrl: publicSiteUrl,
    blogPageId,
    posts,
  };
}

module.exports = {
  getNotionBlogFeed,
  slugify,
  richTextToPlain,
};