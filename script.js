/*
  DREAMLAND NAVIGATION

  IMPORTANT:
  The actual page turn is CSS :target, exactly matching the
  mechanism from the supplied Janitor AI CSS.

  JavaScript does NOT rotate the book. It only:
    - keeps the visible page number in sync
    - makes Previous / Next move by one spread
    - supports arrow keys
    - preserves hash URLs
    - makes postcard flips keyboard accessible
*/

(() => {
  "use strict";

  const pageNumber =
    document.getElementById("page-number");

  const previous =
    document.querySelector(".nav-prev");

  const next =
    document.querySelector(".nav-next");

  /*
     A physical spread starts on odd-numbered pages:
       1/2
       3/4
       5/6
  */
  const SPREADS = [1, 3, 5];


  function getPage() {

    const match =
      window.location.hash.match(/^#page-(\d+)$/);

    if (!match) {
      return 1;
    }

    const value =
      Number(match[1]);

    if (!Number.isFinite(value)) {
      return 1;
    }

    return Math.min(
      6,
      Math.max(1, value)
    );
  }


  function getSpreadStart(page) {

    if (page <= 2) {
      return 1;
    }

    if (page <= 4) {
      return 3;
    }

    return 5;
  }


  function setPage(page) {

    const target =
      Math.min(
        6,
        Math.max(1, page)
      );

    window.location.hash =
      `page-${target}`;
  }


  function nextSpread() {

    const current =
      getSpreadStart(getPage());

    const position =
      SPREADS.indexOf(current);

    if (position === -1) {
      setPage(1);
      return;
    }

    if (position < SPREADS.length - 1) {
      setPage(
        SPREADS[position + 1]
      );
    }

  }


  function previousSpread() {

    const current =
      getSpreadStart(getPage());

    const position =
      SPREADS.indexOf(current);

    if (position <= 0) {
      setPage(1);
      return;
    }

    setPage(
      SPREADS[position - 1]
    );

  }


  function updateControls() {

    const page =
      getPage();

    const spread =
      getSpreadStart(page);

    /*
       Display the left-hand page of the visible spread.
    */
    if (pageNumber) {

      pageNumber.textContent =
        String(spread)
          .padStart(2, "0");

    }


    if (previous) {

      previous.href =
        spread === 1
          ? "#page-1"
          : `#page-${spread - 2}`;

    }


    if (next) {

      next.href =
        spread === 5
          ? "#page-5"
          : `#page-${spread + 2}`;

    }

  }


  window.addEventListener(
    "hashchange",
    updateControls
  );


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

      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextSpread();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousSpread();
      }

    }
  );


  /*
     The physical right edge advances.
     The physical left edge moves back.
     Content itself is left alone.
  */
  const book =
    document.querySelector(".book");

  if (book) {

    book.addEventListener(
      "click",
      (event) => {

        if (
          event.target.closest("a") ||
          event.target.closest(".flip-card")
        ) {
          return;
        }

        const rect =
          book.getBoundingClientRect();

        const relativeX =
          event.clientX -
          rect.left;

        const ratio =
          relativeX /
          rect.width;

        if (ratio >= .92) {
          nextSpread();
        }

        if (ratio <= .08) {
          previousSpread();
        }

      }
    );

  }


  /*
     Keep postcards separate from book navigation.
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
          event.stopPropagation();

          card.classList.toggle(
            "keyboard-flipped"
          );

        }
      );

    });


  updateControls();

})();
