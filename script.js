/* ============================================================
   LUC'S SCRAPBOOK ARCHIVE
   Book navigation
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       01. ELEMENTS
    ======================================================== */

    const spreads = Array.from(
        document.querySelectorAll(".spread")
    );

    const currentPageElement =
        document.getElementById("current-page");

    const totalPagesElement =
        document.getElementById("total-pages");


    /* ========================================================
       02. SETTINGS
    ======================================================== */

    let currentSpread = 0;

    const totalSpreads = spreads.length;


    /*
       Each section name corresponds to a spread.

       This allows links such as:

           #characters
           #worlds
           #writing
           #art
           #misc

       to jump directly to the correct spread.
    */

    const sectionMap = {};

    spreads.forEach((spread, index) => {

        const section =
            spread.dataset.section;

        if (section) {
            sectionMap[section] = index;
        }

    });


    /* ========================================================
       03. INITIALIZE
    ======================================================== */

    totalPagesElement.textContent =
        totalSpreads;

    /*
       Make sure the first spread is visible
       immediately when the website loads.
    */

    showSpread(0, false);


    /*
       If someone visits a direct URL such as:

           index.html#characters

       automatically jump to that spread.
    */

    handleHash();


    /* ========================================================
       04. SHOW SPREAD
    ======================================================== */

    function showSpread(index, updateURL = true) {

        /*
           Prevent going outside the book.
        */

        if (index < 0) {
            index = 0;
        }

        if (index >= totalSpreads) {
            index = totalSpreads - 1;
        }


        currentSpread = index;


        /*
           Hide every spread.
        */

        spreads.forEach((spread, spreadIndex) => {

            const isActive =
                spreadIndex === currentSpread;

            spread.classList.toggle(
                "active",
                isActive
            );

            /*
               Accessibility:
               inactive spreads are hidden from
               screen readers.
            */

            spread.setAttribute(
                "aria-hidden",
                isActive ? "false" : "true"
            );

        });


        /*
           Update the page counter.
        */

        currentPageElement.textContent =
            currentSpread + 1;


        /*
           Update button states.
        */

        updateNavigationButtons();


        /*
           Update the URL hash.

           This means the current section can be
           bookmarked or linked to directly.
        */

        if (updateURL) {

            const section =
                spreads[currentSpread].dataset.section;

            if (section) {

                history.replaceState(
                    null,
                    "",
                    `#${section}`
                );

            }

        }

    }


    /* ========================================================
       05. NEXT SPREAD
    ======================================================== */

    function nextSpread() {

        if (currentSpread < totalSpreads - 1) {

            showSpread(
                currentSpread + 1
            );

        }

    }


    /* ========================================================
       06. PREVIOUS SPREAD
    ======================================================== */

    function previousSpread() {

        if (currentSpread > 0) {

            showSpread(
                currentSpread - 1
            );

        }

    }


    /* ========================================================
       07. GO TO SPREAD
    ======================================================== */

    function goToSpread(index) {

        if (
            typeof index !== "number" ||
            index < 0 ||
            index >= totalSpreads
        ) {
            return;
        }

        showSpread(index);

    }


    /* ========================================================
       08. GO TO SECTION
    ======================================================== */

    function goToSection(section) {

        if (
            !section ||
            !Object.prototype.hasOwnProperty.call(
                sectionMap,
                section
            )
        ) {
            return;
        }

        goToSpread(
            sectionMap[section]
        );

    }


    /* ========================================================
       09. HOME
    ======================================================== */

    function goHome() {

        goToSpread(0);

    }


    /* ========================================================
       10. UPDATE NAVIGATION BUTTONS
    ======================================================== */

    function updateNavigationButtons() {

        const previousButtons =
            document.querySelectorAll(
                '[data-action="previous"]'
            );

        const nextButtons =
            document.querySelectorAll(
                '[data-action="next"]'
            );


        previousButtons.forEach(button => {

            button.disabled =
                currentSpread === 0;

            button.setAttribute(
                "aria-disabled",
                currentSpread === 0
            );

        });


        nextButtons.forEach(button => {

            button.disabled =
                currentSpread === totalSpreads - 1;

            button.setAttribute(
                "aria-disabled",
                currentSpread === totalSpreads - 1
            );

        });

    }


    /* ========================================================
       11. BUTTON CONTROLS
    ======================================================== */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            /*
               Nothing to do if the clicked
               element isn't a navigation button.
            */

            if (!button) {
                return;
            }


            const action =
                button.dataset.action;


            switch (action) {

                case "next":
                    nextSpread();
                    break;

                case "previous":
                    previousSpread();
                    break;

                case "home":
                    goHome();
                    break;

                case "index":
                    goToSection("index");
                    break;

            }

        }
    );


    /* ========================================================
       12. INDEX / INTERNAL LINKS
    ======================================================== */

    document.addEventListener(
        "click",
        event => {

            const link =
                event.target.closest(
                    "[data-go-to]"
                );


            if (!link) {
                return;
            }


            event.preventDefault();


            const section =
                link.dataset.goTo;


            goToSection(section);

        }
    );


    /* ========================================================
       13. KEYBOARD NAVIGATION
    ======================================================== */

    document.addEventListener(
        "keydown",
        event => {

            /*
               Don't hijack keyboard navigation while
               someone is typing in a form field.
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


            switch (event.key) {

                case "ArrowRight":
                    event.preventDefault();
                    nextSpread();
                    break;

                case "ArrowLeft":
                    event.preventDefault();
                    previousSpread();
                    break;

                case "Home":
                    event.preventDefault();
                    goHome();
                    break;

            }

        }
    );


    /* ========================================================
       14. URL HASH NAVIGATION
    ======================================================== */

    function handleHash() {

        const hash =
            window.location.hash
                .replace("#", "")
                .trim();


        /*
           No hash means start at the beginning.
        */

        if (!hash) {
            showSpread(0, false);
            return;
        }


        /*
           Check whether the hash corresponds
           to a known section.
        */

        if (
            Object.prototype.hasOwnProperty.call(
                sectionMap,
                hash
            )
        ) {

            goToSpread(
                sectionMap[hash]
            );

            return;
        }


        /*
           Otherwise, look for an element with
           that ID.

           This makes future direct links possible.
        */

        const target =
            document.getElementById(hash);


        if (target) {

            const spread =
                target.closest(".spread");


            if (spread) {

                const spreadIndex =
                    spreads.indexOf(spread);


                if (spreadIndex !== -1) {

                    goToSpread(
                        spreadIndex
                    );

                }

            }

        }

    }


    /* ========================================================
       15. BROWSER BACK / FORWARD
    ======================================================== */

    window.addEventListener(
        "hashchange",
        handleHash
    );


    /* ========================================================
       16. PREVENT BROKEN IMAGE ICONS
       ======================================================== */

    /*
       For now, missing placeholder images won't
       completely wreck the scrapbook layout.

       Later, once your actual images are added,
       this can simply remain harmlessly in place.
    */

    document
        .querySelectorAll(".page img")
        .forEach(image => {

            image.addEventListener(
                "error",
                () => {

                    image.classList.add(
                        "image-missing"
                    );

                }
            );

        });


    /* ========================================================
       17. EXPOSE OPTIONAL NAVIGATION
       ======================================================== */

    /*
       These are available globally if you eventually
       want buttons, stickers, or other scrapbook
       elements to call them directly.

       Example:

           onclick="Scrapbook.goTo('characters')"
    */

    window.Scrapbook = {

        next: nextSpread,

        previous: previousSpread,

        home: goHome,

        index: () =>
            goToSection("index"),

        goTo: goToSection,

        goToSpread: goToSpread,

        getCurrentSpread: () =>
            currentSpread,

        getTotalSpreads: () =>
            totalSpreads

    };


});
