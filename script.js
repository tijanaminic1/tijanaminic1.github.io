// =============================================================
//  HASH-BASED ROUTER — H A R D E N E D   &   F I X E D
//  Supports: #about, #publications, #blog, #blog/<slug>, #food
// =============================================================

// Cache page elements lazily (safer than running at load time)
function getPages() {
  return document.querySelectorAll(".page");
}
function getBlogGallery() {
  return document.getElementById("blog-gallery");
}
function getBlogPostContainer() {
  return document.getElementById("blog-post");
}

// =============================================================
// PAGE SWITCHING
// =============================================================
function showPage(id) {
  getPages().forEach(p => p.classList.add("hidden"));
  const page = document.getElementById(id);
  if (page) page.classList.remove("hidden");

  // Always scroll to top on page switch
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Highlight nav link
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
// RESTAURANTS PAGE (RECONSTRUCTED)
// =============================================================

// Global Leaflet map instance
window.map = null;

// Initialize map + markers
function initMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  // Avoid creating multiple maps
  if (!window.map) {
    window.map = L.map("map").setView([40.75, -73.98], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(window.map);
  }

  // Clear old markers when navigating back to food page
  if (window.markerLayer) {
    window.map.removeLayer(window.markerLayer);
  }

  window.markerLayer = L.layerGroup().addTo(window.map);

  restaurantPins.forEach(r => {
    const marker = L.marker([r.lat, r.lng]).addTo(window.markerLayer);
    marker.bindPopup(`<b>${r.name}</b><br>${r.city}<br><a href="${r.blogUrl}" target="_blank">Read review →</a>`);
  });

  // Fix Leaflet rendering after being hidden
  setTimeout(() => {
    window.map.invalidateSize();
  }, 200);
}

// Populate the restaurant list under the map
function populateRestaurantList() {
  const container = document.getElementById("restaurant-links");
  if (!container) return;

  container.innerHTML = "";

  restaurantPins.forEach(r => {
    const li = document.createElement("li");

    li.innerHTML = `
      <a href="${r.blogUrl}" target="_blank">${r.name} — <i>${r.city}</i></a>
    `;

    container.appendChild(li);
  });
}

// Called by router when switching to #food
function initRestaurantPage() {
  initMap();
  populateRestaurantList();
}

// =============================================================
// PUBLICATIONS SORTING
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const pubSort = document.getElementById("sort-options");
  if (pubSort) {
    pubSort.addEventListener("change", () => {
      const entries = [...document.querySelectorAll(".publication")];
      const sortBy = pubSort.value;

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

// Cache blog index (avoids race conditions)
let BLOG_INDEX = null;

async function loadBlogIndex() {
  if (BLOG_INDEX) return BLOG_INDEX;
  const res = await fetch("blog_index.json");
  BLOG_INDEX = await res.json();
  return BLOG_INDEX;
}

// Render blog list
async function renderBlogList() {
  const blogGallery = getBlogGallery();
  const blogPostContainer = getBlogPostContainer();

  if (!blogGallery) return;

  blogPostContainer.classList.add("hidden");
  blogGallery.classList.remove("hidden");

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
      <a href="#blog/${encodeURIComponent(post.slug)}">Read more →</a>
    `;

    blogGallery.appendChild(card);
  });
}

// Render a single blog post
async function renderBlogPost(filename) {
  const blogGallery = getBlogGallery();
  const blogPostContainer = getBlogPostContainer();

  const res = await fetch(`blog-posts/${filename}`);
  let text = await res.text();

  // Remove YAML front matter
  text = text.replace(/^---[\s\S]*?---/, "").trim();

  const converter = new showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
  });

  const html = converter.makeHtml(text);

  blogPostContainer.innerHTML = `
    ${html}
    <br><br>
    <a href="#blog" class="back-link">← Back to Thoughts</a>
  `;

  blogGallery.classList.add("hidden");
  blogPostContainer.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =============================================================
// HASH ROUTER (FIXED)
// =============================================================
async function routeFromHash() {
  let hash = window.location.hash || "#about";

  // Remove trailing slash
  hash = hash.replace(/\/+$/, "");

// --------------------------
// Blog post route 
// --------------------------
let normalized = hash.replace(/^#blog\//, ""); 
normalized = normalized.replace(/\/+$/, "");      // remove trailing slashes
normalized = normalized.split("?")[0];            // remove query params
normalized = decodeURIComponent(normalized);      // decode slugs

if (hash.startsWith("#blog/") && normalized) {
  const posts = await loadBlogIndex();
  const entry = posts.find(p => p.slug === normalized);

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
  // For food
  // --------------------------

  if (hash === "#food") {
    showPage("food");
    setActiveNav("#food");
    initRestaurantPage();   // <------ RESTORED RESTAURANT HANDLER
    return;
}


  // --------------------------
  // Static pages
  // --------------------------
  const pages = ["about", "publications"];

  for (const p of pages) {
    if (hash === `#${p}`) {
      showPage(p);
      setActiveNav(`#${p}`);
      return;
    }
  }

  // Fallback
  showPage("about");
  setActiveNav("#about");
}

// =============================================================
// SAFER LOAD EVENTS
// (DOMContentLoaded → router AFTER JSON loads)
// =============================================================
window.addEventListener("DOMContentLoaded", async () => {
  await loadBlogIndex();  // preload to avoid race conditions
  routeFromHash();
});

window.addEventListener("hashchange", routeFromHash);
