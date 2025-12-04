// =============================================================
//  FULL SITE ROUTER + BLOG + PAGE SWITCHING
//  Pretty URLs (GitHub Pages) + Hash fallback (Live Server)
// =============================================================

// ----------------------------------------
// Elements
// ----------------------------------------
const pages = document.querySelectorAll(".page");
const blogGallery = document.getElementById("blog-gallery");
const blogPostContainer = document.getElementById("blog-post");

// ----------------------------------------
// PAGE SWITCHING (Used Internally)
// ----------------------------------------
function showPage(id) {
  pages.forEach(p => p.classList.add("hidden"));
  const page = document.getElementById(id);
  if (page) page.classList.remove("hidden");
}

// ----------------------------------------
// PUBLICATIONS SORTING
// ----------------------------------------
document.getElementById("sort-options")?.addEventListener("change", e => {
  const sort = e.target.value;
  const pubs = [...document.querySelectorAll(".publication")];

  pubs.sort((a, b) => {
    const da = new Date(a.dataset.date);
    const db = new Date(b.dataset.date);
    return sort === "newest" ? db - da : da - db;
  });

  const gallery = document.getElementById("publication-gallery");
  pubs.forEach(p => gallery.appendChild(p));
});

// ----------------------------------------
// BLOG SYSTEM
// ----------------------------------------

// Load blog index
async function loadBlogIndex() {
  const res = await fetch("/blog_index.json");
  return res.json();
}

// Render the list of blog posts
async function renderBlogList() {
  blogGallery.innerHTML = "";
  blogGallery.classList.remove("hidden");
  blogPostContainer.classList.add("hidden");

  const posts = await loadBlogIndex();
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  posts.forEach(post => {
    const card = document.createElement("div");
    card.classList.add("blog-card");

    card.innerHTML = `
      <h3>${post.title}</h3>
      <p class="date">${post.date}</p>

      <a href="/blog/${post.slug}"
         onclick="routerNavigate('/blog/${post.slug}'); return false;">
         Read more →
      </a>
    `;

    blogGallery.appendChild(card);
  });
}

// Render Markdown blog post
async function renderBlogPost(filename) {
  const res = await fetch(`/blog-posts/${filename}`);
  let text = await res.text();

  // -----------------------------
  // REMOVE YAML FRONT-MATTER
  // -----------------------------
  // Matches:
  // ---
  // key: value
  // ---
  text = text.replace(/^---[\s\S]*?---/, "").trim();

  const converter = new showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    ghCompatibleHeaderId: true
  });

  const html = converter.makeHtml(text);

  blogPostContainer.innerHTML = `
    ${html}
    <br><br>
    <a href="/blog" onclick="routerNavigate('/blog'); return false;" class="back-link">
      ← Back to Thoughts
    </a>
  `;

  blogGallery.classList.add("hidden");
  blogPostContainer.classList.remove("hidden");
}


// ----------------------------------------
// ROUTER
// ----------------------------------------

// GitHub Pages 404 fallback
function getRedirectPath() {
  const val = sessionStorage.getItem("redirectPath");
  sessionStorage.removeItem("redirectPath");
  return val;
}

// Central router
async function router() {
  let path = window.location.pathname;
  let hash = window.location.hash;

  const redirected = getRedirectPath();
  if (redirected) path = redirected;

  // ---- Blog post: /blog/<slug> ----
  let match = path.match(/^\/blog\/([^\/]+)\/?$/);
  if (match) {
    const slug = match[1];
    const posts = await loadBlogIndex();
    const found = posts.find(p => p.slug === slug);

    if (found) {
      showPage("blog");
      renderBlogPost(found.file);
      return;
    }
  }

  // ---- Blog list: /blog ----
  if (path === "/blog" || path === "/blog/") {
    showPage("blog");
    renderBlogList();
    return;
  }

  // ---- Hash fallback (Live Server) ----
  match = hash.match(/^#\/blog\/([^\/]+)$/);
  if (match) {
    const slug = match[1];
    const posts = await loadBlogIndex();
    const found = posts.find(p => p.slug === slug);

    if (found) {
      showPage("blog");
      renderBlogPost(found.file);
      return;
    }
  }

  if (hash === "#/blog") {
    showPage("blog");
    renderBlogList();
    return;
  }

  // ---- Standard pages ----
  if (path === "/about" || path === "/") {
    showPage("about");
    return;
  }

  if (path === "/publications") {
    showPage("publications");
    return;
  }

  if (path === "/food") {
    showPage("food");
    return;
  }

  // Default → About
  showPage("about");
}

// Navigate programmatically
function routerNavigate(path) {
  history.pushState({}, "", path);
  router();
}

// Browser navigation
window.addEventListener("popstate", router);

// Load on page load
window.addEventListener("DOMContentLoaded", router);
