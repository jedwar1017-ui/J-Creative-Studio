import {CONCEPTS,makeBrief,normalizeSelected} from "./catalog.mjs";
const $=id=>document.getElementById(id),KEY="jcreative-v1";
let saved=[],selected=CONCEPTS[0],notes={};
try{const raw=JSON.parse(localStorage.getItem(KEY)??"{}");saved=normalizeSelected(raw.saved??[]);if(raw.notes&&typeof raw.notes==="object")for(const c of CONCEPTS)if(typeof raw.notes[c.id]==="string")notes[c.id]=raw.notes[c.id].slice(0,3000);}catch{}
const el=(tag,text,cl)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cl)n.className=cl;return n;};
const status=text=>{$("status").textContent=text;};
function persist(){localStorage.setItem(KEY,JSON.stringify({saved,notes}));$("saved").textContent=saved.length+" saved concepts";}
function select(concept){notes[selected.id]=$("notes").value.slice(0,3000);selected=concept;$("selected").textContent=concept.name;$("notes").value=notes[concept.id]??"";persist();}
function render(){
 const host=$("gallery");host.replaceChildren();
 for(const c of CONCEPTS.filter(c=>$("family").value==="all"||$("family").value===c.family)){
   const card=el("article",undefined,"card");const art=el("div",undefined,"art "+c.theme);
   art.setAttribute("aria-label","Abstract CSS concept illustration for "+c.name);
   art.append(el("span","CONCEPT VISUAL · NOT PRODUCT","art-label"));
   const content=el("div",undefined,"content");
   content.append(el("span",c.family,"badge"),el("h3",c.name),el("p",c.short),el("p","Palette: "+c.palette,"hint"));
   const pick=el("button","Edit brief");pick.addEventListener("click",()=>{select(c);status("Editing "+c.name);$("notes").focus();});
   const save=el("button",saved.includes(c.id)?"Remove from shortlist":"Save to shortlist","primary");
   save.setAttribute("aria-pressed",String(saved.includes(c.id)));
   save.addEventListener("click",()=>{saved=saved.includes(c.id)?saved.filter(id=>id!==c.id):[...saved,c.id];persist();render();});
   const row=el("div",undefined,"controls");row.append(pick,save);content.append(row);card.append(art,content);host.append(card);
 }
}
$("family").addEventListener("change",render);
$("notes").addEventListener("input",()=>{notes[selected.id]=$("notes").value.slice(0,3000);persist();});
$("download").addEventListener("click",()=>{const markdown=makeBrief(selected,$("notes").value);const b=new Blob([markdown],{type:"text/markdown;charset=utf-8"});
 const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=selected.id+"-creative-brief.md";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);status("Creative brief exported. Review all claims before production.");
});
$("notes").value=notes[selected.id]??"";$("selected").textContent=selected.name;persist();render();
