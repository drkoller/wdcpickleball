(() => {
  "use strict";

  /*
   * Shared DCPL photo collection.
   *
   * To add a photo:
   * 1. Place a browser-compatible JPG, JPEG, PNG, WebP, AVIF, or GIF in
   *    images/gallery/.
   * 2. Add one object below with its relative path and a short, meaningful
   *    description for screen-reader users.
   *
   * Both the homepage rotation and gallery.html read this same array.
   */
  window.DCPL_GALLERY_IMAGES = Object.freeze([
    { src: "images/gallery/0843.jpg", alt: "DCPL players competing on outdoor pickleball courts.", width: 5789, height: 3859 },
    { src: "images/gallery/0P3A2542.jpg", alt: "DCPL players gathered during a pickleball event.", width: 5760, height: 3840 },
    { src: "images/gallery/0P3A3742.jpg", alt: "A DCPL pickleball match in progress.", width: 5760, height: 3840 },
    { src: "images/gallery/0P3A4015.jpg", alt: "DCPL players enjoying competitive doubles play.", width: 5760, height: 3840 },
    { src: "images/gallery/0P3A4318.jpg", alt: "DCPL members together beside the pickleball courts.", width: 5760, height: 3840 },
    { src: "images/gallery/0P3A4496.jpg", alt: "DCPL players between games at a community event.", width: 5760, height: 3840 },
    { src: "images/gallery/0P3A6520_Original.JPG", alt: "DCPL members playing pickleball outdoors.", width: 2833, height: 2688 },
    { src: "images/gallery/0P3A7544_Original.JPG", alt: "DCPL players during a rally.", width: 3527, height: 2730 },
    { src: "images/gallery/0P3A8415.jpg", alt: "DCPL players competing in an outdoor match.", width: 5760, height: 3840 },
    { src: "images/gallery/0P3A8418.jpg", alt: "Pickleball action at a DCPL event.", width: 4803, height: 3202 },
    { src: "images/gallery/0P3A8428.jpg", alt: "DCPL doubles players on an outdoor court.", width: 5760, height: 3840 },
    { src: "images/gallery/0P3A8772.jpg", alt: "DCPL players celebrating together after play.", width: 5760, height: 3840 },
    { src: "images/gallery/2831F57B-2448-4D41-9783-0A65358D7791.jpg", alt: "Members of the DCPL pickleball community.", width: 1440, height: 987 },
    { src: "images/gallery/430695517_320340644365286_1206339862846147414_n.jpg", alt: "DCPL players gathered for a community pickleball session.", width: 2048, height: 1448 },
    { src: "images/gallery/DP0A4944_Original.JPG", alt: "DCPL pickleball players in action on court.", width: 6000, height: 4000 },
    { src: "images/gallery/DP0A5452_Original.JPG", alt: "DCPL members at an outdoor pickleball event.", width: 5273, height: 3515 },
    { src: "images/gallery/IMG_0105.jpeg", alt: "DCPL players and friends gathered together.", width: 3828, height: 2631 },
    { src: "images/gallery/IMG_0803.jpg", alt: "DCPL community members enjoying a pickleball event.", width: 4032, height: 3024 },
    { src: "images/gallery/IMG_1019.jpg", alt: "DCPL players posing together at the courts.", width: 4032, height: 3024 },
    { src: "images/gallery/IMG_1334.jpeg", alt: "The DCPL founders together at East Potomac Tennis Center.", width: 3986, height: 2989 },
    { src: "images/gallery/IMG_1365.jpg", alt: "DCPL members gathered around the pickleball courts.", width: 3779, height: 3024 },
    { src: "images/gallery/IMG_1372.jpg", alt: "Four women holding paddles and an award beside outdoor pickleball courts.", width: 3664, height: 2949 },
    { src: "images/gallery/IMG_2179.jpg", alt: "The DCPL community at East Potomac Tennis Center.", width: 3818, height: 2864 },
    { src: "images/gallery/IMG_2594.jpg", alt: "DCPL players participating in a pickleball gathering.", width: 3894, height: 2920 },
    { src: "images/gallery/IMG_2669.jpg", alt: "DCPL members enjoying time together off court.", width: 2845, height: 1814 },
    { src: "images/gallery/IMG_2744.jpg", alt: "DCPL players at a community pickleball event.", width: 3970, height: 5294 },
    { src: "images/gallery/IMG_2861.jpg", alt: "DCPL tournament participants gathered on the courts.", width: 3863, height: 2534 },
    { src: "images/gallery/IMG_3023.jpg", alt: "DCPL tournament medal winners on the National Mall courts.", width: 2776, height: 3701 },
    { src: "images/gallery/IMG_3152.jpg", alt: "Costumed DCPL players posing together on an indoor pickleball court.", width: 4858, height: 2680 },
    { src: "images/gallery/IMG_3263.jpg", alt: "DCPL members posing together after pickleball.", width: 4024, height: 2645 },
    { src: "images/gallery/IMG_3464.jpg", alt: "Three DCPL members posing together on outdoor pickleball courts.", width: 3824, height: 5099 },
    { src: "images/gallery/IMG_3795.jpg", alt: "DCPL members and young players gathered at an indoor pickleball event.", width: 4032, height: 3024 },
    { src: "images/gallery/IMG_4948.jpg", alt: "A large group of DCPL players gathered on indoor pickleball courts.", width: 2497, height: 1325 },
    { src: "images/gallery/IMG_4967.jpg", alt: "A DCPL community moment at the pickleball courts.", width: 828, height: 834 },
    { src: "images/gallery/IMG_5159.jpg", alt: "DCPL players posing with medals after an indoor pickleball event.", width: 3617, height: 2713 },
    { src: "images/gallery/IMG_5304.jpeg", alt: "DCPL players gathered during a league session.", width: 3942, height: 2596 },
    { src: "images/gallery/IMG_5569.jpg", alt: "DCPL members at a community pickleball gathering.", width: 4032, height: 3024 },
    { src: "images/gallery/IMG_6030.jpg", alt: "DCPL players presenting an award on an indoor pickleball court.", width: 3541, height: 2656 },
    { src: "images/gallery/IMG_6084.jpeg", alt: "DCPL players smiling together at an event.", width: 1381, height: 969 },
    { src: "images/gallery/IMG_6166.jpg", alt: "A pickleball-themed birthday cake celebrating DCPL.", width: 2759, height: 3679 },
    { src: "images/gallery/IMG_6181.jpg", alt: "DCPL members taking part in organized pickleball play.", width: 4032, height: 3024 },
    { src: "images/gallery/IMG_6193.jpg", alt: "Six women gathered with paddles at an indoor pickleball event.", width: 2865, height: 2472 },
    { src: "images/gallery/IMG_6954.jpg", alt: "DCPL players gathered at an outdoor court.", width: 3922, height: 2906 },
    { src: "images/gallery/IMG_6955.jpg", alt: "Two costumed DCPL members holding a pickleball league sign.", width: 2660, height: 3546 },
    { src: "images/gallery/IMG_6964.jpg", alt: "DCPL community members together after a match.", width: 3088, height: 2316 },
    { src: "images/gallery/IMG_7130.jpeg", alt: "DCPL members connecting at a pickleball event.", width: 4032, height: 3024 },
    { src: "images/gallery/IMG_7416.jpeg", alt: "DCPL players participating in a clinic.", width: 2951, height: 3935 },
    { src: "images/gallery/IMG_7426.jpg", alt: "Pickleball instruction during a DCPL clinic.", width: 2016, height: 1512 },
    { src: "images/gallery/IMG_7433.jpg", alt: "DCPL players practicing together on court.", width: 2016, height: 1512 },
    { src: "images/gallery/IMG_7613.jpg", alt: "DCPL community members gathered at an event.", width: 3024, height: 3024 },
    { src: "images/gallery/IMG_7626.jpeg", alt: "DCPL members at the 2026 Juneteenth celebration.", width: 1363, height: 635 },
    { src: "images/gallery/IMG_7655.jpg", alt: "A PPR Certified Coach leading a DCPL pickleball clinic.", width: 1867, height: 1400 },
    { src: "images/gallery/IMG_7669.jpeg", alt: "DCPL players learning together during a clinic.", width: 1919, height: 1281 },
    { src: "images/gallery/IMG_7688.jpeg", alt: "DCPL clinic participants practicing on court.", width: 1427, height: 1427 },
    { src: "images/gallery/IMG_7698.jpeg", alt: "DCPL players receiving instruction during a clinic.", width: 1418, height: 1814 },
    { src: "images/gallery/IMG_7713.jpg", alt: "Three DCPL players posing with paddles at an outdoor event.", width: 2880, height: 3841 },
    { src: "images/gallery/IMG_8189.jpg", alt: "Members of the DC Pickleball League community after an open play session.", width: 3595, height: 2464 },
    { src: "images/gallery/IMG_8296_homepage.jpeg", alt: "DCPL members gathering at a community movie night.", width: 1161, height: 774 },
    { src: "images/gallery/IMG_8685.jpg", alt: "A woman returning a shot during an outdoor doubles match.", width: 4407, height: 3714 },
    { src: "images/gallery/IMG_8725.jpg", alt: "A woman ready at the net during an outdoor pickleball match.", width: 5760, height: 3840 },
    { src: "images/gallery/nationalmall.jpg", alt: "DCPL players on the National Mall pickleball courts.", width: 4119, height: 2746 }
  ].map(Object.freeze));
})();
