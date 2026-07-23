
/*
 GamingHub v2
 app.js

Application entry point.
Responsible for:
- Fetching character data
- Holding global state
- Initializing renderers
*/

class GamingHubApp {
    constructor() {
        this.state = {
            character: null,
            loading: false,
            error: null
        };
    }

    async load(url) {
        try {
            this.setLoading(true);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            this.state.character = data;

            this.render();

        } catch (err) {
            console.error(err);
            this.state.error = err;
            this.showError(err.message);
        } finally {
            this.setLoading(false);
        }
    }

    render() {
        const c = this.state.character;
        if (!c) return;

        GamingHub.profile?.setData(c);
        GamingHub.relationships?.render(c);
        GamingHub.gallery?.render(c);
        GamingHub.rp?.render?.(c);
    }

    setLoading(isLoading) {
        this.state.loading = isLoading;
        document.body.classList.toggle("loading", isLoading);

        const spinner = document.querySelector("#loading-spinner");
        if (spinner) {
            spinner.hidden = !isLoading;
        }
    }

    showError(message) {
        const el = document.querySelector("#error-message");
        if (!el) return;

        el.hidden = false;
        el.textContent = `Failed to load character: ${message}`;
    }
}

window.GamingHub = window.GamingHub || {};
window.GamingHub.app = new GamingHubApp();

document.addEventListener("DOMContentLoaded", () => {
    const root = document.body.dataset.characterApi;
    if (root) {
        GamingHub.app.load(root);
    }
});
