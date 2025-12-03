function showPage(pageId) {
  const pages = document.querySelectorAll('.page');

  // hide all pages
  pages.forEach(page => page.classList.add('hidden'));

  // show selected page
  document.getElementById(pageId).classList.remove('hidden');

  // BLOG PAGE BEHAVIOR
  if (pageId === "blog") {
    if (blogGallery) blogGallery.classList.remove("hidden");
    if (blogPostContainer) blogPostContainer.classList.add("hidden");
    renderBlogList();
  }

  // FOOD PAGE BEHAVIOR
  if (pageId === "food") {
    setTimeout(initMap, 100);
  }
}


  document.getElementById("sort-options").addEventListener("change", function () {
    const sortOption = this.value;
    const gallery = document.getElementById("publication-gallery");
    const publications = Array.from(gallery.querySelectorAll(".publication"));
  

    publications.sort((a, b) => {
      const dateA = new Date(a.getAttribute("data-date"));
      const dateB = new Date(b.getAttribute("data-date"));
  
      return sortOption === "newest" ? dateB - dateA : dateA - dateB;
    });
  

    publications.forEach((pub) => gallery.appendChild(pub));
  });
  

const navLinks = document.querySelectorAll('nav ul li');


navLinks.forEach(link => {
  link.addEventListener('click', function() {

    navLinks.forEach(link => link.classList.remove('active'));


    this.classList.add('active');
  });
});


let map; // Declare map in outer scope
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


function populateRestaurantList() {
  const listContainer = document.getElementById('restaurant-links');
  if (!listContainer) return;

  // Clear any existing content
  listContainer.innerHTML = '';

  // Group by country
  const grouped = {};
  restaurantPins.forEach(restaurant => {
    if (!grouped[restaurant.city]) {
      grouped[restaurant.city] = [];
    }
    grouped[restaurant.city].push(restaurant);
  });

  // For each country, create a group
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


// Call this when the page loads
document.addEventListener('DOMContentLoaded', populateRestaurantList);


const blogGallery = document.getElementById("blog-gallery");
const blogPostContainer = document.getElementById("blog-post");
const blogSortSelect = document.getElementById("blog-sort-options");


async function loadBlogIndex() {
  const res = await fetch("blog-index.json");
  return await res.json();
}

async function renderBlogList(sort = "oldest") {
  let posts = await loadBlogIndex();

  // Sort posts
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
      if (!res.ok) {
        console.error("Cannot load markdown:", post.file);
        continue;
      }

      const text = await res.text();

      // Remove front matter
      let mdBody = text;
      const fm = text.match(/---([\s\S]*?)---/);
      if (fm?.[0]) {
        mdBody = text.replace(fm[0], "").trimStart();
      }

      // Remove leading H1 title
      if (mdBody.startsWith("# ")) {
        const i = mdBody.indexOf("\n");
        if (i !== -1) mdBody = mdBody.slice(i + 1).trimStart();
      }

      // Extract entire first section (until next ## heading)
      let end = mdBody.search(/\n## /);
      if (end === -1) end = mdBody.length;
      let firstSection = mdBody.slice(0, end).trim();

      if (!firstSection) {
        firstSection = mdBody.slice(0, 400);
      }

      // Render preview HTML
      const previewHTML = converter.makeHtml(firstSection);

      // Build blog card
      const div = document.createElement("div");
      div.className = "blog-card";
      div.innerHTML = `
        <h3>${post.title}</h3>
        <p class="date">${post.date}</p>
        <div class="preview">${previewHTML}</div>
        <a href="#blog/${post.slug}" data-file="${post.file}" class="open-post">Read More →</a>

      `;

      blogGallery.appendChild(div);

    } catch (err) {
      console.error("Error rendering preview for", post.file, err);
    }
  }

  // VERY IMPORTANT: Attach click events AFTER rendering
  const links = document.querySelectorAll(".open-post");
  links.forEach(link => {
    link.onclick = async (e) => {
      e.preventDefault();
      const file = link.dataset.file;
      await renderBlogPost(file);
    };
  });
}

async function renderBlogPost(filename) {
  const res = await fetch(`blog-posts/${filename}`);
  if (!res.ok) {
    console.error("Unable to load post:", filename);
    return;
  }

  const text = await res.text();

  const fm = text.match(/---([\s\S]*?)---/);
  const mdContent = text.replace(fm[0], "");
  const meta = Object.fromEntries(
    fm[1].trim().split("\n").map(line => line.split(": ").map(s => s.trim()))
  );

  const converter = new showdown.Converter();
  const html = converter.makeHtml(mdContent);

  blogPostContainer.innerHTML = `
    <h2>${meta.title}</h2>
    <p>${meta.date}</p>
    <div>${html}</div>
    <p><a href="#" onclick="showPage('blog')">← Back to Blog</a></p>
  `;

  blogGallery.classList.add("hidden");
  blogPostContainer.classList.remove("hidden");
}


window.addEventListener("hashchange", handleHashRouting);
window.addEventListener("DOMContentLoaded", handleHashRouting);

function handleHashRouting() {
  const hash = window.location.hash;

  // Case 1: no hash → do nothing
  if (!hash || hash === "#") return;

  // Case 2: blog post link e.g. #blog/first-quarter
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

  // Case 3: blog page only → #blog
  else if (hash === "#blog") {
    showPage("blog");
  }
}




