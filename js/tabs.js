
/*
 GamingHub v2
 tabs.js
 Handles:
 - Tab switching
 - Deep linking
 - Browser history
 - AU accordions
*/

class TabManager {
    constructor() {
        this.buttons = [...document.querySelectorAll(".tab-button")];
        this.panels = [...document.querySelectorAll(".tab-panel")];
        this.defaultTab = "profile";

        this.init();
    }

    init() {
        this.buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                this.open(btn.dataset.tab, true);
            });
        });

        window.addEventListener("popstate", () => {
            const hash = window.location.hash.replace("#", "");
            this.open(hash || this.defaultTab, false);
        });

        const start = window.location.hash.replace("#", "") || this.defaultTab;
        this.open(start, false);
    }

    open(name, pushHistory = true) {

        const panel = document.getElementById(name);

        if (!panel) {
            this.open(this.defaultTab, false);
            return;
        }

        this.buttons.forEach(b =>
            b.classList.toggle("active", b.dataset.tab === name)
        );

        this.panels.forEach(p =>
            p.classList.toggle("active", p.id === name)
        );

        if (pushHistory) {
            history.pushState({}, "", "#" + name);
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
}

class AccordionManager {

    constructor(selector=".au-card") {
        this.cards = [...document.querySelectorAll(selector)];
        this.init();
    }

    init() {
        this.cards.forEach(card => {

            const header = card.querySelector(".au-header");

            if (!header) return;

            header.addEventListener("click", () => {

                card.classList.toggle("open");

            });

        });
    }

}

class VisibilityManager {

    static hideIfEmpty(selector) {

        document.querySelectorAll(selector).forEach(el => {

            const hasImages =
                el.querySelector("img");

            const hasText =
                el.textContent.trim().length > 0;

            if (!hasImages && !hasText) {
                el.classList.add("hidden");
            }

        });

    }

    static hideEmptyGallery(sectionSelector) {

        document.querySelectorAll(sectionSelector).forEach(section => {

            const imgs = section.querySelectorAll("img");

            let visible = false;

            imgs.forEach(img => {
                if (img.src && img.src.trim() !== "") {
                    visible = true;
                }
            });

            if (!visible) {
                section.classList.add("hidden");
            }

        });

    }

}

class ImageLoader {

    static applyFallback(selector, fallback="assets/placeholder.png") {

        document.querySelectorAll(selector).forEach(img=>{

            img.onerror = () => {
                img.src = fallback;
            };

        });

    }

}

document.addEventListener("DOMContentLoaded", ()=>{

    window.GamingHub = {};

    GamingHub.tabs = new TabManager();

    GamingHub.au = new AccordionManager();

    VisibilityManager.hideEmptyGallery(".gallery-section");

    ImageLoader.applyFallback("img");

});
