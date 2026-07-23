/*
 GamingHub v2
 utilities.js

Shared helper functions used throughout the application.
*/

window.GamingHub = window.GamingHub || {};

GamingHub.utils = {

    qs(selector, parent=document){
        return parent.querySelector(selector);
    },

    qsa(selector, parent=document){
        return [...parent.querySelectorAll(selector)];
    },

    create(tag, className=""){
        const el = document.createElement(tag);
        if(className) el.className = className;
        return el;
    },

    show(element){
        if(element) element.classList.remove("hidden");
    },

    hide(element){
        if(element) element.classList.add("hidden");
    },

    isEmpty(value){
        return value === undefined ||
               value === null ||
               String(value).trim() === "";
    },

    safe(value, fallback=""){
        return this.isEmpty(value) ? fallback : value;
    },

    escapeHTML(text){
        const div = document.createElement("div");
        div.textContent = text ?? "";
        return div.innerHTML;
    },

    setImage(img, src, fallback=""){
        if(!img) return;
        img.src = src || fallback;
        img.onerror = () => {
            if(fallback) img.src = fallback;
        };
    },

    formatList(value){
        if(Array.isArray(value)){
            return value.join(", ");
        }
        return value || "";
    },

    scrollTop(smooth=true){
        window.scrollTo({
            top:0,
            behavior:smooth ? "smooth":"auto"
        });
    }
};
