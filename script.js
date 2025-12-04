// =============================================================
//  HASH-BASED ROUTER — STABLE, SIMPLE, WORKS EVERYWHERE
//  Routes: #about, #publications, #blog, #blog/<slug>, #food
// =============================================================

// Cache page elements
const pages = document.querySelectorAll(".page");
const blogGallery = document.getElementById("blog-gallery");
const blogPostContainer = document.getElementById("blog-post");

// ------------------------------
// Generic page switching
// ------------------------------
function showPage(id) {
  pages.forEach(p => p.classList.add("hidden"));
  const page = document.getElementById(id);
  if (page) page.classList.remove("hidden");
}

// ------------------------------
// Set active nav link
// ------------------------------
function setActiveNav(target) {
  document.querySelectorAll("nav a").forEach(a => {
    if (a.getAttribute("href") === target) {
      a.classList.add("active");
    } else {
      a.classList.remove("active");
    }
  });
}

// =============================================================
// PUBLICATIONS SORTING
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const pubSort = document.getElementById("sort-options");
  if (pubSort) {
    pubSort.addEventListener("change", () => {
      const sortBy = pubSort.value;
      const entries = [...document.querySelectorAll(".publication")];

      entries.sort((a, b) => {
        const da = new Date(a.dataset.date);
        const db = new Date(b.dataset.date);
        return sortBy === "newest" ? db - da : da - db;
      });

      const gallery = document.getElementById("publication-gallery");
      entries.forEach(p => gallery.appendChild(p));
    });
  }

  const blogSort = document.getElementById("blog-sort-options");
  if (blogSort) {
    blogSort.addEventListener("change", () => {
      renderBlogList();
    });
  }
});

// =============================================================
// BLOG SYSTEM
// =============================================================

// Load blog index
async function loadBlogIndex() {
  const res = await fetch("blog_index.json");
  return res.json();
}

// Render blog list
async function renderBlogList() {
  if (!blogGallery) return;

  blogGallery.innerHTML = "";

  const posts = await loadBlogIndex();
  const sortOrder = document.getElementById("blog-sort-options")?.value || "oldest";

  posts.sort((a, b) =>
    sortOrder === "newest"
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date)
  );

  posts.forEach(post => {
    const card = document.createElement("div");
    card.classList.add("blog-card");

    card.innerHTML = `
      <h3>${post.title}</h3>
      <p class="date">${post.date}</p>
      <a href="#blog/${post.slug}">Read more →</a>
    `;

    blogGallery.appendChild(card);
  });

  blogGallery.classList.remove("hidden");
  blogPostContainer.classList.add("hidden");
}

// Render a single blog post
async function renderBlogPost(filename) {
  const res = await fetch(`blog-posts/${filename}`);
  let text = await res.text();

  // Remove YAML front matter
  text = text.replace(/^---[\s\S]*?---/, "").trim();

  const converter = new showdown.Converter({
    tables: true,
    simplifiedAutoLink: true
  });

  const html = converter.makeHtml(text);

  blogPostContainer.innerHTML = `
    ${html}
    <br><br>
    <a href="#blog" class="back-link">← Back to Thoughts</a>
  `;

  blogGallery.classList.add("hidden");
  blogPostContainer.classList.remove("hidden");
}

// =============================================================
// HASH ROUTER
// =============================================================
async function routeFromHash() {
  let hash = window.location.hash || "#about";

  // Normalize case
  if (hash.endsWith("/") && hash !== "/") {
    hash = hash.slice(0, -1);
  }

  // --------------------------
  // Blog post
  // --------------------------
  const match = hash.match(/^#blog\/([^\/]+)$/);
  if (match) {
    const slug = match[1];
    const posts = await loadBlogIndex();
    const entry = posts.find(p => p.slug === slug);

    if (entry) {
      showPage("blog");
      setActiveNav("#blog");
      renderBlogPost(entry.file);
      return;
    }
  }

  // --------------------------
  // Blog list
  // --------------------------
  if (hash === "#blog") {
    showPage("blog");
    setActiveNav("#blog");
    renderBlogList();
    return;
  }

  // --------------------------
  // Standard pages
  // --------------------------
  if (hash === "#about") {
    showPage("about");
    setActiveNav("#about");
    return;
  }

  if (hash === "#publications") {
    showPage("publications");
    setActiveNav("#publications");
    return;
  }

  if (hash === "#food") {
    showPage("food");
    setActiveNav("#food");
    return;
  }

  // Default fallback
  showPage("about");
  setActiveNav("#about");
}

// Listen for URL changes
window.addEventListener("hashchange", routeFromHash);
window.addEventListener("DOMContentLoaded", routeFromHash);
