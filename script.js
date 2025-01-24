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
  