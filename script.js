// =============================================================
//  FULL SITE ROUTER + BLOG + PAGE SWITCHING
//  Pretty URLs (GitHub Pages) + Hash fallback (Live Server)
// =============================================================

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

// =============================================================
// SIMPLE HASH-BASED ROUTER + BLOG
// Works on Live Server and GitHub Pages
// URLs like: #about, #blog, #blog/first-quarter
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
// Publications sorting
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const pubSort = document.getElementById("sort-options");
  if (pubSort) {
    pubSort.addEventListener("change", () => {
      const sortBy = pubSort.value;
      const pubs = [...document.querySelectorAll(".publication")];

      pubs.sort((a, b) => {
        const da = new Date(a.dataset.date);
        const db = new Date(b.dataset.date);
        return sortBy === "newest" ? db - da : da - db;
      });

      const gallery = document.getElementById("publication-gallery");
      pubs.forEach(p => gallery.appendChild(p));
    });
  }

  const blogSort = document.getElementById("blog-sort-options");
  if (blogSort) {
    blogSort.addEventListener("change", () => {
      renderBlogList();
    });
  }
});

// ------------------------------
// Blog helpers
// ------------------------------
async function loadBlogIndex() {
  const res = await fetch("blog_index.json");
  return res.json();
}

async function renderBlogList() {
  if (!blogGallery) return;

  blogGallery.innerHTML = "";

  const posts = await loadBlogIndex();
  const sortSelect = document.getElementById("blog-sort-options");
  const sortOrder = sortSelect ? sortSelect.value : "oldest";

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

async function renderBlogPost(filename) {
  if (!blogPostContainer) return;

  // Fetch markdown
  const res = await fetch(`blog-posts/${filename}`);
  let text = await res.text();

  // Strip YAML front matter
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
    <a href="#blog" class="back-link">← Back to Thoughts</a>
  `;

  blogGallery.classList.add("hidden");
  blogPostContainer.classList.remove("hidden");
}

// ------------------------------
// Hash-based router
// ------------------------------
function setActiveNav(targetHash) {
  document.querySelectorAll("nav a").forEach(a => {
    if (a.getAttribute("href") === targetHash) {
      a.classList.add("active");
    } else {
      a.classList.remove("active");
    }
  });
}

async function routeFromHash() {
  let hash = window.location.hash || "#about";

  // Normalize (remove trailing slash)
  if (hash.endsWith("/") && hash.length > 1) {
    hash = hash.slice(0, -1);
  }

  // Blog post: #blog/<slug>
  const blogMatch = hash.match(/^#blog\/([^\/]+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const posts = await loadBlogIndex();
    const post = posts.find(p => p.slug === slug);
    if (post) {
      showPage("blog");
      setActiveNav("#blog");
      await renderBlogPost(post.file);
      return;
    }
  }

  // Blog list: #blog
  if (hash === "#blog") {
    showPage("blog");
    setActiveNav("#blog");
    await renderBlogList();
    return;
  }

  // Standard pages
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

  // Default → About
  showPage("about");
  setActiveNav("#about");
}

// ------------------------------
// Event listeners
// ------------------------------
window.addEventListener("hashchange", routeFromHash);
window.addEventListener("DOMContentLoaded", routeFromHash);

