/* =========================================================
   DREAMLAND BOOK ENGINE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const sheets = [...document.querySelectorAll(".page-turn")];
    const previousButton = document.getElementById("previousPage");
    const nextButton = document.getElementById("nextPage");
    const currentPageLabel = document.getElementById("currentPage");
    const restartButton = document.getElementById("restartBook");

    const totalPages = sheets.length * 2;

    /*
       0 = cover + index
       1 = socials + series
       2 = friends + creators
       3 = archives + back cover
    */
    let spread = 0;


    /* =====================================================
       LAYER ORDER
    ====================================================== */

    function updateZIndexes() {

        sheets.forEach((sheet, index) => {

            /*
               The page currently turning should sit above
               untouched pages. Once flipped, it sits below
               later sheets but above the static cover.
            */

            if (index < spread) {
                sheet.style.zIndex = String(10 + index);
            } else {
                sheet.style.zIndex = String(30 - index);
            }

        });

    }


    /* =====================================================
       LABEL
    ====================================================== */

    function updateLabel() {

        const visiblePage = [1, 2, 4, 6][spread] ?? 6;

        currentPageLabel.textContent =
            String(visiblePage).padStart(2, "0");

        previousButton.disabled = spread === 0;
        nextButton.disabled = spread === sheets.length;

    }


    /* =====================================================
       RENDER
    ====================================================== */

    function renderBook() {

        sheets.forEach((sheet, index) => {

            sheet.classList.toggle(
                "flipped",
                index < spread
            );

        });

        updateZIndexes();
        updateLabel();

    }


    /* =====================================================
       TURN FORWARD
    ====================================================== */

    function nextSpread() {

        if (spread >= sheets.length) {
            return;
        }

        spread += 1;
        renderBook();

    }


    /* =====================================================
       TURN BACK
    ====================================================== */

    function previousSpread() {

        if (spread <= 0) {
            return;
        }

        spread -= 1;
        renderBook();

    }


    /* =====================================================
       BUTTONS
    ====================================================== */

    nextButton.addEventListener(
        "click",
        nextSpread
    );

    previousButton.addEventListener(
        "click",
        previousSpread
    );


    /* =====================================================
       KEYBOARD
    ====================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            const tag =
                event.target.tagName.toLowerCase();

            if (
                tag === "input" ||
                tag === "textarea" ||
                tag === "select"
            ) {
                return;
            }


            if (event.key === "ArrowRight") {
                nextSpread();
            }

            if (event.key === "ArrowLeft") {
                previousSpread();
            }

            if (event.key === "Home") {
                spread = 0;
                renderBook();
            }

            if (event.key === "End") {
                spread = sheets.length;
                renderBook();
            }

        }
    );


    /* =====================================================
       BOOK EDGE CLICK
    ====================================================== */

    document
        .querySelector(".book")
        .addEventListener(
            "click",
            (event) => {

                /*
                   Do not hijack actual links, buttons,
                   postcards or polaroids.
                */

                if (
                    event.target.closest("a") ||
                    event.target.closest("button") ||
                    event.target.closest(".postcard") ||
                    event.target.closest(".friend")
                ) {
                    return;
                }


                const book =
                    event.currentTarget;

                const rect =
                    book.getBoundingClientRect();

                const x =
                    event.clientX - rect.left;


                /*
                   Generous dead-zone in the middle so
                   clicking normal content doesn't turn pages.
                */

                if (x <= rect.width * .12) {
                    previousSpread();
                    return;
                }

                if (x >= rect.width * .88) {
                    nextSpread();
                }

            }
        );


    /* =====================================================
       SWIPE
    ====================================================== */

    let touchStartX = null;

    document.addEventListener(
        "touchstart",
        (event) => {

            if (event.touches.length !== 1) {
                return;
            }

            touchStartX =
                event.touches[0].clientX;

        },
        {
            passive: true
        }
    );


    document.addEventListener(
        "touchend",
        (event) => {

            if (touchStartX === null) {
                return;
            }

            const touchEndX =
                event.changedTouches[0].clientX;

            const distance =
                touchEndX - touchStartX;

            touchStartX = null;

            if (Math.abs(distance) < 65) {
                return;
            }

            if (distance < 0) {
                nextSpread();
            } else {
                previousSpread();
            }

        },
        {
            passive: true
        }
    );


    /* =====================================================
       POSTCARD FLIPS
    ====================================================== */

    document
        .querySelectorAll(".postcard")
        .forEach((postcard) => {

            const flip = () => {
                postcard.classList.toggle("is-flipped");
            };

            postcard.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();
                    flip();
                }
            );

            postcard.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();
                        event.stopPropagation();
                        flip();
                    }

                }
            );

        });


    /* =====================================================
       INDEX ENTRIES
    ====================================================== */

    document
        .querySelectorAll(".index-entry")
        .forEach((entry) => {

            entry.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    const target =
                        Number(
                            entry.dataset.pageTarget
                        );

                    if (!Number.isInteger(target)) {
                        return;
                    }

                    /*
                       Index entry targets are page numbers.
                       Convert them to spreads:
                       0/1 -> spread 0
                       2/3 -> spread 1
                       4/5 -> spread 2
                    */

                    const targetSpread =
                        Math.min(
                            sheets.length,
                            Math.ceil(target / 2)
                        );

                    spread = targetSpread;
                    renderBook();

                }
            );

        });


    /* =====================================================
       RETURN TO INDEX
    ====================================================== */

    restartButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            /*
               Index is the first right-hand page.
            */

            spread = 0;
            renderBook();

        }
    );


    /* =====================================================
       INITIALISE
    ====================================================== */

    renderBook();

});
