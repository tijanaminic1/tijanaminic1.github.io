// =====================================================
// ELEMENTS
// =====================================================
const blogGallery = document.getElementById("blog-gallery");
const blogPostContainer = document.getElementById("blog-post");


// =====================================================
// PAGE SWITCHER
// =====================================================
function showPage(pageId) {
  const pages = document.querySelectorAll(".page");
  pages.forEach(p => p.classList.add("hidden"));

  const page = document.getElementById(pageId);
  if (page) page.classList.remove("hidden");

  if (pageId === "blog") {
    blogGallery.classList.remove("hidden");
    blogPostContainer.classList.add("hidden");
    renderBlogList();
  }

  if (pageId === "food") {
    setTimeout(initMap, 200);
  }
}


// =====================================================
// BLOG INDEX LOADER
// =====================================================
async function loadBlogIndex() {
  const res = await fetch("blog_index.json");
  return await res.json();
}


// =====================================================
// BLOG LIST RENDERER
// =====================================================
async function renderBlogList(sort = "oldest") {
  let posts = await loadBlogIndex();
  posts.sort((a, b) =>
    sort === "newest"
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date)
  );

  blogGallery.innerHTML = "";
  const converter = new showdown.Converter();

  for (const post of posts) {
    const res = await fetch(`blog-posts/${post.file}?v=${Date.now()}`);
    if (!res.ok) continue;

    let md = await res.text();

    const fm = md.match(/---([\s\S]*?)---/);
    if (fm) md = md.replace(fm[0], "").trimStart();

    if (md.startsWith("# ")) {
      md = md.slice(md.indexOf("\n") + 1).trimStart();
    }

    let next = md.search(/\n## /);
    if (next === -1) next = md.length;
    const preview = md.slice(0, next);

    const previewHTML = converter.makeHtml(preview);

    const card = document.createElement("div");
    card.className = "blog-card";
    card.innerHTML = `
      <h3>${post.title}</h3>
      <p class="date">${post.date}</p>
      <div class="preview">${previewHTML}</div>
      <a href="#blog/${post.slug}" class="open-post">Read More →</a>
    `;

    blogGallery.appendChild(card);
  }
}


// =====================================================
// FULL BLOG POST RENDER
// =====================================================
async function renderBlogPostBySlug(slug) {
  const posts = await loadBlogIndex();
  const post = posts.find(p => p.slug === slug);
  if (!post) return;

  renderBlogPost(post.file);
}

async function renderBlogPost(filename) {
  const res = await fetch(`blog-posts/${filename}?v=${Date.now()}`);
  if (!res.ok) return;

  let md = await res.text();

  const fm = md.match(/---([\s\S]*?)---/);
  const meta = fm
    ? Object.fromEntries(fm[1].trim().split("\n").map(line => line.split(": ").map(x => x.trim())))
    : { title: "", date: "" };

  if (fm) md = md.replace(fm[0], "");

  const converter = new showdown.Converter();
  const html = converter.makeHtml(md);

  blogPostContainer.innerHTML = `
    <h2>${meta.title}</h2>
    <p>${meta.date}</p>
    <div>${html}</div>
    <p><a href="#blog">← Back to Blog</a></p>
  `;

  blogGallery.classList.add("hidden");
  blogPostContainer.classList.remove("hidden");
}


// =====================================================
// HASH ROUTER (Option B + default = about)
// =====================================================
function handleHash() {
  const hash = window.location.hash;

  // DEFAULT = ABOUT PAGE
  if (!hash || hash === "" || hash === "#") {
    showPage("about");
    return;
  }

  // BLOG POST: #blog/slug
  if (hash.startsWith("#blog/")) {
    const slug = hash.replace("#blog/", "");
    showPage("blog");
    renderBlogPostBySlug(slug);
    return;
  }

  // BLOG LIST
  if (hash === "#blog") {
    showPage("blog");
    return;
  }

  // OTHER PAGES
  if (hash === "#about") {
    showPage("about");
    return;
  }

  if (hash === "#publications") {
    showPage("publications");
    return;
  }

  if (hash === "#food") {
    showPage("food");
    return;
  }

  // FALLBACK
  showPage("about");
}

window.addEventListener("hashchange", handleHash);
window.addEventListener("DOMContentLoaded", handleHash);


// =====================================================
// PUBLICATIONS SORT
// =====================================================
document.getElementById("sort-options").addEventListener("change", function () {
  const gallery = document.getElementById("publication-gallery");
  const pubs = Array.from(gallery.querySelectorAll(".publication"));
  const sort = this.value;

  pubs.sort((a, b) =>
    sort === "newest"
      ? new Date(b.dataset.date) - new Date(a.dataset.date)
      : new Date(a.dataset.date) - new Date(b.dataset.date)
  );

  pubs.forEach(pub => gallery.appendChild(pub));
});


// =====================================================
// FOOD MAP INIT
// =====================================================
let map;
let mapInitialized = false;

function initMap() {
  if (mapInitialized) return;
  mapInitialized = true;

  map = L.map("map").setView([40.730610, -73.935242], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data © OpenStreetMap contributors",
  }).addTo(map);

  if (window.restaurantPins) {
    restaurantPins.forEach(r => {
      L.marker([r.lat, r.lng]).addTo(map).bindPopup(`<a href="${r.blogUrl}" target="_blank">${r.name}</a>`);
    });
  }
}
