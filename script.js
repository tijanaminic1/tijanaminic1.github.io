// =====================================================
// PAGE SWITCHING
// =====================================================

function showPage(pageId) {
  const pages = document.querySelectorAll('.page');

  pages.forEach(page => page.classList.add('hidden'));

  const page = document.getElementById(pageId);
  if (page) page.classList.remove('hidden');

  if (pageId === "blog") {
    if (blogGallery) blogGallery.classList.remove("hidden");
    if (blogPostContainer) blogPostContainer.classList.add("hidden");
    renderBlogList();
  }

  if (pageId === "food") {
    setTimeout(initMap, 100);
  }
}


// =====================================================
// PUBLICATION SORTING
// =====================================================

document.getElementById("sort-options").addEventListener("change", function () {
  const sortOption = this.value;
  const gallery = document.getElementById("publication-gallery");
  const publications = Array.from(gallery.querySelectorAll(".publication"));

  publications.sort((a, b) => {
    const dateA = new Date(a.getAttribute("data-date"));
    const dateB = new Date(b.getAttribute("data-date"));
    return sortOption === "newest" ? dateB - dateA : dateA - dateB;
  });

  publications.forEach(pub => gallery.appendChild(pub));
});


// =====================================================
// NAV ACTIVE STATE
// =====================================================

const navLinks = document.querySelectorAll('nav ul li');
navLinks.forEach(link => {
  link.addEventListener('click', function() {
    navLinks.forEach(link => link.classList.remove('active'));
    this.classList.add('active');
  });
});


// =====================================================
// FOOD MAP + RESTAURANT LIST
// =====================================================

let map;
let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
let mapInitialized = false;

function initMap() {
  if (mapInitialized) return;

  map = L.map('map').setView([40.730610, -73.935242], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap contributors'
  }).addTo(map);

  restaurantPins.forEach(({ lat, lng, name, blogUrl }) => {
    const popupHTML = `<a href="${blogUrl}" target="_blank">${name}</a>`;
    L.marker([lat, lng]).addTo(map).bindPopup(popupHTML);
  });

  mapInitialized = true;
}

function initRestaurantList() {
  const listContainer = document.getElementById('restaurant-links');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  const grouped = {};
  restaurantPins.forEach(r => {
    if (!grouped[r.city]) grouped[r.city] = [];
    grouped[r.city].push(r);
  });

  Object.keys(grouped).sort().forEach(city => {
    const h4 = document.createElement('h4');
    h4.textContent = city;
    listContainer.appendChild(h4);

    const ul = document.createElement('ul');
    ul.className = 'restaurant-subgroup';

    grouped[city].forEach(r => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = r.blogLink;
      a.textContent = r.name;
      li.appendChild(a);
      ul.appendChild(li);
    });

    listContainer.appendChild(ul);
  });
}

document.addEventListener('DOMContentLoaded', initRestaurantList);


// =====================================================
// BLOG SYSTEM
// =====================================================

const blogGallery = document.getElementById("blog-gallery");
const blogPostContainer = document.getElementById("blog-post");
const blogSortSelect = document.getElementById("blog-sort-options");

async function loadBlogIndex() {
  const res = await fetch("blog_index.json");
  return await res.json();
}


// =====================================================
// BLOG LIST WITH PREVIEWS
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
    try {
      const res = await fetch(`blog-posts/${post.file}?v=${Date.now()}`);
      if (!res.ok) continue;

      const text = await res.text();

      // Remove frontmatter
      let mdBody = text;
      const fm = text.match(/---([\s\S]*?)---/);
      if (fm?.[0]) {
        mdBody = text.replace(fm[0], "").trimStart();
      }

      // Remove H1 title if present
      if (mdBody.startsWith("# ")) {
        const i = mdBody.indexOf("\n");
        if (i !== -1) mdBody = mdBody.slice(i + 1).trimStart();
      }

      // Extract preview
      let end = mdBody.search(/\n## /);
      if (end === -1) end = mdBody.length;
      let firstSection = mdBody.slice(0, end).trim();

      if (!firstSection) firstSection = mdBody.slice(0, 400);

      const previewHTML = converter.makeHtml(firstSection);

      const div = document.createElement("div");
      div.className = "blog-card";
      div.innerHTML = `
        <h3>${post.title}</h3>
        <p class="date">${post.date}</p>
        <div class="preview">${previewHTML}</div>
        <a href="?post=${post.slug}" class="open-post">Read More →</a>
      `;

      blogGallery.appendChild(div);

    } catch (err) {
      console.error("Preview error:", err);
    }
  }
}


// =====================================================
// RENDER FULL BLOG POST
// =====================================================

async function renderBlogPostBySlug(slug) {
  const posts = await loadBlogIndex();
  const post = posts.find(p => p.slug === slug);
  if (!post) return;

  renderBlogPost(post.file);
}

async function renderBlogPost(filename) {
  const res = await fetch(`blog-posts/${filename}?v=${Date.now()}`);
  if (!res.ok) return console.error("Cannot load:", filename);

  const text = await res.text();

  const fm = text.match(/---([\s\S]*?)---/);
  const mdContent = fm ? text.replace(fm[0], "") : text;

  const meta = fm
    ? Object.fromEntries(
        fm[1].trim().split("\n").map(line => line.split(": ").map(s => s.trim()))
      )
    : { title: "", date: "" };

  const converter = new showdown.Converter();
  const html = converter.makeHtml(mdContent);

  blogPostContainer.innerHTML = `
    <h2>${meta.title}</h2>
    <p>${meta.date}</p>
    <div>${html}</div>
    <p><a href="?blog">← Back to Blog</a></p>
  `;

  blogGallery.classList.add("hidden");
  blogPostContainer.classList.remove("hidden");
}


// =====================================================
// URL ROUTER — FINAL FIX
// =====================================================

function handleRouting() {
  const params = new URLSearchParams(window.location.search);

  // Direct blog post
  if (params.has("post")) {
    showPage("blog");
    renderBlogPostBySlug(params.get("post"));
    return;
  }

  // Blog page
  if (params.has("blog")) {
    showPage("blog");
    return;
  }
}

window.addEventListener("DOMContentLoaded", handleRouting);
window.addEventListener("popstate", handleRouting);
