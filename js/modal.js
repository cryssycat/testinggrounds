
/*
 GamingHub v2
 modal.js
 Image lightbox
*/

class Lightbox {

    constructor() {
        this.images = [];
        this.index = 0;

        this.modal = document.querySelector(".lightbox");
        this.viewer = this.modal?.querySelector("img");
        this.caption = this.modal?.querySelector(".lightbox-caption");

        this.collectImages();
        this.bindEvents();
    }

    collectImages() {
        this.images = [...document.querySelectorAll(".gallery-image img")];

        this.images.forEach((img, i) => {
            img.dataset.index = i;
            img.addEventListener("click", () => this.open(i));
        });
    }

    bindEvents() {
        if (!this.modal) return;

        this.modal.addEventListener("click", (e) => {
            if (e.target === this.modal) this.close();
        });

        document.addEventListener("keydown", (e) => {
            if (!this.modal.classList.contains("open")) return;

            switch (e.key) {
                case "Escape":
                    this.close();
                    break;
                case "ArrowRight":
                    this.next();
                    break;
                case "ArrowLeft":
                    this.previous();
                    break;
            }
        });

        document.querySelector(".lightbox-next")?.addEventListener("click", () => this.next());
        document.querySelector(".lightbox-prev")?.addEventListener("click", () => this.previous());
        document.querySelector(".lightbox-close")?.addEventListener("click", () => this.close());
    }

    open(index) {
        this.index = index;
        this.render();
        this.modal.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    close() {
        this.modal.classList.remove("open");
        document.body.style.overflow = "";
    }

    next() {
        this.index = (this.index + 1) % this.images.length;
        this.render();
    }

    previous() {
        this.index--;
        if (this.index < 0) this.index = this.images.length - 1;
        this.render();
    }

    render() {
        const img = this.images[this.index];
        if (!img) return;

        this.viewer.src = img.src;
        this.viewer.alt = img.alt || "";

        if (this.caption) {
            this.caption.textContent =
                img.dataset.caption || img.alt || "";
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".lightbox")) {
        window.GamingHub = window.GamingHub || {};
        GamingHub.lightbox = new Lightbox();
    }
});
