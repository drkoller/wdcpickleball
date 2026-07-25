(() => {
  "use strict";

  const accordion = document.querySelector("[data-contact-accordion]");

  if (accordion) {
    const items = Array.from(accordion.querySelectorAll("details"));

    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) {
          return;
        }

        items.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.open = false;
          }
        });
      });
    });
  }

  const form = document.querySelector("[data-contact-form]");
  const status = document.querySelector("[data-contact-status]");

  if (form && status) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      status.innerHTML =
        'Online delivery is not connected yet. Please email <a href="mailto:play@wdcpickleball.com">play@wdcpickleball.com</a>.';
      status.focus();
    });
  }
})();
