/*
  DREAMLAND SCRIPT

  Page turning itself is controlled by CSS :target, deliberately
  matching the original Janitor AI implementation.

  JS only handles:
  - current page label
  - previous / next controls
  - arrow keys
  - clickable outer page edges
  - postcard keyboard accessibility
*/

(() => {
  "use strict";

  const PAGE_TOTAL = 6;

  const pageNumber =
    document.getElementById("page-number");

  const previousLink =
    document.querySelector(".prev-link");

  const nextLink =
    document.querySelector(".next-link");

  function getTargetNumber() {
    const match =
      window.location.hash.match(/^#page-(\d+)$/);

    if (!match) {
      return 1;
    }

    const n = Number(match[1]);

    if (!Number.isFinite(n)) {
      return 1;
    }

    return Math.min(
      PAGE_TOTAL,
      Math.max(1, n)
    );
  }

  function updateNavigation() {
    const current = getTargetNumber();

    if (pageNumber) {
      pageNumber.textContent =
        String(current).padStart(2, "0");
    }

    /*
      These URLs intentionally match the same desktop spread
      model as the original CSS:

      page 1 -> cover + index
      page 2 -> socials + series
      page 3 -> friends + creators
    */

    if (previousLink) {
      previousLink.href =
        current <= 1
          ? "#page-1"
          : `#page-${current - 1}`;
    }

    if (nextLink) {
      nextLink.href =
        current >= 3
          ? "#page-3"
          : `#page-${current + 1}`;
    }
  }

  window.addEventListener(
    "hashchange",
    updateNavigation
  );

  /*
    Arrow keys use the same hash system, so browser history,
    direct links, and the clickable index all remain synchronized.
  */
  document.addEventListener(
    "keydown",
    (event) => {

      const tag =
        event.target?.tagName?.toLowerCase();

      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select"
      ) {
        return;
      }

      const current =
        getTargetNumber();

      if (
        event.key === "ArrowRight"
      ) {
        event.preventDefault();

        if (current < 3) {
          window.location.hash =
            `page-${current + 1}`;
        }
      }

      if (
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();

        if (current > 1) {
          window.location.hash =
            `page-${current - 1}`;
        } else {
          window.location.hash =
            "page-1";
        }
      }
    }
  );


  /*
    Clicking the physical far left / far right book edges
    changes spreads, but clicking actual page content does not.
  */
  const book =
    document.querySelector(".book");

  if (book) {

    book.addEventListener(
      "click",
      (event) => {

        if (
          event.target.closest("a") ||
          event.target.closest(".flip-card") ||
          event.target.closest("button")
        ) {
          return;
        }

        const rect =
          book.getBoundingClientRect();

        const x =
          event.clientX - rect.left;

        const ratio =
          x / rect.width;

        const current =
          getTargetNumber();

        if (
          ratio <= .075 &&
          current > 1
        ) {
          window.location.hash =
            `page-${current - 1}`;

          return;
        }

        if (
          ratio >= .925 &&
          current < 3
        ) {
          window.location.hash =
            `page-${current + 1}`;
        }
      }
    );
  }


  /*
    Make postcard flips usable by keyboard as well as hover.
  */
  document
    .querySelectorAll(".flip-card")
    .forEach((card) => {

      card.addEventListener(
        "keydown",
        (event) => {

          if (
            event.key !== "Enter" &&
            event.key !== " "
          ) {
            return;
          }

          event.preventDefault();

          card.classList.toggle(
            "keyboard-flipped"
          );
        }
      );

    });


  /*
    Because the supplied CSS uses hover animations rather than
    a persistent flipped class, keyboard users get a small CSS
    hook without affecting the original hover behavior.
  */
  const keyboardStyle =
    document.createElement("style");

  keyboardStyle.textContent = `
    .flip-card.keyboard-flipped {
      transform: rotateY(180deg);
    }
  `;

  document.head.appendChild(
    keyboardStyle
  );


  updateNavigation();

})();
