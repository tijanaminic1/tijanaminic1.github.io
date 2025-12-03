/***********************
 * NAVIGATION & PAGE LOGIC
 ************************/

function showPage(pageId) {
  const pages = document.querySelectorAll('.page');

  // hide all pages
  pages.forEach(page => page.classList.add('hidden'));

  // show selected page
  document.getElementById(pageId).classList.remove('hidden');

  // Special case: blog list or post
  if (pageId === "blog") {
    const hash = window.location.hash;

    if (hash === "#blog" || hash === "" || hash === "#") {
      // show list
      blogGallery.classList.remove("hidden");
      blogPostContainer.classList.add("hidden");
      renderBlogList();
    } else if (hash.startsWith("#blog/")) {
      // show post
      blogGallery.classList.add("hidden");
      blogPostContainer.classList.remove("hidden");
      // router will load correct post
    }
  }

  // Food page
  if (pageId === "food") {
    setTimeout(initMap, 100);
  }
}


/******************************
 * SORTING LOGIC FOR PUBLICATIONS
 ******************************/
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


/***********************
 * NAV ACTIVE STATE
 ************************/
const navLinks = document.querySelectorAll('nav ul li');
navLinks.forEach(link => {
  link.addEventListener('click', function () {
    navLinks.forEach(link => link.classList.remove('active'));
    this.classList.add('active');
  });
});


/***********************
 * FOOD MAP
 ************************/
let map;
let mapInitialized = false;
let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');

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


// Restaurant list
function populateRestaurantList() {
  const listContainer = document.getElementById('restaurant-links');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  const grouped = {};
  restaurantPins.forEach(restaurant => {
    if (!grouped[restaurant.city]) grouped[restaurant.city] = [];
    grouped[restaurant.city].push(restaurant);
  });

  Object.keys(grouped).sort().forEach(city => {
    const cityHeading = document.createElement('h4');
    cityHeading.textContent = city;
    listContainer.appendChild(cityHeading);

    const ul = document.createElement('ul');
    ul.className = 'restaurant-subgroup';

    grouped[city].forEach(restaurant => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = restaurant.blogLink;
      link.textContent = restaurant.name;
      li.appendChild(link);
      ul.appendChild(li);
    });

    listContainer.appendChild(ul);
  });
}

document.addEventListener('DOMContentLoaded', populateRestaurantList);


/***********************
 * BLOG CONSTANTS
 ************************/
const blogGallery = document.getElementById("blog-gallery");
const blogPostContainer = document.getElementById("blog-post");


/***********************
 * LOAD BLOG INDEX
 ************************/
async function loadBlogIndex() {
  const res = await fetch("blog-index.json");
  return await res.json();
}


/***********************
 * RENDER BLOG LIST
 ************************/
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
      const res = await fetch(`blog-posts/${post.file}`);
      if (!res.ok) continue;

      const text = await res.text();

      // strip frontmatter safely
      const fm = text.match(/---([\s\S]*?)---/);
      let mdBody = text;

      if (fm) mdBody = text.replace(fm[0], "").trimStart();

      // strip leading title
      if (mdBody.startsWith("# ")) {
        const i = mdBody.indexOf("\n");
        if (i !== -1) mdBody = mdBody.slice(i + 1).trimStart();
      }

      // get first section
      let end = mdBody.search(/\n## /);
      if (end === -1) end = mdBody.length;
      let firstSection = mdBody.slice(0, end).trim();
      if (!firstSection) firstSection = mdBody.slice(0, 400);

      const previewHTML = converter.makeHtml(firstSection);

      const div = document.createElement("div");
      div.className = "blog-card";
      div.innerHTML = `
        <h3>${post.title}</h3>
        <p class="blog-date">${post.date}</p>
        <div class="blog-preview">${previewHTML}</div>
        <a class="open-post" href="#blog/${post.slug}" data-file="${post.file}">
          Read More →
        </a>
      `;

      blogGallery.appendChild(div);

    } catch (err) {
      console.error("Blog preview error:", err);
    }
  }
}


/***********************
 * RENDER FULL BLOG POST
 ************************/
async function renderBlogPost(filename) {
  const res = await fetch(`blog-posts/${filename}`);
  if (!res.ok) {
    console.error("Could not load:", filename);
    return;
  }

  const text = await res.text();

  // Extract frontmatter safely
  const fmMatch = text.match(/---([\s\S]*?)---/);
  let meta = { title: "", date: "" };
  let mdBody = text;

  if (fmMatch) {
    const fmRaw = fmMatch[1].trim();
    meta = Object.fromEntries(
      fmRaw.split("\n").map(line => {
        const i = line.indexOf(":");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
      })
    );
    mdBody = text.replace(fmMatch[0], "").trimStart();
  }

  const converter = new showdown.Converter();
  const html = converter.makeHtml(mdBody);

  blogPostContainer.innerHTML = `
    <a href="#blog" class="back-to-blog">← Back to Blog</a>
    <h2>${meta.title}</h2>
    <p class="blog-date">${meta.date}</p>
    ${html}
  `;

  blogGallery.classList.add("hidden");
  blogPostContainer.classList.remove("hidden");
}


/***********************
 * HASH ROUTER
 ************************/
window.addEventListener("hashchange", handleHashRouting);
window.addEventListener("DOMContentLoaded", handleHashRouting);

function handleHashRouting() {
  const hash = window.location.hash;

  if (!hash || hash === "#") return;

  // CASE 1 — open post
  if (hash.startsWith("#blog/")) {
    const slug = hash.replace("#blog/", "");
    loadBlogIndex().then(posts => {
      const post = posts.find(p => p.slug === slug);
      if (post) {
        showPage("blog");
        renderBlogPost(post.file);
      }
    });
  }

  // CASE 2 — blog home
  else if (hash === "#blog") {
    showPage("blog");
  }
}
