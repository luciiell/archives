document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       BOOK ELEMENTS
    ======================================================== */

    const book =
        document.getElementById("scrapbook");

    const spreads =
        Array.from(
            document.querySelectorAll(".spread")
        );

    const pages =
        Array.from(
            document.querySelectorAll(".page")
        );

    const currentPageElement =
        document.getElementById("current-page");

    const totalPagesElement =
        document.getElementById("total-pages");


    /* ========================================================
       BOOK STATE
    ======================================================== */

    let currentSpread = 0;

    let isAnimating = false;

    const totalSpreads =
        spreads.length;


    totalPagesElement.textContent =
        totalSpreads;


    /* ========================================================
       SECTION MAP
    ======================================================== */

    const sectionMap = {};

    spreads.forEach((spread, index) => {

        const section =
            spread.dataset.section;

        if (section) {

            sectionMap[section] =
                index;

        }

    });


    /* ========================================================
       INITIAL BOOK STATE
    ======================================================== */

    setupPages();

    updateCounter();

    updateButtons();


    /* ========================================================
       SET UP PHYSICAL PAGE STACK
    ======================================================== */

    function setupPages() {

        pages.forEach((page, index) => {

            /*
               Every page starts visible in its natural
               location.
            */

            page.classList.remove(
                "turned",
                "flipping-forward",
                "flipping-backward"
            );


            /*
               Put later pages above earlier pages.
            */

            page.style.zIndex =
                index + 1;

        });

    }


    /* ========================================================
       NEXT PAGE / SPREAD
    ======================================================== */

    function nextSpread() {

        if (
            isAnimating ||
            currentSpread >= totalSpreads - 1
        ) {
            return;
        }


        isAnimating = true;


        /*
           The current spread consists of:

           left page
           right page

           We want the RIGHT page to turn first.
        */

        const current =
            spreads[currentSpread];

        const rightPage =
            current.querySelector(
                ".page-right"
            );


        if (!rightPage) {

            isAnimating = false;

            return;

        }


        rightPage.classList.add(
            "flipping-forward"
        );


        /*
           Wait for the physical page animation
           to finish before revealing the next spread.
        */

        setTimeout(() => {

            rightPage.classList.add(
                "turned"
            );

            rightPage.classList.remove(
                "flipping-forward"
            );


            currentSpread++;


            showNewSpread();


            isAnimating = false;

        }, 1000);

    }


    /* ========================================================
       PREVIOUS PAGE / SPREAD
    ======================================================== */

    function previousSpread() {

        if (
            isAnimating ||
            currentSpread <= 0
        ) {
            return;
        }


        isAnimating = true;


        /*
           Find the previous spread's right page.
           That is the sheet that needs to flip back.
        */

        const previous =
            spreads[currentSpread - 1];

        const rightPage =
            previous.querySelector(
                ".page-right"
            );


        if (!rightPage) {

            isAnimating = false;

            return;

        }


        /*
           Remove the turned state and rotate
           the page back into position.
        */

        rightPage.classList.add(
            "flipping-backward"
        );


        setTimeout(() => {

            rightPage.classList.remove(
                "flipping-backward",
                "turned"
            );


            currentSpread--;


            showNewSpread();


            isAnimating = false;

        }, 1000);

    }


    /* ========================================================
       SHOW CURRENT SPREAD
       ======================================================== */

    function showNewSpread() {

        spreads.forEach(
            (spread, index) => {

                /*
                   The spread itself is still used for
                   identifying which pages belong together.
                */

                spread.classList.toggle(
                    "active",
                    index === currentSpread
                );

            }
        );


        updateCounter();

        updateButtons();

    }


    /* ========================================================
       COUNTER
       ======================================================== */

    function updateCounter() {

        currentPageElement.textContent =
            currentSpread + 1;

    }


    /* ========================================================
       BUTTON STATES
       ======================================================== */

    function updateButtons() {

        document
            .querySelectorAll(
                '[data-action="previous"]'
            )
            .forEach(button => {

                button.disabled =
                    currentSpread === 0;

            });


        document
            .querySelectorAll(
                '[data-action="next"]'
            )
            .forEach(button => {

                button.disabled =
                    currentSpread === totalSpreads - 1;

            });

    }


    /* ========================================================
       HOME
       ======================================================== */

    function goHome() {

        if (isAnimating) {
            return;
        }


        /*
           If we're already home, nothing to do.
        */

        if (currentSpread === 0) {
            return;
        }


        /*
           Return one spread at a time so the book
           actually flips backwards.
        */

        const returnHome =
            () => {

                if (currentSpread === 0) {
                    return;
                }


                previousSpread();


                setTimeout(
                    returnHome,
                    1050
                );

            };


        returnHome();

    }


    /* ========================================================
       GO TO SPREAD
       ======================================================== */

    function goToSpread(index) {

        if (
            isAnimating ||
            index < 0 ||
            index >= totalSpreads ||
            index === currentSpread
        ) {
            return;
        }


        /*
           Move through the book physically rather than
           instantly teleporting.
        */

        if (index > currentSpread) {

            nextSpread();

            setTimeout(() => {

                if (currentSpread < index) {
                    goToSpread(index);
                }

            }, 1050);

        }

        else {

            previousSpread();

            setTimeout(() => {

                if (currentSpread > index) {
                    goToSpread(index);
                }

            }, 1050);

        }

    }


    /* ========================================================
       GO TO SECTION
       ======================================================== */

    function goToSection(section) {

        if (
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
       BUTTON HANDLING
       ======================================================== */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            switch (
                button.dataset.action
            ) {

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
       INDEX LINKS
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


            goToSection(
                link.dataset.goTo
            );

        }
    );


    /* ========================================================
       KEYBOARD
       ======================================================== */

    document.addEventListener(
        "keydown",
        event => {

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

                event.preventDefault();

                nextSpread();

            }


            if (event.key === "ArrowLeft") {

                event.preventDefault();

                previousSpread();

            }


            if (event.key === "Home") {

                event.preventDefault();

                goHome();

            }

        }
    );


    /* ========================================================
       URL HASHES
       ======================================================== */

    function handleHash() {

        const hash =
            window.location.hash
                .replace("#", "")
                .trim();


        if (!hash) {
            return;
        }


        if (
            Object.prototype.hasOwnProperty.call(
                sectionMap,
                hash
            )
        ) {

            /*
               Start at the front and physically
               turn toward the requested section.
            */

            currentSpread = 0;

            setupPages();

            goToSpread(
                sectionMap[hash]
            );

        }

    }


    window.addEventListener(
        "hashchange",
        handleHash
    );


    /* ========================================================
       PUBLIC API
       ======================================================== */

    window.Scrapbook = {

        next: nextSpread,

        previous: previousSpread,

        home: goHome,

        index: () =>
            goToSection("index"),

        goTo: goToSection,

        goToSpread: goToSpread

    };

});
