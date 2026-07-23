
/*
 GamingHub v2
 profile.js

Responsible for:
- Rendering hero information
- Rendering profile fields
- Hiding empty sections
*/

class ProfileRenderer {

    constructor(character={}) {
        this.character = character;
    }

    setData(character){
        this.character = character || {};
        this.render();
    }

    render(){
        this.renderHero();
        this.renderFields();
        this.renderImages();
        this.hideEmpty();
    }

    renderHero(){

        this.setText("#character-name", this.character.Name);
        this.setText("#character-quote", this.character.Quote);
        this.setText("#character-race", this.character.Race);

        this.setImage("#banner-image", this.character.BannerImage);
        this.setImage("#portrait-image", this.character.PortraitImage);

    }

    renderImages(){

        this.setImage("#profile-image", this.character.ProfileImage);
        this.setImage("#couple-image", this.character.CoupleImage);

    }

    renderFields(){

        const map = {
            "#age":"Age",
            "#pronouns":"Pronouns",
            "#height":"Height",
            "#weight":"Weight",
            "#alignment":"Alignment",
            "#occupation":"Occupation",
            "#residence":"Residence",
            "#deity":"Deity",
            "#birthday":"Birthday",
            "#voice":"Voice",
            "#scent":"Scent",
            "#hair":"Hair",
            "#eyes":"Eyes",
            "#build":"Build",
            "#biography":"Biography",
            "#appearance":"Appearance",
            "#personality":"Personality",
            "#likes":"Likes",
            "#dislikes":"Dislikes",
            "#hobbies":"Hobbies",
            "#strengths":"Strengths",
            "#weaknesses":"Weaknesses",
            "#flaws":"Flaws",
            "#notes":"ExtraNotes"
        };

        Object.entries(map).forEach(([selector,key])=>{
            this.setText(selector,this.character[key]);
        });

    }

    setText(selector,value){

        const el=document.querySelector(selector);
        if(!el) return;

        if(value===undefined || value===null || value===""){
            el.textContent="";
            el.closest("[data-hide-empty]")?.classList.add("hidden");
            return;
        }

        el.textContent=value;
    }

    setImage(selector,url){

        const img=document.querySelector(selector);

        if(!img) return;

        if(!url){
            img.closest("[data-hide-empty]")?.classList.add("hidden");
            return;
        }

        img.src=url;
    }

    hideEmpty(){

        document.querySelectorAll("[data-hide-empty]").forEach(section=>{

            const text=section.textContent.trim();

            const images=[...section.querySelectorAll("img")];

            const hasImage=images.some(i=>i.src && !i.src.endsWith("/"));

            if(text==="" && !hasImage){
                section.classList.add("hidden");
            }

        });

    }

}

window.GamingHub = window.GamingHub || {};
window.GamingHub.profile = new ProfileRenderer();
