
/*
 GamingHub v2
 rp.js

Renders RP information.
Expected fields:
RPRules
RPHooks
RPPreferences
RPStatus
RPTimezone
RPAvailability
*/

class RPRenderer {

    constructor(){
        this.fields = {
            "#rp-rules":"RPRules",
            "#rp-hooks":"RPHooks",
            "#rp-preferences":"RPPreferences",
            "#rp-status":"RPStatus",
            "#rp-timezone":"RPTimezone",
            "#rp-availability":"RPAvailability",
            "#rp-writing-style":"RPWritingStyle",
            "#rp-genres":"RPGenres",
            "#rp-limits":"RPLimits",
            "#rp-notes":"RPNotes"
        };
    }

    render(character={}){

        Object.entries(this.fields).forEach(([selector,key])=>{
            const el=document.querySelector(selector);
            if(!el) return;

            const value=character[key];

            if(value===undefined || value===null || value===""){
                el.textContent="";
                el.closest("[data-hide-empty]")?.classList.add("hidden");
            }else{
                el.textContent=value;
                el.closest("[data-hide-empty]")?.classList.remove("hidden");
            }
        });

        this.renderHooks(character.RPHookList || []);
    }

    renderHooks(hooks){

        const list=document.querySelector("#rp-hook-list");
        if(!list) return;

        list.innerHTML="";

        if(!hooks.length){
            list.closest("[data-hide-empty]")?.classList.add("hidden");
            return;
        }

        hooks.forEach(hook=>{
            const item=document.createElement("article");
            item.className="card rp-hook fade-in";

            item.innerHTML=`
                <h3>${hook.Title || ""}</h3>
                <p>${hook.Description || ""}</p>
            `;

            list.appendChild(item);
        });

        list.closest("[data-hide-empty]")?.classList.remove("hidden");
    }
}

window.GamingHub = window.GamingHub || {};
window.GamingHub.rp = new RPRenderer();
