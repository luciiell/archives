document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       DREAMLAND ARCHIVES
       CONTINUOUS PHYSICAL BOOK SYSTEM

       The original HTML is structured as:

       spread 0:
           left  = intro
           right = cover

       spread 1:
           left  = index left
           right = index right

       spread 2:
           left  = characters left
           right = characters right

       etc.

       JavaScript converts that into physical sheets:

       sheet 0:
           front = spread 0 right
           back  = spread 1 left

       sheet 1:
           front = spread 1 right
           back = spread 2 left

       etc.

       This means a page actually lands on the opposite
       side of the book instead of being replaced.
    ======================================================== */


    /* ========================================================
       BOOK ELEMENTS
    ======================================================== */

    const book =
        document.getElementById("scrapbook");


    if (!book) {
        return;
    }


    const spreads =
        Array.from(
            book.querySelectorAll(".spread")
        );


    if (!spreads.length) {
        return;
    }


    const currentPageElement =
        document.getElementById("current-page");


    const totalPagesElement =
        document.getElementById("total-pages");


    /* ========================================================
       BOOK CONSTANTS
    ======================================================== */

    const FLIP_TIME = 950;

    const NAVIGATION_BUFFER = 40;

    const NAVIGATION_DELAY =
        FLIP_TIME + NAVIGATION_BUFFER;


    /* ========================================================
       BOOK STATE
    ======================================================== */

    let currentSpread = 0;

    let isAnimating = false;

    let navigationTimer = null;

    const totalSpreads =
        spreads.length;


    /* ========================================================
       SECTION MAP
    ======================================================== */

    const sectionMap = {};


    spreads.forEach(
        (spread, index) => {

            const section =
                spread.dataset.section;


            if (section) {

                sectionMap[section] =
                    index;

            }

        }
    );


    /* ========================================================
       BUILD PHYSICAL BOOK
    ======================================================== */

    const sheets = [];

    let flipbookLayer = null;


    function buildPhysicalBook() {

        /*
           Prevent accidental double initialization.
        */

        if (
            book.querySelector(
                ".flipbook-layer"
            )
        ) {

            return;

        }


        /* ----------------------------------------------------
           Create the physical sheet layer
           ---------------------------------------------------- */

        flipbookLayer =
            document.createElement("div");

        flipbookLayer.className =
            "flipbook-layer";


        /* ----------------------------------------------------
           FIRST STATIC LEFT PAGE
           ----------------------------------------------------

           This is the left page visible before any sheet
           has been turned.

           Example:

               INTRO | COVER

           Intro stays underneath the sheets.
        */

        const firstSpread =
            spreads[0];


        const firstLeft =
            firstSpread.querySelector(
                ".page-left"
            );


        if (firstLeft) {

            firstLeft.classList.remove(
                "page-left"
            );

            firstLeft.classList.add(
                "static-page",
                "static-left"
            );

            book.appendChild(
                firstLeft
            );

        }


        /* ----------------------------------------------------
           CREATE PHYSICAL SHEETS
           ----------------------------------------------------

           Every sheet connects two consecutive spreads.

           Sheet 0:
               front = spread 0 right
               back  = spread 1 left

           Sheet 1:
               front = spread 1 right
               back  = spread 2 left
        */

        for (
            let i = 0;
            i < totalSpreads - 1;
            i++
        ) {

            const current =
                spreads[i];


            const next =
                spreads[i + 1];


            const front =
                current.querySelector(
                    ".page-right"
                );


            const back =
                next.querySelector(
                    ".page-left"
                );


            if (
                !front ||
                !back
            ) {

                continue;

            }


            const sheet =
                document.createElement("div");


            sheet.className =
                "flip-sheet";


            sheet.dataset.sheetIndex =
                String(i);


            /*
               Critical stacking system.

               Earlier sheets are physically above later
               sheets.

               Example:

                   sheet 0 = 100
                   sheet 1 = 99
                   sheet 2 = 98

               When sheet 0 turns, sheet 1 is already
               underneath it.

               When sheet 0 turns back, it is still above
               sheet 1.

               This is what makes the book continuous.
            */

            sheet.style.zIndex =
                String(
                    1000 - i
                );


            /* ------------------------------------------------
               FRONT
               ------------------------------------------------ */

            front.classList.remove(
                "page-right"
            );


            front.classList.add(
                "flip-sheet-face",
                "flip-sheet-front"
            );


            /* ------------------------------------------------
               BACK
               ------------------------------------------------ */

            back.classList.remove(
                "page-left"
            );


            back.classList.add(
                "flip-sheet-face",
                "flip-sheet-back"
            );


            /* ------------------------------------------------
               Put both sides on the same physical sheet
               ------------------------------------------------ */

            sheet.appendChild(
                front
            );


            sheet.appendChild(
                back
            );


            flipbookLayer.appendChild(
                sheet
            );


            sheets.push(
                sheet
            );

        }


        /* ----------------------------------------------------
           FINAL STATIC RIGHT PAGE
           ----------------------------------------------------

           After every physical sheet has turned, this is
           what remains on the right.

           Example:

               MISC LEFT | MISC RIGHT
        */

        const finalSpread =
            spreads[
                totalSpreads - 1
            ];


        const finalRight =
            finalSpread.querySelector(
                ".page-right"
            );


        if (finalRight) {

            finalRight.classList.remove(
                "page-right"
            );


            finalRight.classList.add(
                "static-page",
                "static-right"
            );


            flipbookLayer.appendChild(
                finalRight
            );

        }


        /* ----------------------------------------------------
           Remove the old spread wrappers.

           Their pages have already been moved into the
           physical sheets or static pages.
        */

        spreads.forEach(
            spread => {

                spread.remove();

            }
        );


        /* ----------------------------------------------------
           Insert physical layer into book
           ---------------------------------------------------- */

        const bookBack =
            book.querySelector(
                ".book-back"
            );


        if (bookBack) {

            bookBack.insertAdjacentElement(
                "afterend",
                flipbookLayer
            );

        } else {

            book.prepend(
                flipbookLayer
            );

        }

    }


    /* ========================================================
       INITIALIZE PHYSICAL BOOK
    ======================================================== */

    buildPhysicalBook();


    /* ========================================================
       COUNTER
    ======================================================== */

    if (totalPagesElement) {

        totalPagesElement.textContent =
            String(totalSpreads);

    }


    /* ========================================================
       UPDATE COUNTER
    ======================================================== */

    function updateCounter() {

        if (!currentPageElement) {
            return;
        }


        currentPageElement.textContent =
            String(
                currentSpread + 1
            );

    }


    /* ========================================================
       UPDATE BUTTONS
    ======================================================== */

    function updateButtons() {

        document
            .querySelectorAll(
                '[data-action="previous"]'
            )
            .forEach(
                button => {

                    button.disabled =
                        isAnimating ||
                        currentSpread === 0;

                }
            );


        document
            .querySelectorAll(
                '[data-action="next"]'
            )
            .forEach(
                button => {

                    button.disabled =
                        isAnimating ||
                        currentSpread ===
                        totalSpreads - 1;

                }
            );

    }


    /* ========================================================
       HASH MANAGEMENT
    ======================================================== */

    function updateHash(
        usePushState = false
    ) {

        const spread =
            spreads[currentSpread];


        if (!spread) {
            return;
        }


        const section =
            spread.dataset.section;


        if (!section) {
            return;
        }


        const newHash =
            `#${section}`;


        if (
            window.location.hash ===
            newHash
        ) {

            return;

        }


        if (usePushState) {

            history.pushState(
                {
                    scrapbookSpread:
                        currentSpread
                },
                "",
                newHash
            );

        } else {

            history.replaceState(
                {
                    scrapbookSpread:
                        currentSpread
                },
                "",
                newHash
            );

        }

    }


    /* ========================================================
       SET SHEET STATE
    ======================================================== */

    function setSheetState(
        targetSpread
    ) {

        /*
           Every sheet before the current spread has
           physically turned.

           Every sheet at or after the current spread
           remains unturned.
        */

        sheets.forEach(
            (sheet, index) => {

                const shouldBeTurned =
                    index <
                    targetSpread;


                sheet.classList.toggle(
                    "is-turned",
                    shouldBeTurned
                );


                sheet.classList.remove(
                    "is-turning"
                );

            }
        );

    }


    /* ========================================================
       INITIAL STATE
    ======================================================== */

    function initializeBook() {

        currentSpread = 0;

        isAnimating = false;

        setSheetState(
            currentSpread
        );

        updateCounter();

        updateButtons();

        updateHash(
            false
        );

    }


    initializeBook();


    /* ========================================================
       TURN ONE SHEET FORWARD
    ======================================================== */

    function turnForward() {

        if (
            isAnimating ||
            currentSpread >=
            totalSpreads - 1
        ) {

            return Promise.resolve(
                false
            );

        }


        const sheet =
            sheets[currentSpread];


        if (!sheet) {

            return Promise.resolve(
                false
            );

        }


        isAnimating = true;

        updateButtons();


        /* ----------------------------------------------------
           Shadow/turning state
           ---------------------------------------------------- */

        sheet.classList.add(
            "is-turning"
        );


        /*
           The CSS transition itself performs:

               rotateY(0deg)
                    ↓
               rotateY(-180deg)

           We do NOT remove the turned state afterward.

           This is the critical difference from the old
           implementation.
        */

        /*
           Force the browser to acknowledge the current
           state before changing it.

           This prevents some browsers from collapsing the
           two transform states into one frame.
        */

        void sheet.offsetWidth;


        sheet.classList.add(
            "is-turned"
        );


        return new Promise(
            resolve => {

                let finished = false;


                const finish =
                    () => {

                        if (finished) {
                            return;
                        }


                        finished = true;


                        sheet.removeEventListener(
                            "transitionend",
                            onTransitionEnd
                        );


                        sheet.classList.remove(
                            "is-turning"
                        );


                        currentSpread++;


                        updateCounter();

                        updateButtons();

                        updateHash(
                            true
                        );


                        isAnimating = false;

                        updateButtons();


                        resolve(
                            true
                        );

                    };


                const onTransitionEnd =
                    event => {

                        if (
                            event.propertyName !==
                            "transform"
                        ) {

                            return;

                        }


                        if (
                            event.target !==
                            sheet
                        ) {

                            return;

                        }


                        finish();

                    };


                sheet.addEventListener(
                    "transitionend",
                    onTransitionEnd
                );


                /*
                   Safety fallback.

                   If a browser does not fire transitionend,
                   the book still completes correctly.
                */

                setTimeout(
                    finish,
                    FLIP_TIME + 100
                );

            }
        );

    }


    /* ========================================================
       TURN ONE SHEET BACKWARD
    ======================================================== */

    function turnBackward() {

        if (
            isAnimating ||
            currentSpread <= 0
        ) {

            return Promise.resolve(
                false
            );

        }


        /*
           The sheet immediately before the current spread
           is the sheet that is currently lying on the
           LEFT side.

           Example:

               currentSpread = 3

               sheets:
                   0 = turned
                   1 = turned
                   2 = turned ← THIS ONE FLIPS BACK
                   3 = unturned
        */

        const sheet =
            sheets[
                currentSpread - 1
            ];


        if (!sheet) {

            return Promise.resolve(
                false
            );

        }


        isAnimating = true;

        updateButtons();


        sheet.classList.add(
            "is-turning"
        );


        /*
           Force a layout read before removing the turned
           state so the browser performs the actual reverse
           animation instead of snapping.
        */

        void sheet.offsetWidth;


        /*
           Removing .is-turned changes:

               rotateY(-180deg)
                     ↓
               rotateY(0deg)

           The same physical sheet therefore swings back
           to the right.
        */

        sheet.classList.remove(
            "is-turned"
        );


        return new Promise(
            resolve => {

                let finished = false;


                const finish =
                    () => {

                        if (finished) {
                            return;
                        }


                        finished = true;


                        sheet.removeEventListener(
                            "transitionend",
                            onTransitionEnd
                        );


                        sheet.classList.remove(
                            "is-turning"
                        );


                        currentSpread--;


                        updateCounter();

                        updateButtons();

                        updateHash(
                            true
                        );


                        isAnimating = false;

                        updateButtons();


                        resolve(
                            true
                        );

                    };


                const onTransitionEnd =
                    event => {

                        if (
                            event.propertyName !==
                            "transform"
                        ) {

                            return;

                        }


                        if (
                            event.target !==
                            sheet
                        ) {

                            return;

                        }


                        finish();

                    };


                sheet.addEventListener(
                    "transitionend",
                    onTransitionEnd
                );


                setTimeout(
                    finish,
                    FLIP_TIME + 100
                );

            }
        );

    }


    /* ========================================================
       NEXT
    ======================================================== */

    async function nextSpread() {

        await turnForward();

    }


    /* ========================================================
       PREVIOUS
    ======================================================== */

    async function previousSpread() {

        await turnBackward();

    }


    /* ========================================================
       HOME
    ======================================================== */

    async function goHome() {

        if (
            isAnimating ||
            currentSpread === 0
        ) {

            return;

        }


        /*
           Physically turn the book backward one sheet at
           a time.

           Example:

               spread 5
                  ↓
               spread 4
                  ↓
               spread 3
                  ↓
               spread 2
                  ↓
               spread 1
                  ↓
               spread 0
        */

        while (
            currentSpread > 0
        ) {

            await turnBackward();

        }

    }


    /* ========================================================
       GO TO SPREAD
    ======================================================== */

    async function goToSpread(
        targetIndex,
        updateBrowserHistory = true
    ) {

        const target =
            Number(targetIndex);


        if (
            !Number.isInteger(target)
        ) {

            return;

        }


        if (
            target < 0 ||
            target >= totalSpreads
        ) {

            return;

        }


        if (
            isAnimating ||
            target === currentSpread
        ) {

            return;

        }


        /*
           Move forward physically.
        */

        if (
            target >
            currentSpread
        ) {

            while (
                currentSpread <
                target
            ) {

                await turnForward();

            }

        }


        /*
           Move backward physically.
        */

        else {

            while (
                currentSpread >
                target
            ) {

                await turnBackward();

            }

        }


        /*
           The individual turn functions update the hash
           as they go.

           If this navigation originated from a direct
           section request, make sure the final URL is
           correct.
        */

        if (
            updateBrowserHistory
        ) {

            updateHash(
                false
            );

        }

    }


    /* ========================================================
       GO TO SECTION
    ======================================================== */

    function goToSection(
        section,
        updateBrowserHistory = true
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                sectionMap,
                section
            )
        ) {

            return;

        }


        const target =
            sectionMap[section];


        goToSpread(
            target,
            updateBrowserHistory
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


            const action =
                button.dataset.action;


            switch (action) {

                case "next":

                    event.preventDefault();

                    nextSpread();

                    break;


                case "previous":

                    event.preventDefault();

                    previousSpread();

                    break;


                case "home":

                    event.preventDefault();

                    goHome();

                    break;


                case "index":

                    event.preventDefault();

                    goToSection(
                        "index"
                    );

                    break;

            }

        }
    );


    /* ========================================================
       INDEX / ARCHIVE LINKS
       ======================================================== */

    document.addEventListener(
        "click",
        event => {

            /*
               Your index links use:

                   data-go-to="characters"

               so they physically turn to that spread.
            */

            const dataLink =
                event.target.closest(
                    "[data-go-to]"
                );


            if (dataLink) {

                event.preventDefault();


                if (
                    isAnimating
                ) {

                    return;

                }


                goToSection(
                    dataLink.dataset.goTo
                );


                return;

            }


            /*
               Also support normal hash links such as:

                   href="#characters"

               but ONLY when the hash corresponds to one
               of the archive's actual sections.

               Character links like #axel are left alone.
            */

            const anchor =
                event.target.closest(
                    'a[href^="#"]'
                );


            if (!anchor) {
                return;
            }


            const href =
                anchor.getAttribute(
                    "href"
                );


            if (
                !href ||
                href === "#"
            ) {

                return;

            }


            const section =
                href
                    .substring(1)
                    .trim();


            if (
                !Object.prototype.hasOwnProperty.call(
                    sectionMap,
                    section
                )
            ) {

                /*
                   Not an archive section.

                   Let normal browser behavior happen.
                */

                return;

            }


            event.preventDefault();


            if (
                isAnimating
            ) {

                return;

            }


            goToSection(
                section
            );

        }
    );


    /* ========================================================
       KEYBOARD NAVIGATION
    ======================================================== */

    document.addEventListener(
        "keydown",
        event => {

            const target =
                event.target;


            const tag =
                target &&
                target.tagName
                    ? target.tagName.toLowerCase()
                    : "";


            /*
               Don't hijack keyboard controls while the
               user is typing.
            */

            if (
                tag === "input" ||
                tag === "textarea" ||
                tag === "select" ||
                target?.isContentEditable
            ) {

                return;

            }


            /* ------------------------------------------------
               RIGHT ARROW
               ------------------------------------------------ */

            if (
                event.key ===
                "ArrowRight"
            ) {

                event.preventDefault();

                nextSpread();

                return;

            }


            /* ------------------------------------------------
               LEFT ARROW
               ------------------------------------------------ */

            if (
                event.key ===
                "ArrowLeft"
            ) {

                event.preventDefault();

                previousSpread();

                return;

            }


            /* ------------------------------------------------
               HOME
               ------------------------------------------------ */

            if (
                event.key ===
                "Home"
            ) {

                event.preventDefault();

                goHome();

                return;

            }


            /* ------------------------------------------------
               PAGE DOWN
               ------------------------------------------------ */

            if (
                event.key ===
                "PageDown"
            ) {

                event.preventDefault();

                nextSpread();

                return;

            }


            /* ------------------------------------------------
               PAGE UP
               ------------------------------------------------ */

            if (
                event.key ===
                "PageUp"
            ) {

                event.preventDefault();

                previousSpread();

                return;

            }

        }
    );


    /* ========================================================
       HASH → SPREAD
    ======================================================== */

    async function handleHash(
        animate = true
    ) {

        const hash =
            window.location.hash
                .replace(/^#/, "")
                .trim();


        if (!hash) {

            if (
                !isAnimating &&
                currentSpread !== 0
            ) {

                if (animate) {

                    await goToSpread(
                        0,
                        false
                    );

                } else {

                    currentSpread = 0;

                    setSheetState(
                        0
                    );

                    updateCounter();

                    updateButtons();

                }

            }

            return;

        }


        if (
            !Object.prototype.hasOwnProperty.call(
                sectionMap,
                hash
            )
        ) {

            return;

        }


        const target =
            sectionMap[hash];


        /*
           If the requested section is already visible,
           nothing needs to happen.
        */

        if (
            target === currentSpread
        ) {

            return;

        }


        /*
           For a normal hash change, physically travel
           through the book.
        */

        if (
            animate &&
            !isAnimating
        ) {

            await goToSpread(
                target,
                false
            );

            return;

        }


        /*
           For the initial page load, don't animate through
           six sheets after the browser opens the site.

           Instead establish the correct physical state
           immediately.
        */

        if (!isAnimating) {

            currentSpread =
                target;

            setSheetState(
                currentSpread
            );

            updateCounter();

            updateButtons();

        }

    }


    /* ========================================================
       BROWSER BACK / FORWARD
    ======================================================== */

    window.addEventListener(
        "popstate",
        () => {

            handleHash(
                true
            );

        }
    );


    window.addEventListener(
        "hashchange",
        () => {

            /*
               Hash changes caused by our own navigation are
               already reflected in currentSpread.

               If the user manually changes the URL/hash,
               physically navigate to it.
            */

            const hash =
                window.location.hash
                    .replace(/^#/, "")
                    .trim();


            if (
                !hash ||
                !Object.prototype.hasOwnProperty.call(
                    sectionMap,
                    hash
                )
            ) {

                return;

            }


            const target =
                sectionMap[hash];


            if (
                target === currentSpread
            ) {

                return;

            }


            if (
                !isAnimating
            ) {

                goToSpread(
                    target,
                    false
                );

            }

        }
    );


    /* ========================================================
       INITIAL URL
    ======================================================== */

    function initializeFromHash() {

        const hash =
            window.location.hash
                .replace(/^#/, "")
                .trim();


        if (
            hash &&
            Object.prototype.hasOwnProperty.call(
                sectionMap,
                hash
            )
        ) {

            /*
               Initial URL loads directly on the requested
               spread.

               We establish the physical sheet positions
               immediately.

               Subsequent navigation is animated normally.
            */

            currentSpread =
                sectionMap[hash];


            setSheetState(
                currentSpread
            );

        }


        updateCounter();

        updateButtons();


        /*
           Replace the URL state without creating a new
           browser-history entry.
        */

        updateHash(
            false
        );

    }


    initializeFromHash();


    /* ========================================================
       PUBLIC API
    ======================================================== */

    window.Scrapbook = {

        next:
            nextSpread,

        previous:
            previousSpread,

        home:
            goHome,

        index:
            () =>
                goToSection(
                    "index"
                ),

        goTo:
            goToSection,

        goToSpread:
            goToSpread,

        getCurrentSpread:
            () =>
                currentSpread,

        getTotalSpreads:
            () =>
                totalSpreads

    };

});
