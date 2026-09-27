document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =====================================================
       BASIC REFERENCES
       ===================================================== */

    const book = document.getElementById("scrapbook");

    if (!book) {
        console.warn("Scrapbook book element was not found.");
        return;
    }

    const originalSpreads = Array.from(
        book.querySelectorAll(":scope > .spread")
    );

    if (!originalSpreads.length) {
        console.warn("No scrapbook spreads were found.");
        return;
    }

    const currentPageElement =
        document.getElementById("current-page");

    const totalPageElement =
        document.getElementById("total-pages");

    const FLIP_TIME = 950;
    const NAVIGATION_BUFFER = 40;

    let currentSpread = 0;
    let isAnimating = false;

    let flipbookLayer = null;
    let sheets = [];

    const totalSpreads = originalSpreads.length;

    /* =====================================================
       SECTION MAP
       ===================================================== */

    const sectionMap = {};

    originalSpreads.forEach((spread, index) => {
        const section =
            spread.dataset.section;

        if (section) {
            sectionMap[section] = index;
        }

        /*
         * Also support IDs directly on spreads.
         */
        if (spread.id) {
            sectionMap[spread.id] = index;
        }
    });

    /* =====================================================
       BUILD PHYSICAL BOOK
       ===================================================== */

    function buildPhysicalBook() {
        flipbookLayer =
            document.createElement("div");

        flipbookLayer.className =
            "flipbook-layer";

        /*
         * -------------------------------------------------
         * STATIC LEFT PAGE
         * -------------------------------------------------
         *
         * This is the very first left page.
         */

        const firstSpread =
            originalSpreads[0];

        const firstLeft =
            firstSpread.querySelector(".page-left");

        if (firstLeft) {
            firstLeft.classList.add(
                "static-page",
                "static-left"
            );

            flipbookLayer.appendChild(firstLeft);
        }

        /*
         * -------------------------------------------------
         * PHYSICAL SHEETS
         * -------------------------------------------------
         *
         * Sheet 0:
         *   front = spread 0 right
         *   back  = spread 1 left
         *
         * Sheet 1:
         *   front = spread 1 right
         *   back  = spread 2 left
         *
         * etc.
         */

        for (
            let i = 0;
            i < totalSpreads - 1;
            i++
        ) {
            const currentSpreadElement =
                originalSpreads[i];

            const nextSpreadElement =
                originalSpreads[i + 1];

            const front =
                currentSpreadElement.querySelector(
                    ".page-right"
                );

            const back =
                nextSpreadElement.querySelector(
                    ".page-left"
                );

            if (!front || !back) {
                console.warn(
                    `Missing page on physical sheet ${i}.`
                );

                continue;
            }

            const sheet =
                document.createElement("div");

            sheet.className =
                "flip-sheet";

            sheet.dataset.sheetIndex =
                String(i);

            /*
             * Front
             */

            front.classList.add(
                "flip-sheet-face",
                "flip-sheet-front"
            );

            /*
             * Back
             */

            back.classList.add(
                "flip-sheet-face",
                "flip-sheet-back"
            );

            sheet.appendChild(front);
            sheet.appendChild(back);

            flipbookLayer.appendChild(sheet);

            sheets.push(sheet);
        }

        /*
         * -------------------------------------------------
         * STATIC RIGHT PAGE
         * -------------------------------------------------
         *
         * The final right page has no sheet after it.
         */

        const finalSpread =
            originalSpreads[
                totalSpreads - 1
            ];

        const finalRight =
            finalSpread.querySelector(
                ".page-right"
            );

        if (finalRight) {
            finalRight.classList.add(
                "static-page",
                "static-right"
            );

            flipbookLayer.appendChild(
                finalRight
            );
        }

        /*
         * Put physical layer into the book.
         */

        const bookBack =
            book.querySelector(".book-back");

        if (bookBack) {
            bookBack.insertAdjacentElement(
                "afterend",
                flipbookLayer
            );
        } else {
            book.appendChild(
                flipbookLayer
            );
        }

        /*
         * Remove original spread wrappers.
         *
         * Their page contents have already been moved
         * into the physical book.
         */

        originalSpreads.forEach(spread => {
            spread.remove();
        });
    }

    /* =====================================================
       CRITICAL:
       PHYSICAL SHEET STACKING
       ===================================================== */

    function updateSheetStacking() {
        /*
         * The stack is intentionally different depending
         * on whether a sheet has already turned.
         *
         * UNTURNED:
         *     closest/current sheet is on top.
         *
         * TURNED:
         *     older sheets are underneath newer sheets.
         *
         * This prevents previously viewed text and
         * backgrounds from remaining above the new spread.
         */

        sheets.forEach((sheet, index) => {
            const hasTurned =
                index < currentSpread;

            /*
             * A sheet currently being animated is handled
             * separately by turnForward/turnBackward.
             */

            if (sheet.classList.contains("is-turning")) {
                sheet.style.zIndex = "5000";
                return;
            }

            if (hasTurned) {
                /*
                 * Turned sheets live BELOW the current
                 * unturned stack.
                 *
                 * Higher index = newer sheet = slightly
                 * higher in the turned stack.
                 */

                sheet.style.zIndex =
                    String(100 + index);
            } else {
                /*
                 * Unturned sheets are stacked from the
                 * current sheet outward.
                 *
                 * Lower index = closer to the current
                 * visible page = higher z-index.
                 */

                sheet.style.zIndex =
                    String(
                        2000 - index
                    );
            }
        });
    }

    /* =====================================================
       SHEET VISUAL STATE
       ===================================================== */

    function setSheetState(targetSpread) {
        sheets.forEach((sheet, index) => {
            const shouldBeTurned =
                index < targetSpread;

            sheet.classList.toggle(
                "is-turned",
                shouldBeTurned
            );

            sheet.classList.remove(
                "is-turning"
            );
        });

        currentSpread =
            Math.max(
                0,
                Math.min(
                    targetSpread,
                    totalSpreads - 1
                )
            );

        updateSheetStacking();
    }

    /* =====================================================
       COUNTER
       ===================================================== */

    function updateCounter() {
        if (currentPageElement) {
            currentPageElement.textContent =
                String(currentSpread + 1);
        }

        if (totalPageElement) {
            totalPageElement.textContent =
                String(totalSpreads);
        }
    }

    /* =====================================================
       NAVIGATION BUTTONS
       ===================================================== */

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
                isAnimating ||
                currentSpread <= 0;
        });

        nextButtons.forEach(button => {
            button.disabled =
                isAnimating ||
                currentSpread >=
                    totalSpreads - 1;
        });
    }

    /* =====================================================
       HASH
       ===================================================== */

    function getHashForCurrentSpread() {
        const spread =
            originalSpreadData[currentSpread];

        if (!spread) {
            return null;
        }

        return (
            spread.section ||
            spread.id ||
            null
        );
    }

    /*
     * We need a small data representation because the
     * original spread DOM nodes are removed during setup.
     */

    const originalSpreadData =
        originalSpreads.map(
            spread => ({
                id: spread.id || null,
                section:
                    spread.dataset.section ||
                    null
            })
        );

    function updateHash() {
        const section =
            getHashForCurrentSpread();

        if (!section) {
            return;
        }

        const newHash =
            `#${section}`;

        if (
            window.location.hash !==
            newHash
        ) {
            history.replaceState(
                null,
                "",
                newHash
            );
        }
    }

    /* =====================================================
       WAIT FOR FLIP
       ===================================================== */

    function waitForFlip(sheet) {
        return new Promise(resolve => {
            let finished = false;

            const finish = () => {
                if (finished) {
                    return;
                }

                finished = true;

                sheet.removeEventListener(
                    "transitionend",
                    onTransitionEnd
                );

                clearTimeout(
                    fallbackTimer
                );

                resolve();
            };

            const onTransitionEnd = event => {
                if (
                    event.target === sheet &&
                    event.propertyName ===
                        "transform"
                ) {
                    finish();
                }
            };

            sheet.addEventListener(
                "transitionend",
                onTransitionEnd
            );

            const fallbackTimer =
                setTimeout(
                    finish,
                    FLIP_TIME +
                        NAVIGATION_BUFFER
                );
        });
    }

    /* =====================================================
       FORWARD FLIP
       ===================================================== */

    async function turnForward() {
        if (isAnimating) {
            return false;
        }

        if (
            currentSpread >=
            totalSpreads - 1
        ) {
            return false;
        }

        const sheet =
            sheets[currentSpread];

        if (!sheet) {
            return false;
        }

        isAnimating = true;

        updateNavigationButtons();

        /*
         * IMPORTANT:
         *
         * Keep the turning sheet ABOVE EVERYTHING while
         * the animation is happening.
         */

        sheet.classList.add(
            "is-turning"
        );

        sheet.style.zIndex = "5000";

        /*
         * Force the browser to recognize the starting
         * transform before applying the turned state.
         */

        void sheet.offsetWidth;

        sheet.classList.add(
            "is-turned"
        );

        await waitForFlip(sheet);

        /*
         * Now the sheet has physically moved to the
         * opposite side.
         *
         * Only NOW do we update the spread index and
         * move the sheet underneath the newer sheets.
         */

        currentSpread++;

        sheet.classList.remove(
            "is-turning"
        );

        updateSheetStacking();

        updateCounter();

        updateNavigationButtons();

        updateHash();

        isAnimating = false;

        updateNavigationButtons();

        return true;
    }

    /* =====================================================
       BACKWARD FLIP
       ===================================================== */

    async function turnBackward() {
        if (isAnimating) {
            return false;
        }

        if (currentSpread <= 0) {
            return false;
        }

        const sheet =
            sheets[currentSpread - 1];

        if (!sheet) {
            return false;
        }

        isAnimating = true;

        updateNavigationButtons();

        /*
         * Bring the sheet being pulled back ABOVE the
         * newer pages.
         */

        sheet.classList.add(
            "is-turning"
        );

        sheet.style.zIndex = "5000";

        /*
         * Force layout before removing the turned state.
         */

        void sheet.offsetWidth;

        sheet.classList.remove(
            "is-turned"
        );

        await waitForFlip(sheet);

        /*
         * The physical sheet is now back on the right.
         */

        currentSpread--;

        sheet.classList.remove(
            "is-turning"
        );

        updateSheetStacking();

        updateCounter();

        updateNavigationButtons();

        updateHash();

        isAnimating = false;

        updateNavigationButtons();

        return true;
    }

    /* =====================================================
       NEXT
       ===================================================== */

    async function nextSpread() {
        return turnForward();
    }

    /* =====================================================
       PREVIOUS
       ===================================================== */

    async function previousSpread() {
        return turnBackward();
    }

    /* =====================================================
       HOME
       ===================================================== */

    async function goHome() {
        if (isAnimating) {
            return;
        }

        while (currentSpread > 0) {
            await turnBackward();
        }
    }

    /* =====================================================
       GO TO SPREAD
       ===================================================== */

    async function goToSpread(target) {
        target =
            Number(target);

        if (
            !Number.isInteger(target)
        ) {
            return;
        }

        target =
            Math.max(
                0,
                Math.min(
                    target,
                    totalSpreads - 1
                )
            );

        if (
            target === currentSpread
        ) {
            return;
        }

        if (isAnimating) {
            return;
        }

        /*
         * Forward navigation physically flips every
         * intervening sheet.
         */

        while (
            currentSpread < target
        ) {
            const didFlip =
                await turnForward();

            if (!didFlip) {
                break;
            }
        }

        /*
         * Backward navigation physically flips every
         * intervening sheet backward.
         */

        while (
            currentSpread > target
        ) {
            const didFlip =
                await turnBackward();

            if (!didFlip) {
                break;
            }
        }
    }

    /* =====================================================
       GO TO SECTION
       ===================================================== */

    async function goToSection(section) {
        if (!section) {
            return;
        }

        const cleanSection =
            section.replace(
                /^#/,
                ""
            );

        const target =
            sectionMap[
                cleanSection
            ];

        if (
            typeof target !==
            "number"
        ) {
            return;
        }

        await goToSpread(target);
    }

    /* =====================================================
       BUTTON EVENTS
       ===================================================== */

    document.addEventListener(
        "click",
        event => {
            const actionElement =
                event.target.closest(
                    "[data-action]"
                );

            if (!actionElement) {
                return;
            }

            const action =
                actionElement.dataset.action;

            if (
                action === "next"
            ) {
                event.preventDefault();
                nextSpread();
            }

            else if (
                action === "previous"
            ) {
                event.preventDefault();
                previousSpread();
            }

            else if (
                action === "home"
            ) {
                event.preventDefault();
                goHome();
            }

            else if (
                action === "index"
            ) {
                event.preventDefault();
                goToSection("index");
            }
        }
    );

    /* =====================================================
       DATA-GO-TO LINKS
       ===================================================== */

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

            const target =
                link.dataset.goTo;

            if (!target) {
                return;
            }

            event.preventDefault();

            goToSection(target);
        }
    );

    /* =====================================================
       NORMAL HASH LINKS
       ===================================================== */

    document.addEventListener(
        "click",
        event => {
            const link =
                event.target.closest(
                    'a[href^="#"]'
                );

            if (!link) {
                return;
            }

            /*
             * Do not interfere with character/modal hashes
             * unless they are actual archive sections.
             */

            const hash =
                link.getAttribute(
                    "href"
                );

            if (
                !hash ||
                hash === "#"
            ) {
                return;
            }

            const section =
                hash.replace(
                    /^#/,
                    ""
                );

            if (
                typeof sectionMap[
                    section
                ] !== "number"
            ) {
                return;
            }

            event.preventDefault();

            goToSection(section);
        }
    );

    /* =====================================================
       KEYBOARD
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {
            const tag =
                event.target.tagName;

            if (
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT" ||
                event.target.isContentEditable
            ) {
                return;
            }

            if (
                event.key ===
                "ArrowRight"
            ) {
                event.preventDefault();

                nextSpread();
            }

            else if (
                event.key ===
                "ArrowLeft"
            ) {
                event.preventDefault();

                previousSpread();
            }

            else if (
                event.key ===
                "Home"
            ) {
                event.preventDefault();

                goHome();
            }

            else if (
                event.key ===
                "PageDown"
            ) {
                event.preventDefault();

                nextSpread();
            }

            else if (
                event.key ===
                "PageUp"
            ) {
                event.preventDefault();

                previousSpread();
            }
        }
    );

    /* =====================================================
       INITIAL HASH
       ===================================================== */

    function handleHash() {
        const hash =
            window.location.hash.replace(
                /^#/,
                ""
            );

        if (!hash) {
            return;
        }

        const target =
            sectionMap[hash];

        if (
            typeof target !==
            "number"
        ) {
            return;
        }

        /*
         * If the hash exists on initial load, establish the
         * correct physical state immediately.
         *
         * We do NOT animate through every page on refresh.
         */

        if (
            !book.dataset.initialized
        ) {
            setSheetState(target);

            updateCounter();

            updateNavigationButtons();

            book.dataset.initialized =
                "true";

            return;
        }

        goToSpread(target);
    }

    window.addEventListener(
        "hashchange",
        () => {
            if (
                !isAnimating
            ) {
                handleHash();
            }
        }
    );

    window.addEventListener(
        "popstate",
        () => {
            if (
                !isAnimating
            ) {
                handleHash();
            }
        }
    );

    /* =====================================================
       BUILD EVERYTHING
       ===================================================== */

    buildPhysicalBook();

    /*
     * Establish initial state.
     */

    let initialSpread = 0;

    const initialHash =
        window.location.hash.replace(
            /^#/,
            ""
        );

    if (
        initialHash &&
        typeof sectionMap[
            initialHash
        ] === "number"
    ) {
        initialSpread =
            sectionMap[
                initialHash
            ];
    }

    setSheetState(
        initialSpread
    );

    updateCounter();

    updateNavigationButtons();

    book.dataset.initialized =
        "true";

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.Scrapbook = {
        next: nextSpread,

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
