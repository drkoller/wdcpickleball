(() => {
  "use strict";

  const sourceImages = Array.isArray(window.DCPL_GALLERY_IMAGES)
    ? window.DCPL_GALLERY_IMAGES.filter(
        (photo) =>
          photo &&
          typeof photo.src === "string" &&
          photo.src.trim() !== ""
      )
    : [];

  function shuffledCopy(items) {
    const shuffled = items.slice();

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[index]
      ];
    }

    return shuffled;
  }

  function imageAlt(photo) {
    return typeof photo.alt === "string" && photo.alt.trim()
      ? photo.alt
      : "A moment from the DC Pickleball League community.";
  }

  function renderHomepageGallery() {
    const gallery = document.querySelector("[data-home-gallery]");

    if (!gallery) {
      return;
    }

    const slots = Array.from(gallery.querySelectorAll("[data-gallery-slot]"));
    const selected = shuffledCopy(sourceImages).slice(0, slots.length);

    slots.forEach((slot, index) => {
      const image = slot.querySelector("img");
      const photo = selected[index];

      if (!image || !photo) {
        slot.hidden = true;
        return;
      }

      slot.hidden = false;
      image.src = photo.src;
      image.alt = imageAlt(photo);

      if (Number.isFinite(photo.width) && Number.isFinite(photo.height)) {
        image.width = photo.width;
        image.height = photo.height;
      }
    });
  }

  function setupGalleryPage() {
    const grid = document.querySelector("[data-gallery-grid]");

    if (!grid) {
      return;
    }

    const emptyMessage = document.querySelector("[data-gallery-empty]");
    const photos = shuffledCopy(sourceImages);
    const fragment = document.createDocumentFragment();

    if (photos.length === 0) {
      if (emptyMessage) {
        emptyMessage.hidden = false;
      }
      return;
    }

    photos.forEach((photo, index) => {
      const button = document.createElement("button");
      const image = document.createElement("img");

      button.className = "gallery-page-item";
      button.type = "button";
      button.dataset.galleryIndex = String(index);
      button.setAttribute(
        "aria-label",
        `Open larger image: ${imageAlt(photo)}`
      );

      image.src = photo.src;
      image.alt = imageAlt(photo);
      image.loading = "lazy";
      image.decoding = "async";

      if (Number.isFinite(photo.width) && Number.isFinite(photo.height)) {
        image.width = photo.width;
        image.height = photo.height;
      }

      button.append(image);
      fragment.append(button);
    });

    grid.append(fragment);

    const lightbox = document.querySelector("[data-lightbox]");
    const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
    const closeButton = lightbox?.querySelector("[data-lightbox-close]");
    const previousButton = lightbox?.querySelector("[data-lightbox-previous]");
    const nextButton = lightbox?.querySelector("[data-lightbox-next]");
    const position = lightbox?.querySelector("[data-lightbox-position]");

    if (
      !lightbox ||
      !lightboxImage ||
      !closeButton ||
      !previousButton ||
      !nextButton
    ) {
      return;
    }

    let currentIndex = 0;
    let trigger = null;
    let touchStartX = null;

    function showImage(index) {
      currentIndex = (index + photos.length) % photos.length;
      const photo = photos[currentIndex];

      lightboxImage.src = photo.src;
      lightboxImage.alt = imageAlt(photo);

      if (position) {
        position.textContent = `Image ${currentIndex + 1} of ${photos.length}`;
      }
    }

    function openLightbox(index, opener) {
      trigger = opener;
      showImage(index);
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      closeButton.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      lightboxImage.removeAttribute("src");
      document.body.classList.remove("lightbox-open");

      if (trigger) {
        trigger.focus();
      }
    }

    function move(direction) {
      showImage(currentIndex + direction);
    }

    grid.addEventListener("click", (event) => {
      const item = event.target.closest("[data-gallery-index]");

      if (!item) {
        return;
      }

      openLightbox(Number(item.dataset.galleryIndex), item);
    });

    closeButton.addEventListener("click", closeLightbox);
    previousButton.addEventListener("click", () => move(-1));
    nextButton.addEventListener("click", () => move(1));

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        move(-1);
      } else if (event.key === "ArrowRight") {
        move(1);
      } else if (event.key === "Tab") {
        const focusable = [closeButton, previousButton, nextButton];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    lightboxImage.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
      },
      { passive: true }
    );

    lightboxImage.addEventListener(
      "touchend",
      (event) => {
        if (touchStartX === null) {
          return;
        }

        const distance = event.changedTouches[0].clientX - touchStartX;
        touchStartX = null;

        if (Math.abs(distance) >= 50) {
          move(distance > 0 ? -1 : 1);
        }
      },
      { passive: true }
    );
  }

  renderHomepageGallery();
  setupGalleryPage();
})();
