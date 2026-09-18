/* ---------------------------------------------------------------
   Harvest & Wild — gallery data + behaviour

   Images are served from LoremFlickr (https://loremflickr.com),
   a free service that returns real, category-matched photographs
   sourced from Flickr. The "lock" parameter pins a specific photo
   to a specific position so the gallery is stable on every reload.
------------------------------------------------------------------ */

const CATEGORIES = {
  nature:     { label: "Nature",     keyword: "nature,landscape" },
  animals:    { label: "Animals",    keyword: "animal,wildlife"  },
  food:       { label: "Food",       keyword: "food,dish"        },
  fruits:     { label: "Fruits",     keyword: "fruit"            },
  vegetables: { label: "Vegetables", keyword: "vegetable"        }
};

const IMAGES_PER_CATEGORY = 20;

// A handful of aspect ratios keeps the masonry grid lively without
// making the layout logic (or the code) unpredictable.
const ASPECTS = [
  { w: 480, h: 600 },  // portrait
  { w: 480, h: 480 },  // square
  { w: 480, h: 360 },  // landscape
  { w: 480, h: 700 },  // tall portrait
  { w: 480, h: 420 }
];

function buildGalleryData() {
  const images = [];
  let id = 1;

  Object.entries(CATEGORIES).forEach(([key, meta]) => {
    for (let i = 0; i < IMAGES_PER_CATEGORY; i++) {
      const aspect = ASPECTS[i % ASPECTS.length];
      const lock = id * 7 + 3; // spreads out the lock numbers so neighbours differ
      images.push({
        id,
        category: key,
        label: meta.label,
        thumb: `https://loremflickr.com/${aspect.w}/${aspect.h}/${encodeURIComponent(meta.keyword)}?lock=${lock}`,
        full:  `https://loremflickr.com/900/700/${encodeURIComponent(meta.keyword)}?lock=${lock}`,
        alt: `${meta.label} photograph #${i + 1}`
      });
      id++;
    }
  });

  return images;
}

const ALL_IMAGES = buildGalleryData();

const galleryEl      = document.getElementById("gallery");
const resultsNoteEl  = document.getElementById("resultsNote");
const filterButtons  = Array.from(document.querySelectorAll(".filter-btn"));

const lightboxEl     = document.getElementById("lightbox");
const lightboxImgEl  = document.getElementById("lightboxImg");
const lightboxTagEl  = document.getElementById("lightboxTag");
const lightboxCountEl= document.getElementById("lightboxCount");
const lightboxCloseEl= document.getElementById("lightboxClose");
const lightboxPrevEl = document.getElementById("lightboxPrev");
const lightboxNextEl = document.getElementById("lightboxNext");

let activeCategory = "all";
let visibleSet = ALL_IMAGES;   // the images currently shown, in order
let lightboxIndex = -1;        // index into visibleSet

/* ---------- Counts on the filter pills ---------- */

function setCounts() {
  document.getElementById("count-all").textContent = `(${ALL_IMAGES.length})`;
  Object.keys(CATEGORIES).forEach((key) => {
    const n = ALL_IMAGES.filter((img) => img.category === key).length;
    document.getElementById(`count-${key}`).textContent = `(${n})`;
  });
}

/* ---------- Rendering the grid ---------- */

function renderGallery(list) {
  galleryEl.innerHTML = "";
  const frag = document.createDocumentFragment();

  list.forEach((img, index) => {
    const card = document.createElement("figure");
    card.className = "card";
    card.tabIndex = 0;
    card.dataset.index = index;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${img.alt}`);

    card.innerHTML = `
      <img src="${img.thumb}" alt="${img.alt}" loading="lazy">
      <figcaption class="card__overlay">
        <span>
          <span class="card__label">${img.label}</span><br>
          <span class="card__tag">${img.category}</span>
        </span>
      </figcaption>
    `;

    card.addEventListener("click", () => openLightbox(index));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(index);
      }
    });

    frag.appendChild(card);
  });

  galleryEl.appendChild(frag);

  const label = activeCategory === "all" ? "all categories" : CATEGORIES[activeCategory].label.toLowerCase();
  resultsNoteEl.textContent = `Showing ${list.length} photographs — ${label}.`;
}

/* ---------- Filtering ---------- */

function applyFilter(category) {
  activeCategory = category;
  visibleSet = category === "all"
    ? ALL_IMAGES
    : ALL_IMAGES.filter((img) => img.category === category);

  filterButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.category === category);
  });

  renderGallery(visibleSet);
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => applyFilter(btn.dataset.category));
});

/* ---------- Lightbox ---------- */

function openLightbox(index) {
  lightboxIndex = index;
  updateLightbox();
  lightboxEl.hidden = false;
  document.body.style.overflow = "hidden";
  lightboxCloseEl.focus();
}

function closeLightbox() {
  lightboxEl.hidden = true;
  document.body.style.overflow = "";
}

function updateLightbox() {
  const img = visibleSet[lightboxIndex];
  lightboxImgEl.src = img.full;
  lightboxImgEl.alt = img.alt;
  lightboxTagEl.textContent = `${img.label}`;
  lightboxCountEl.textContent = `${lightboxIndex + 1} / ${visibleSet.length}`;
}

function showPrev() {
  lightboxIndex = (lightboxIndex - 1 + visibleSet.length) % visibleSet.length;
  updateLightbox();
}

function showNext() {
  lightboxIndex = (lightboxIndex + 1) % visibleSet.length;
  updateLightbox();
}

lightboxCloseEl.addEventListener("click", closeLightbox);
lightboxPrevEl.addEventListener("click", showPrev);
lightboxNextEl.addEventListener("click", showNext);

// Click on the dark backdrop (but not the image/frame) closes the viewer
lightboxEl.addEventListener("click", (e) => {
  if (e.target === lightboxEl) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (lightboxEl.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showPrev();
  if (e.key === "ArrowRight") showNext();
});

/* ---------- Init ---------- */

setCounts();
applyFilter("all");
