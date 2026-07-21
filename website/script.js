
(() => {
 "use strict";

 const body = document.body;
 const header = document.getElementById("site-header");
 const menuButton = document.getElementById("menu-button");
 const navigation = document.getElementById("site-nav");

 const storyButton = document.getElementById("story-toggle");
 const fullStory = document.getElementById("full-story");

 const currentYear = document.getElementById("current-year");

 /*
  * Sticky header
  */

 function updateHeader() {
   if (!header) {
     return;
   }

   header.classList.toggle("scrolled", window.scrollY > 20);
 }

 updateHeader();

 window.addEventListener(
   "scroll",
   updateHeader,
   { passive: true }
 );

 /*
  * Mobile navigation
  */

 function openMenu() {
   menuButton.classList.add("active");
   navigation.classList.add("open");
   body.classList.add("menu-open");

   menuButton.setAttribute("aria-expanded", "true");
   menuButton.setAttribute("aria-label", "Close navigation");
 }

 function closeMenu() {
   menuButton.classList.remove("active");
   navigation.classList.remove("open");
   body.classList.remove("menu-open");

   menuButton.setAttribute("aria-expanded", "false");
   menuButton.setAttribute("aria-label", "Open navigation");
 }

 function toggleMenu() {
   const menuIsOpen = navigation.classList.contains("open");

   if (menuIsOpen) {
     closeMenu();
   } else {
     openMenu();
   }
 }

 if (menuButton && navigation) {

   menuButton.addEventListener(
     "click",
     toggleMenu
   );

   navigation
     .querySelectorAll("a")
     .forEach((link) => {

       link.addEventListener(
         "click",
         closeMenu
       );

     });

 }

 document.addEventListener(
   "keydown",
   (event) => {

     if (event.key === "Escape") {
       closeMenu();
     }

   }
 );

 window.addEventListener(
   "resize",
   () => {

     if (window.innerWidth > 940) {
       closeMenu();
     }

   }
 );

 /*
  * Expandable story
  */

 if (storyButton && fullStory) {

   storyButton.addEventListener(
     "click",
     () => {

       const storyIsHidden =
         fullStory.hasAttribute("hidden");

       if (storyIsHidden) {

         fullStory.removeAttribute("hidden");

         storyButton.setAttribute(
           "aria-expanded",
           "true"
         );

         storyButton.innerHTML = `
           Close the full story
           <span aria-hidden="true">↑</span>
         `;

         window.setTimeout(
           () => {

             fullStory.scrollIntoView({
               behavior: "smooth",
               block: "nearest"
             });

           },
           40
         );

       } else {

         fullStory.setAttribute(
           "hidden",
           ""
         );

         storyButton.setAttribute(
           "aria-expanded",
           "false"
         );

         storyButton.innerHTML = `
           Read the full story
           <span aria-hidden="true">→</span>
         `;

       }

     }
   );

 }

 /*
  * Scroll reveal
  */

 const revealElements =
   document.querySelectorAll(".reveal");

 const reducedMotion =
   window.matchMedia(
     "(prefers-reduced-motion: reduce)"
   ).matches;

 if (reducedMotion) {

   revealElements.forEach(
     (element) => {
       element.classList.add("visible");
     }
   );

 } else {

   const revealObserver =
     new IntersectionObserver(
       (entries, observer) => {

         entries.forEach(
           (entry) => {

             if (entry.isIntersecting) {

               entry.target.classList.add("visible");

               observer.unobserve(entry.target);

             }

           }
         );

       },
       {
         threshold: 0.12,
         rootMargin: "0px 0px -40px 0px"
       }
     );

   revealElements.forEach(
     (element) => {
       revealObserver.observe(element);
     }
   );

 }

 /*
  * Animated number counter
  */

 const counters =
   document.querySelectorAll(".counter");

 function animateCounter(element) {

   const target =
     Number(element.dataset.target || 0);

   const suffix =
     element.dataset.suffix || "";

   const duration = 1300;

   const startTime =
     performance.now();

   function updateCounter(currentTime) {

     const elapsed =
       currentTime - startTime;

     const progress =
       Math.min(elapsed / duration, 1);

     const easedProgress =
       1 - Math.pow(1 - progress, 3);

     const currentValue =
       Math.round(target * easedProgress);

     element.textContent =
       currentValue.toLocaleString() + suffix;

     if (progress < 1) {
       window.requestAnimationFrame(updateCounter);
     }

   }

   window.requestAnimationFrame(updateCounter);

 }

 if (counters.length > 0) {

   const counterObserver =
     new IntersectionObserver(
       (entries, observer) => {

         entries.forEach(
           (entry) => {

             if (entry.isIntersecting) {

               animateCounter(entry.target);

               observer.unobserve(entry.target);

             }

           }
         );

       },
       {
         threshold: 0.5
       }
     );

   counters.forEach(
     (counter) => {
       counterObserver.observe(counter);
     }
   );

 }

 /*
  * Update footer year automatically
  */

 if (currentYear) {

   currentYear.textContent =
     new Date().getFullYear();

 }

})();

