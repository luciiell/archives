/* =========================================================
   DREAMLAND JOURNAL
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const pages = [
        ...document.querySelectorAll(".page-turn")
    ];

    const previousButton =
        document.getElementById("previousPage");

    const nextButton =
        document.getElementById("nextPage");

    const currentPage =
        document.getElementById("currentPage");

    const restartButton =
        document.getElementById("restartBook");


    let current = 0;

    const total = pages.length;


    /* =====================================================
       UPDATE PAGE STATE
    ====================================================== */

    function updateBook() {

        pages.forEach((page, index) => {

            page.classList.toggle(
                "flipped",
                index < current
            );

        });


        currentPage.textContent =
            String(Math.min(current + 1, total))
                .padStart(2, "0");


        previousButton.disabled =
            current === 0;

        nextButton.disabled =
            current === total;


        /*
         * Make the navigation state feel like
         * an actual book rather than a normal website.
         */

        if (current === total) {

            currentPage.textContent =
                String(total).padStart(2, "0");

        }

    }


    /* =====================================================
       NEXT PAGE
    ====================================================== */

    function nextPage() {

        if (current >= total) {
            return;
        }

        current++;

        updateBook();

    }


    /* =====================================================
       PREVIOUS PAGE
    ====================================================== */

    function previousPage() {

        if (current <= 0) {
            return;
        }

        current--;

        updateBook();

    }


    /* =====================================================
       NAVIGATION BUTTONS
    ====================================================== */

    nextButton.addEventListener(
        "click",
        nextPage
    );


    previousButton.addEventListener(
        "click",
        previousPage
    );


    /* =====================================================
       KEYBOARD
    ====================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            /*
             * Don't hijack arrow keys while someone
             * is interacting with a form field.
             */

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

                nextPage();

            }


            if (event.key === "ArrowLeft") {

                previousPage();

            }


            if (event.key === "Home") {

                current = 0;

                updateBook();

            }


            if (event.key === "End") {

                current = total;

                updateBook();

            }

        }
    );


    /* =====================================================
       CLICK PAGE EDGE
    ====================================================== */

    document.addEventListener(
        "click",
        (event) => {

            const bookScene =
                event.target.closest(".book-scene");

            if (!bookScene) {
                return;
            }


            /*
             * Ignore interactive elements.
             */

            if (
                event.target.closest("a") ||
                event.target.closest("button") ||
                event.target.closest(".postcard")
            ) {

                return;

            }


            const rect =
                bookScene.getBoundingClientRect();

            const x =
                event.clientX - rect.left;


            /*
             * Clicking the right side advances.
             * Clicking the left side goes backward.
             */

            if (x > rect.width * 0.72) {

                nextPage();

            } else if (x < rect.width * 0.28) {

                previousPage();

            }

        }
    );


    /* =====================================================
       SWIPE SUPPORT
    ====================================================== */

    let touchStartX = null;


    document.addEventListener(
        "touchstart",
        (event) => {

            if (
                !event.touches ||
                event.touches.length !== 1
            ) {

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


            /*
             * Require a meaningful swipe.
             */

            if (Math.abs(distance) < 60) {
                return;
            }


            if (distance < 0) {

                nextPage();

            } else {

                previousPage();

            }

        },
        {
            passive: true
        }
    );


    /* =====================================================
       RESTART
    ====================================================== */

    restartButton.addEventListener(
        "click",
        () => {

            current = 0;

            updateBook();

        }
    );


    /* =====================================================
       POSTCARD FLIPS
    ====================================================== */

    document
        .querySelectorAll(".postcard")
        .forEach((postcard) => {

            postcard.addEventListener(
                "click",
                (event) => {

                    /*
                     * Prevent the postcard click from
                     * being interpreted as book navigation.
                     */

                    event.stopPropagation();

                    postcard.classList.toggle(
                        "is-flipped"
                    );

                }
            );

        });


    /* =====================================================
       INITIAL STATE
    ====================================================== */

    updateBook();

});
