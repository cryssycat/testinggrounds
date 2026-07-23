
/*
 GamingHub v2
 gallery.js

Builds:
- Main Gallery
- NSFW Gallery
- AU Galleries

Expected IDs:
#main-gallery
#nsfw-gallery
#au-container
*/

class GalleryRenderer{

    constructor(){
        this.MAX_MAIN=24;
        this.MAX_NSFW=24;
        this.MAX_AU=8;
        this.MAX_AU_IMAGES=12;
    }

    render(character){
        this.character=character||{};
        this.buildMain();
        this.buildNSFW();
        this.buildAU();

        if(window.GamingHub?.lightbox){
            window.GamingHub.lightbox.collectImages();
        }
    }

    addImage(container,url,caption=""){
        if(!container || !url) return;

        const div=document.createElement("div");
        div.className="gallery-image fade-in";

        div.innerHTML=`
            <img
                src="${url}"
                alt="${caption}"
                data-caption="${caption}">
        `;

        container.appendChild(div);
    }

    buildMain(){
        const c=document.querySelector("#main-gallery");
        if(!c) return;

        c.innerHTML="";

        let count=0;

        for(let i=1;i<=this.MAX_MAIN;i++){
            const key=`Gallery${String(i).padStart(2,"0")}`;
            const cap=`Gallery${String(i).padStart(2,"0")}Caption`;
            if(this.character[key]){
                this.addImage(c,this.character[key],this.character[cap]||"");
                count++;
            }
        }

        c.closest("[data-hide-empty]")?.classList.toggle("hidden",count===0);
    }

    buildNSFW(){
        const c=document.querySelector("#nsfw-gallery");
        if(!c) return;

        c.innerHTML="";
        let count=0;

        for(let i=1;i<=this.MAX_NSFW;i++){
            const key=`NSFW${String(i).padStart(2,"0")}`;
            const cap=`NSFW${String(i).padStart(2,"0")}Caption`;
            if(this.character[key]){
                this.addImage(c,this.character[key],this.character[cap]||"");
                count++;
            }
        }

        c.closest("[data-hide-empty]")?.classList.toggle("hidden",count===0);
    }

    buildAU(){
        const parent=document.querySelector("#au-container");
        if(!parent) return;

        parent.innerHTML="";
        let auCount=0;

        for(let a=1;a<=this.MAX_AU;a++){

            const name=this.character[`AU${a}Name`];
            if(!name) continue;

            const desc=this.character[`AU${a}Description`]||"";

            const card=document.createElement("section");
            card.className="au-card";

            card.innerHTML=`
                <div class="au-header">
                    <h3>${name}</h3>
                    <span>▼</span>
                </div>
                <div class="au-content">
                    <p>${desc}</p>
                    <div class="gallery-grid" id="au-gallery-${a}"></div>
                </div>
            `;

            parent.appendChild(card);

            const grid=card.querySelector(".gallery-grid");

            for(let g=1;g<=this.MAX_AU_IMAGES;g++){
                const imgKey=`AU${a}Image${String(g).padStart(2,"0")}`;
                const capKey=`AU${a}Image${String(g).padStart(2,"0")}Caption`;

                if(this.character[imgKey]){
                    this.addImage(grid,this.character[imgKey],this.character[capKey]||"");
                }
            }

            auCount++;
        }

        parent.closest("[data-hide-empty]")?.classList.toggle("hidden",auCount===0);

        if(window.GamingHub?.au){
            window.GamingHub.au=new AccordionManager();
        }
    }
}

window.GamingHub=window.GamingHub||{};
window.GamingHub.gallery=new GalleryRenderer();
