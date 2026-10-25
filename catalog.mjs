export const CONCEPTS=Object.freeze([
  {id:"horizon",name:"Shattered Horizon",family:"Apparel",short:"Fragments of the skyline split by electric light.",palette:"Charcoal / Cobalt / Silver",motif:"Geometric fractured horizon",suggestedMedium:"T-shirt graphic",theme:"horizon"},
  {id:"cosmos",name:"Cosmos Forge",family:"3D Object",short:"Industrial metal forms meet deep-space star fields.",palette:"Midnight / Copper / Nebula",motif:"Forged ring and star field",suggestedMedium:"3D collectible",theme:"cosmos"},
  {id:"bloom",name:"Solar / Lunar Bloom",family:"Art Print",short:"Twin celestial forms balanced around a blossom.",palette:"Indigo / Coral / Gold",motif:"Sun, moon and flowing petals",suggestedMedium:"Art print",theme:"bloom"}
]);
export function makeBrief(concept,notes=""){
  if(!concept||!CONCEPTS.some(c=>c.id===concept.id))throw Error("Unknown concept");
  if(typeof notes!=="string"||notes.length>3000)throw Error("Notes too long");
  return [
    "# "+concept.name+" — Creative Brief","",
    "Concept only — not production-approved or available for sale.","",
    "- **Collection:** "+concept.family,
    "- **Proposed product:** "+concept.suggestedMedium,
    "- **Palette:** "+concept.palette,
    "- **Motif:** "+concept.motif,
    "- **Description:** "+concept.short,
    "",
    "## Production notes","",notes.trim()||"(Add dimensions, source-art requirements, material, proof and test results.)","",
    "## Required proof checks",
    "- [ ] Artwork ownership and print rights cleared",
    "- [ ] Production dimensions and color profile checked",
    "- [ ] Physical test sample ordered",
    "- [ ] Print finish/fit/durability inspected",
    "- [ ] Real landed cost and expected margin documented",
    "- [ ] Product photographs and buyer-facing claims verified",
    ""
  ].join("\n");
}
export function normalizeSelected(ids){
  if(!Array.isArray(ids))throw Error("Selected concepts should be an array");
  const valid=new Set(CONCEPTS.map(c=>c.id));
  return [...new Set(ids.filter(x=>typeof x==="string"&&valid.has(x)))];
}
