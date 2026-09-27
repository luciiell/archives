document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /*
     * DREAMLAND ARCHIVES
     * Physical scrapbook/book page-turn system.
     *
     * The important part of this implementation is that every
     * middle page is a REAL SHEET:
     *
     *   sheet 0 front = spread 0 right
     *   sheet 0 back  = spread 1 left
     *
     *   sheet 1 front = spread 1 right
     *   sheet 1 back  = spread 2 left
     *
     * and so on.
     *
     * A sheet is only the RIGHT HALF of the book and rotates
     * around its LEFT EDGE (the spine), matching the mechanics
     * of the original Janitor AI book CSS the site is based on.
     */

    const book = document.getElementById("scrapbook");

    if (!book) {
        console.error("Dreamland Archives: #scrapbook was not found.");
        return;
    }

    const originalSpreads = Array.from(
        book.querySelectorAll(":scope > .spread")
    );

    if (originalSpreads.length < 2) {
        console.error(
            "Dreamland Archives: at least two .spread elements are required."
        );
        return;
    }

    const currentPageElement =
        document.getElementById("current-page");

    const totalPageElement =
        document.getElementById("total-pages");

    const FLIP_TIME = 900;
    const FLIP_BUFFER = 80;

    const totalSpreads = originalSpreads.length;

    let currentSpread = 0;
    let isAnimating = false;

    let flipbookLayer = null;
    let sheets = [];

    /*
     * Keep a small copy of spread metadata because the original
     * spread wrappers are removed after the physical book is built.
     */
    const spreadData = originalSpreads.map((spread, index) => ({
        index,
        id: spread.id || "",
        section: spread.dataset.section || ""
    }));


    /* =========================================================
       SECTION / HASH MAP
    ========================================================= */

    const sectionMap = new Map();

    spreadData.forEach(data => {
        if (data.section) {
            sectionMap.set(data.section, data.index);
        }

        if (data.id) {
            sectionMap.set(data.id, data.index);
        }
    });


    function normalizeHash(value) {
        return String(value || "")
            .replace(/^#/, "")
            .trim();
    }


    function getSpreadFromHash() {
        const hash = normalizeHash(window.location.hash);

        if (!hash) {
            return null;
        }

        return sectionMap.has(hash)
            ? sectionMap.get(hash)
            : null;
    }


    function getHashForSpread(index) {
        const data = spreadData[index];

        if (!data) {
            return "";
        }

        return data.section || data.id || "";
    }


    function setUrlForSpread(index, mode = "replace") {
        const section = getHashForSpread(index);

        if (!section) {
            return;
        }

        const nextHash = `#${section}`;

        if (window.location.hash === nextHash) {
            return;
        }

        if (mode === "push") {
            history.pushState(
                { scrapbookSpread: index },
                "",
                nextHash
            );
        } else {
            history.replaceState(
                { scrapbookSpread: index },
                "",
                nextHash
            );
        }
    }


    /* =========================================================
       BUILD THE PHYSICAL BOOK
    ========================================================= */

    function buildPhysicalBook() {
        flipbookLayer = document.createElement("div");
        flipbookLayer.className = "flipbook-layer";
        flipbookLayer.setAttribute(
            "aria-label",
            "Physical scrapbook pages"
        );

        const firstSpread = originalSpreads[0];

        const firstLeft =
            firstSpread.querySelector(":scope > .page-left");

        if (!firstLeft) {
            throw new Error(
                "Dreamland Archives: spread 0 is missing its .page-left page."
            );
        }

        firstLeft.classList.add(
            "static-page",
            "static-left"
        );

        flipbookLayer.appendChild(firstLeft);


        /*
         * Every sheet is one right-hand page that physically
         * rotates around its left edge.
         */
        for (let i = 0; i < totalSpreads - 1; i++) {
            const current = originalSpreads[i];
            const next = originalSpreads[i + 1];

            const front =
                current.querySelector(":scope > .page-right");

            const back =
                next.querySelector(":scope > .page-left");

            if (!front || !back) {
                throw new Error(
                    `Dreamland Archives: spread ${i} or ${i + 1} is missing a page-right/page-left pair.`
                );
            }

            const sheet = document.createElement("div");

            sheet.className = "flip-sheet";
            sheet.dataset.sheetIndex = String(i);

            front.classList.add(
                "flip-sheet-face",
                "flip-sheet-front"
            );

            back.classList.add(
                "flip-sheet-face",
                "flip-sheet-back"
            );

            /*
             * Front and back are full-size faces inside a HALF-WIDTH
             * sheet. The sheet itself is what rotates.
             */
            sheet.appendChild(front);
            sheet.appendChild(back);

            flipbookLayer.appendChild(sheet);
            sheets.push(sheet);
        }


        /*
         * The final right page has no backside to reveal, so it
         * remains permanently on the right.
         */
        const lastSpread =
            originalSpreads[totalSpreads - 1];

        const finalRight =
            lastSpread.querySelector(":scope > .page-right");

        if (!finalRight) {
            throw new Error(
                "Dreamland Archives: final spread is missing its .page-right page."
            );
        }

        finalRight.classList.add(
            "static-page",
            "static-right"
        );

        flipbookLayer.appendChild(finalRight);


        const bookBack =
            book.querySelector(":scope > .book-back");

        if (bookBack) {
            bookBack.insertAdjacentElement(
                "afterend",
                flipbookLayer
            );
        } else {
            book.insertBefore(
                flipbookLayer,
                book.firstChild
            );
        }


        /*
         * The page elements now belong to the physical book.
         * Remove only the empty .spread wrappers.
         */
        originalSpreads.forEach(spread => {
            spread.remove();
        });
    }


    /* =========================================================
       SHEET STACKING
    ========================================================= */

    function updateSheetStacking() {
        sheets.forEach((sheet, index) => {
            if (sheet.classList.contains("is-turning")) {
                sheet.style.zIndex = "5000";
                return;
            }

            if (index < currentSpread) {
                /*
                 * Already turned sheets are on the LEFT.
                 * The newest turned sheet must sit above older
                 * turned sheets.
                 */
                sheet.style.zIndex = String(100 + index);
            } else {
                /*
                 * Unturned sheets are on the RIGHT.
                 * The next sheet to turn must be the top sheet.
                 */
                sheet.style.zIndex =
                    String(2000 - index);
            }
        });
    }


    function setSheetState(targetSpread) {
        const safeTarget = Math.max(
            0,
            Math.min(
                Number(targetSpread) || 0,
                totalSpreads - 1
            )
        );

        sheets.forEach((sheet, index) => {
            sheet.classList.toggle(
                "is-turned",
                index < safeTarget
            );

            sheet.classList.remove("is-turning");
        });

        currentSpread = safeTarget;

        updateSheetStacking();
    }


    /* =========================================================
       COUNTER / BUTTON STATE
    ========================================================= */

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


    function updateNavigationButtons() {
        document
            .querySelectorAll('[data-action="previous"]')
            .forEach(button => {
                button.disabled =
                    isAnimating ||
                    currentSpread <= 0;
            });

        document
            .querySelectorAll('[data-action="next"]')
            .forEach(button => {
                button.disabled =
                    isAnimating ||
                    currentSpread >= totalSpreads - 1;
            });
    }


    function finishNavigation() {
        updateCounter();
        updateNavigationButtons();
    }


    /* =========================================================
       TRANSITION WAIT
    ========================================================= */

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

                clearTimeout(fallbackTimer);

                resolve();
            };

            const onTransitionEnd = event => {
                if (
                    event.target === sheet &&
                    event.propertyName === "transform"
                ) {
                    finish();
                }
            };

            sheet.addEventListener(
                "transitionend",
                onTransitionEnd
            );

            const fallbackTimer = setTimeout(
                finish,
                FLIP_TIME + FLIP_BUFFER
            );
        });
    }


    /* =========================================================
       FORWARD PAGE TURN
    ========================================================= */

    async function turnForward(options = {}) {
        if (isAnimating) {
            return false;
        }

        if (currentSpread >= totalSpreads - 1) {
            return false;
        }

        const sheet = sheets[currentSpread];

        if (!sheet) {
            return false;
        }

        isAnimating = true;
        updateNavigationButtons();

        /*
         * Put the sheet above every other sheet before it moves.
         */
        sheet.classList.add("is-turning");
        sheet.style.zIndex = "5000";

        /*
         * Force the starting transform to be painted before
         * adding .is-turned. Without this, some browsers can
         * collapse the transition into an instant jump.
         */
        void sheet.offsetWidth;

        sheet.classList.add("is-turned");

        await waitForFlip(sheet);

        /*
         * The physical turn is complete. Only now does the
         * navigation state advance.
         */
        currentSpread++;

        sheet.classList.remove("is-turning");

        updateSheetStacking();
        finishNavigation();

        setUrlForSpread(
            currentSpread,
            options.history === false ? "replace" : "push"
        );

        isAnimating = false;
        updateNavigationButtons();

        return true;
    }


    /* =========================================================
       BACKWARD PAGE TURN
    ========================================================= */

    async function turnBackward(options = {}) {
        if (isAnimating) {
            return false;
        }

        if (currentSpread <= 0) {
            return false;
        }

        const sheet = sheets[currentSpread - 1];

        if (!sheet) {
            return false;
        }

        isAnimating = true;
        updateNavigationButtons();

        /*
         * Pull the physical sheet above everything and rotate
         * it back from the LEFT to the RIGHT.
         */
        sheet.classList.add("is-turning");
        sheet.style.zIndex = "5000";

        void sheet.offsetWidth;

        sheet.classList.remove("is-turned");

        await waitForFlip(sheet);

        currentSpread--;

        sheet.classList.remove("is-turning");

        updateSheetStacking();
        finishNavigation();

        setUrlForSpread(
            currentSpread,
            options.history === false ? "replace" : "push"
        );

        isAnimating = false;
        updateNavigationButtons();

        return true;
    }


    /* =========================================================
       PUBLIC NAVIGATION
    ========================================================= */

    async function nextSpread() {
        return turnForward();
    }


    async function previousSpread() {
        return turnBackward();
    }


    async function goHome() {
        if (isAnimating) {
            return;
        }

        while (currentSpread > 0) {
            const success = await turnBackward({
                history: false
            });

            if (!success) {
                break;
            }
        }

        setUrlForSpread(currentSpread, "push");
    }


    async function goToSpread(target, options = {}) {
        target = Number(target);

        if (!Number.isInteger(target)) {
            return;
        }

        target = Math.max(
            0,
            Math.min(
                target,
                totalSpreads - 1
            )
        );

        if (
            target === currentSpread ||
            isAnimating
        ) {
            return;
        }

        /*
         * Physical navigation only. There is deliberately NO
         * display:none swap, opacity fade, page replacement,
         * or teleporting between spreads.
         */
        while (currentSpread < target) {
            const success = await turnForward({
                history: false
            });

            if (!success) {
                return;
            }
        }

        while (currentSpread > target) {
            const success = await turnBackward({
                history: false
            });

            if (!success) {
                return;
            }
        }

        if (options.history !== false) {
            setUrlForSpread(currentSpread, "push");
        }
    }


    async function goToSection(section) {
        const clean = normalizeHash(section);

        if (!clean || !sectionMap.has(clean)) {
            return;
        }

        await goToSpread(sectionMap.get(clean));
    }


    /* =========================================================
       CLICK HANDLING
    ========================================================= */

    document.addEventListener("click", event => {
        const actionElement =
            event.target.closest("[data-action]");

        if (!actionElement) {
            return;
        }

        const action = actionElement.dataset.action;

        if (action === "next") {
            event.preventDefault();
            nextSpread();
            return;
        }

        if (action === "previous") {
            event.preventDefault();
            previousSpread();
            return;
        }

        if (action === "home") {
            event.preventDefault();
            goHome();
            return;
        }

        if (action === "index") {
            event.preventDefault();
            goToSection("index");
        }
    });


    /*
     * Explicit data-go-to links.
     */
    document.addEventListener("click", event => {
        const link =
            event.target.closest("[data-go-to]");

        if (!link) {
            return;
        }

        const target =
            normalizeHash(link.dataset.goTo);

        if (!target || !sectionMap.has(target)) {
            return;
        }

        event.preventDefault();
        goToSection(target);
    });


    /*
     * Normal section hash links.
     *
     * Character links such as #axel are NOT intercepted because
     * "axel" is not a spread in this archive.
     */
    document.addEventListener("click", event => {
        const link =
            event.target.closest('a[href^="#"]');

        if (!link) {
            return;
        }

        const hash =
            normalizeHash(link.getAttribute("href"));

        if (!hash || !sectionMap.has(hash)) {
            return;
        }

        event.preventDefault();
        goToSection(hash);
    });


    /* =========================================================
       KEYBOARD
    ========================================================= */

    document.addEventListener("keydown", event => {
        const tag =
            event.target?.tagName;

        if (
            tag === "INPUT" ||
            tag === "TEXTAREA" ||
            tag === "SELECT" ||
            event.target?.isContentEditable
        ) {
            return;
        }

        if (event.key === "ArrowRight" || event.key === "PageDown") {
            event.preventDefault();
            nextSpread();
            return;
        }

        if (event.key === "ArrowLeft" || event.key === "PageUp") {
            event.preventDefault();
            previousSpread();
            return;
        }

        if (event.key === "Home") {
            event.preventDefault();
            goHome();
        }
    });


    /* =========================================================
       BROWSER HASH / HISTORY NAVIGATION
    ========================================================= */

    async function handleHashChange() {
        const target = getSpreadFromHash();

        if (target === null) {
            return;
        }

        if (isAnimating) {
            return;
        }

        if (target === currentSpread) {
            finishNavigation();
            return;
        }

        await goToSpread(target, { history: false });
    }


    window.addEventListener(
        "hashchange",
        handleHashChange
    );

    window.addEventListener(
        "popstate",
        async () => {
            const target = getSpreadFromHash();

            if (target === null || isAnimating) {
                return;
            }

            if (target === currentSpread) {
                finishNavigation();
                return;
            }

            /*
             * History navigation should still use the physical
             * page-turn animation.
             */
            await goToSpread(target, { history: false });
        }
    );


    /* =========================================================
       INITIALIZE
    ========================================================= */

    try {
        buildPhysicalBook();
    } catch (error) {
        console.error(error);
        return;
    }

    const initialTarget =
        getSpreadFromHash();

    /*
     * Direct links such as #characters should load at the
     * requested spread without making the user watch every
     * intermediate page turn during initial page load.
     */
    setSheetState(
        initialTarget === null
            ? 0
            : initialTarget
    );

    finishNavigation();

    /*
     * Establish a clean archive hash on the first load if the
     * URL did not already contain one.
     */
    if (!window.location.hash) {
        setUrlForSpread(currentSpread, "replace");
    }

    book.dataset.initialized = "true";


    /* =========================================================
       PUBLIC API
    ========================================================= */

    window.Scrapbook = {
        next: nextSpread,
        previous: previousSpread,
        home: goHome,
        index: () => goToSection("index"),
        goTo: goToSection,
        goToSpread,
        getCurrentSpread: () => currentSpread,
        getTotalSpreads: () => totalSpreads
    };
});
