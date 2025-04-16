function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      if (page.id === pageId) {
        page.classList.remove('hidden');
      } else {
        page.classList.add('hidden');
      }
    });
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

// Handle showing/hiding pages
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');

  if (pageId === 'food') {
    setTimeout(initMap, 100); // Slight delay ensures #map is rendered before Leaflet tries to use it
  }
}

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
