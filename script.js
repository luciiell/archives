/*
  DREAMLAND JOURNAL CONTROLLER

  The book now has exactly FOUR spreads:

    1  = COVER / INDEX
    2  = SOCIALS / SERIES
    3  = FRIENDS / DREAMLAND RESIDENTS
    4  = MAPS / CLOSING

  The page-turn itself is CSS. This script changes the spread
  class and handles navigation reliably.
*/

(() => {
  "use strict";


  const TOTAL_SPREADS = 4;

  let currentSpread = 1;


  const pageNumber =
    document.getElementById("page-number");

  const previousButton =
    document.getElementById("previousPage");

  const nextButton =
    document.getElementById("nextPage");


  /* ==========================================================
     SPREAD <-> HASH
  ========================================================== */

  function spreadFromHash() {

    const hash =
      window.location.hash;

    if (!hash) {
      return 1;
    }

    const match =
      hash.match(/^#page-(\d+)$/);

    if (!match) {
      return 1;
    }

    const spread =
      Number(match[1]);

    if (!Number.isFinite(spread)) {
      return 1;
    }

    /*
      The site has four OPEN-BOOK SPREADS.
      The hash identifies the spread directly:

        #page-1 = Cover / Index
        #page-2 = Socials / Series
        #page-3 = Friends / Dreamland Residents
        #page-4 = Maps / Closing
    */
    return Math.min(
      TOTAL_SPREADS,
      Math.max(1, spread)
    );
  }


  function hashForSpread(spread) {

    return `#page-${spread}`;

  }


  /* ==========================================================
     RENDER
  ========================================================== */

  function renderSpread(spread) {

    currentSpread =
      Math.min(
        TOTAL_SPREADS,
        Math.max(1, spread)
      );

    document.body.classList.remove(
      "spread-1",
      "spread-2",
      "spread-3",
      "spread-4"
    );

    document.body.classList.add(
      `spread-${currentSpread}`
    );


    if (pageNumber) {

      pageNumber.textContent =
        String(currentSpread)
          .padStart(2, "0");

    }


    previousButton.disabled =
      currentSpread === 1;

    nextButton.disabled =
      currentSpread === TOTAL_SPREADS;


    previousButton.setAttribute(
      "aria-label",
      currentSpread === 1
        ? "Already at first spread"
        : `Go to spread ${currentSpread - 1}`
    );


    nextButton.setAttribute(
      "aria-label",
      currentSpread === TOTAL_SPREADS
        ? "Already at final spread"
        : `Go to spread ${currentSpread + 1}`
    );

  }


  function goToSpread(spread) {

    const target =
      Math.min(
        TOTAL_SPREADS,
        Math.max(1, spread)
      );

    const hash =
      hashForSpread(target);

    /*
      Set the hash so the Index and direct links all use
      exactly the same navigation state.
    */
    if (window.location.hash !== hash) {

      window.location.hash =
        hash;

    } else {

      renderSpread(target);

    }

  }


  /* ==========================================================
     NEXT / PREVIOUS
  ========================================================== */

  nextButton.addEventListener(
    "click",
    () => {

      if (currentSpread < TOTAL_SPREADS) {
        goToSpread(
          currentSpread + 1
        );
      }

    }
  );


  previousButton.addEventListener(
    "click",
    () => {

      if (currentSpread > 1) {
        goToSpread(
          currentSpread - 1
        );
      }

    }
  );


  /* ==========================================================
     HASH CHANGES
  ========================================================== */

  window.addEventListener(
    "hashchange",
    () => {

      const target =
        spreadFromHash();

      renderSpread(target);

    }
  );


  /* ==========================================================
     KEYBOARD
  ========================================================== */

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

      /*
        Do not treat Escape as page navigation.
        It is reserved for the map viewer.
      */

      if (
        event.key === "ArrowRight" ||
        event.key === "PageDown"
      ) {

        event.preventDefault();

        if (
          currentSpread <
          TOTAL_SPREADS
        ) {

          goToSpread(
            currentSpread + 1
          );

        }

      }


      if (
        event.key === "ArrowLeft" ||
        event.key === "PageUp"
      ) {

        event.preventDefault();

        if (
          currentSpread > 1
        ) {

          goToSpread(
            currentSpread - 1
          );

        }

      }

    }
  );


  /* ==========================================================
     EDGE CLICK
  ========================================================== */

  const book =
    document.querySelector(".book");


  if (book) {

    book.addEventListener(
      "click",
      (event) => {

        /*
          Do not hijack links, postcards, map buttons,
          the actual page content, or the navigation controls.
        */

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
          event.clientX -
          rect.left;

        const ratio =
          x / rect.width;


        if (
          ratio >= .94 &&
          currentSpread <
          TOTAL_SPREADS
        ) {

          goToSpread(
            currentSpread + 1
          );

          return;
        }


        if (
          ratio <= .06 &&
          currentSpread > 1
        ) {

          goToSpread(
            currentSpread - 1
          );

        }

      }
    );

  }


  /* ==========================================================
     POSTCARD ACCESSIBILITY
  ========================================================== */

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


  /* ==========================================================
     MAP FULLSCREEN VIEWER
  ========================================================== */

  const mapViewer =
    document.getElementById("mapViewer");

  const mapViewerTitle =
    document.getElementById("mapViewerTitle");

  const mapViewport =
    document.getElementById("mapViewport");

  const mapStage =
    document.getElementById("mapStage");

  const mapImage =
    document.getElementById("mapViewerImage");

  const mapPlaceholder =
    document.getElementById(
      "mapViewerPlaceholder"
    );

  const mapClose =
    document.getElementById("mapClose");

  const mapReset =
    document.getElementById("mapReset");

  const mapZoomIn =
    document.getElementById("mapZoomIn");

  const mapZoomOut =
    document.getElementById("mapZoomOut");


  let mapScale = 1;
  let mapX = 0;
  let mapY = 0;

  let dragging = false;

  let dragStartX = 0;
  let dragStartY = 0;

  let originX = 0;
  let originY = 0;


  function applyMapTransform() {

    mapStage.style.transform =
      `translate(calc(-50% + ${mapX}px), calc(-50% + ${mapY}px)) scale(${mapScale})`;

  }


  function resetMap() {

    mapScale = 1;
    mapX = 0;
    mapY = 0;

    applyMapTransform();

  }


  function setMapScale(nextScale) {

    mapScale =
      Math.min(
        8,
        Math.max(
          .25,
          nextScale
        )
      );

    applyMapTransform();

  }


  function openMap(card) {

    const src =
      card.dataset.mapSrc?.trim() ||
      "";

    const title =
      card.dataset.mapTitle?.trim() ||
      "MAP";


    mapViewerTitle.textContent =
      title;


    if (src) {

      mapImage.src =
        src;

      mapImage.alt =
        title;

      mapImage.style.display =
        "block";

      mapViewer.classList.add(
        "has-image"
      );

      /*
        Wait for dimensions before resetting so large
        images are shown at a sensible initial scale.
      */
      mapImage.onload =
        () => {

          resetMap();

          const vw =
            mapViewport.clientWidth;

          const vh =
            mapViewport.clientHeight;

          const iw =
            mapImage.naturalWidth;

          const ih =
            mapImage.naturalHeight;

          if (
            iw &&
            ih
          ) {

            const fit =
              Math.min(
                vw / iw,
                vh / ih,
                1
              );

            mapScale =
              Math.max(
                .1,
                fit
              );

            applyMapTransform();

          }

        };

    } else {

      mapImage.removeAttribute(
        "src"
      );

      mapImage.style.display =
        "none";

      mapViewer.classList.remove(
        "has-image"
      );

      resetMap();

    }


    mapViewer.classList.add(
      "open"
    );

    mapViewer.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.style.overflow =
      "hidden";

  }


  function closeMap() {

    mapViewer.classList.remove(
      "open"
    );

    mapViewer.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow =
      "";

    dragging =
      false;

  }


  document
    .querySelectorAll(".map-card")
    .forEach((card) => {

      card.addEventListener(
        "click",
        () => {

          openMap(card);

        }
      );

    });


  mapClose.addEventListener(
    "click",
    closeMap
  );


  mapReset.addEventListener(
    "click",
    resetMap
  );


  mapZoomIn.addEventListener(
    "click",
    () => {

      setMapScale(
        mapScale * 1.25
      );

    }
  );


  mapZoomOut.addEventListener(
    "click",
    () => {

      setMapScale(
        mapScale / 1.25
      );

    }
  );


  /* wheel zoom */
  mapViewport.addEventListener(
    "wheel",
    (event) => {

      event.preventDefault();

      const direction =
        event.deltaY < 0
          ? 1.15
          : 1 / 1.15;

      setMapScale(
        mapScale * direction
      );

    },
    {
      passive: false
    }
  );


  /* drag to pan */
  mapViewport.addEventListener(
    "pointerdown",
    (event) => {

      if (
        !mapViewer.classList.contains(
          "has-image"
        )
      ) {
        return;
      }

      dragging =
        true;

      mapStage.classList.add(
        "dragging"
      );

      mapStage.setPointerCapture?.(
        event.pointerId
      );

      dragStartX =
        event.clientX;

      dragStartY =
        event.clientY;

      originX =
        mapX;

      originY =
        mapY;

    }
  );


  mapViewport.addEventListener(
    "pointermove",
    (event) => {

      if (!dragging) {
        return;
      }

      mapX =
        originX +
        (event.clientX - dragStartX);

      mapY =
        originY +
        (event.clientY - dragStartY);

      applyMapTransform();

    }
  );


  function endDrag() {

    dragging =
      false;

    mapStage.classList.remove(
      "dragging"
    );

  }


  mapViewport.addEventListener(
    "pointerup",
    endDrag
  );

  mapViewport.addEventListener(
    "pointercancel",
    endDrag
  );

  mapViewport.addEventListener(
    "pointerleave",
    () => {

      if (dragging) {
        endDrag();
      }

    }
  );


  /* double click zoom */
  mapViewport.addEventListener(
    "dblclick",
    (event) => {

      if (
        !mapViewer.classList.contains(
          "has-image"
        )
      ) {
        return;
      }

      event.preventDefault();

      setMapScale(
        mapScale < 2
          ? mapScale * 1.5
          : 1
      );

    }
  );


  /* escape closes map viewer */
  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        mapViewer.classList.contains(
          "open"
        )
      ) {

        closeMap();

      }

    }
  );


  /* ==========================================================
     INITIAL STATE

     No hash => first spread.
     A direct #page-5 or #page-7 link opens the correct spread.
  ========================================================== */

  renderSpread(
    spreadFromHash()
  );

})();
