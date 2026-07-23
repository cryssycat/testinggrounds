
/*
 GamingHub v2
 relationships.js

Renders relationship cards from Notion data.
Expected:
character.Relationships = [
 {
   Name,
   Type,
   Description,
   Image,
   Link
 }
]
*/

class RelationshipRenderer {

    constructor(container="#relationship-grid"){
        this.containerSelector = container;
    }

    render(character){

        const container=document.querySelector(this.containerSelector);
        if(!container) return;

        container.innerHTML="";

        const list=character?.Relationships || [];

        if(list.length===0){
            container.closest("[data-hide-empty]")?.classList.add("hidden");
            return;
        }

        list.forEach(rel=>{

            const card=document.createElement("article");
            card.className="relationship-card card fade-in";

            card.innerHTML=`
                <div class="relationship-avatar">
                    <img src="${rel.Image || ""}" alt="${rel.Name || ""}">
                </div>

                <div class="relationship-info">
                    <h3>${rel.Name || ""}</h3>
                    <small>${rel.Type || ""}</small>

                    <p>${rel.Description || ""}</p>

                    ${rel.Link ?
                        `<button class="button secondary relationship-open"
                            data-link="${rel.Link}">
                            View Profile
                        </button>`
                        : ""
                    }
                </div>
            `;

            container.appendChild(card);

        });

        this.bindLinks(container);

    }

    bindLinks(container){

        container.querySelectorAll(".relationship-open")
        .forEach(button=>{

            button.addEventListener("click",()=>{

                const link=button.dataset.link;

                if(link){
                    window.location.href=link;
                }

            });

        });

    }

}

window.GamingHub = window.GamingHub || {};
window.GamingHub.relationships = new RelationshipRenderer();
