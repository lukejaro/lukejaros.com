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

const BLOG_SOURCES = ["/api/notion", "data/blog-posts.json"];

function formatDate(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatUpdatedAt(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  return `Synced ${date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

async function fetchBlogFeed() {
  let lastError = null;

  for (const source of BLOG_SOURCES) {
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) {
        lastError = new Error(`${source} returned ${response.status}`);
        continue;
      }

      const feed = await response.json();
      if (feed.error && !feed.posts?.length) {
        lastError = new Error(feed.error);
        continue;
      }

      return feed;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to load blog feed.");
}

function renderBlogList(container, feed) {
  const posts = feed.posts || [];

  if (!posts.length) {
    container.innerHTML = `
      <div class="blog-empty">
        <p>No posts synced yet. Connect your Notion blog to publish here, or write directly in Notion.</p>
        <a
          class="button primary"
          href="${feed.sourceUrl || "https://cpqluke.notion.site/Blog-38451826f07e80fc92a3fdc2d45b6e35"}"
          target="_blank"
          rel="noopener noreferrer"
        >View Notion blog</a>
      </div>
    `;
    return;
  }

  container.innerHTML = posts
    .map(
      (post) => `
        <article class="blog-card">
          <p class="blog-date">${formatDate(post.date)}</p>
          <h2><a href="post.html?slug=${encodeURIComponent(post.slug)}">${post.title}</a></h2>
          <p class="blog-excerpt">${post.excerpt || ""}</p>
          <div class="blog-card-actions">
            <a class="blog-read-more" href="post.html?slug=${encodeURIComponent(post.slug)}">Read post →</a>
            <a class="blog-notion-post" href="${post.notionUrl}" target="_blank" rel="noopener noreferrer">Notion</a>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPost(container, post) {
  document.title = `${post.title} · Luke Jaroszewski`;

  container.innerHTML = `
    <header class="post-header">
      <p class="blog-date">${formatDate(post.date)}</p>
      <h1>${post.title}</h1>
      <a class="blog-notion-post" href="${post.notionUrl}" target="_blank" rel="noopener noreferrer">View on Notion</a>
    </header>
    <div class="post-body">${post.contentHtml || "<p>No content available.</p>"}</div>
  `;
}

function renderError(container, message) {
  container.innerHTML = `
    <div class="blog-empty">
      <p>${message}</p>
      <a
        class="button primary"
        href="https://cpqluke.notion.site/Blog-38451826f07e80fc92a3fdc2d45b6e35"
        target="_blank"
        rel="noopener noreferrer"
      >Read on Notion</a>
    </div>
  `;
}

async function initBlogList() {
  const container = document.getElementById("blog-feed");
  const meta = document.getElementById("blog-meta");
  if (!container) return;

  try {
    const feed = await fetchBlogFeed();
    renderBlogList(container, feed);
    if (meta) {
      meta.textContent = formatUpdatedAt(feed.updatedAt);
    }
  } catch (error) {
    renderError(
      container,
      "Blog feed is not connected yet. Add your Notion integration token to start syncing posts."
    );
    if (meta) meta.textContent = "";
  }
}

async function initBlogPost() {
  const container = document.getElementById("post-content");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const id = params.get("id");

  if (!slug && !id) {
    window.location.href = "blog.html";
    return;
  }

  try {
    const feed = await fetchBlogFeed();
    const post = feed.posts.find(
      (item) => item.slug === slug || item.id === id
    );

    if (!post) {
      renderError(container, "Post not found.");
      return;
    }

    renderPost(container, post);
  } catch (error) {
    renderError(
      container,
      "Unable to load this post. You can still read it on Notion."
    );
  }
}

if (document.getElementById("blog-feed")) {
  initBlogList();
}

if (document.getElementById("post-content")) {
  initBlogPost();
}