// Pure business logic for J Creative Studio. No DOM access here so it can be unit-tested in Node.

export const FAMILIES = Object.freeze(["Apparel", "3D Object", "Art Print", "Tattoo"]);

export const CONCEPTS = Object.freeze([
  {id:"horizon",name:"Shattered Horizon",family:"Apparel",short:"Fragments of the skyline split by electric light.",palette:"Charcoal / Cobalt / Silver",motif:"Geometric fractured horizon",suggestedMedium:"T-shirt graphic",theme:"horizon"},
  {id:"cosmos",name:"Cosmos Forge",family:"3D Object",short:"Industrial metal forms meet deep-space star fields.",palette:"Midnight / Copper / Nebula",motif:"Forged ring and star field",suggestedMedium:"3D collectible",theme:"cosmos"},
  {id:"bloom",name:"Solar / Lunar Bloom",family:"Art Print",short:"Twin celestial forms balanced around a blossom.",palette:"Indigo / Coral / Gold",motif:"Sun, moon and flowing petals",suggestedMedium:"Art print",theme:"bloom"}
]);

export const PROOF_CHECKS = Object.freeze([
  "Artwork ownership and print rights cleared",
  "Production dimensions and color profile checked",
  "Physical test sample ordered",
  "Print finish/fit/durability inspected",
  "Real landed cost and expected margin documented",
  "Product photographs and buyer-facing claims verified"
]);

const LIMITS = {name:60, short:200, palette:80, motif:120, suggestedMedium:60, notes:3000};
const MAX_CUSTOM = 50;

const cleanText = (v, max) => typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

function hueFor(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}

function slug(text) {
  return text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "design";
}

/** Build a validated user-created concept. Throws with a readable message on bad input. */
export function makeConcept(input, existingIds = []) {
  if (!input || typeof input !== "object") throw Error("Design details are missing");
  const name = cleanText(input.name, LIMITS.name);
  if (!name) throw Error("Give the design a name");
  const family = FAMILIES.includes(input.family) ? input.family : null;
  if (!family) throw Error("Pick a collection type");
  const taken = new Set(existingIds);
  const base = "custom-" + slug(name);
  let id = base, n = 2;
  while (taken.has(id)) id = base + "-" + n++;
  return {
    id, name, family,
    short: cleanText(input.short, LIMITS.short) || "Your own design direction.",
    palette: cleanText(input.palette, LIMITS.palette) || "Not chosen yet",
    motif: cleanText(input.motif, LIMITS.motif) || "Not described yet",
    suggestedMedium: cleanText(input.suggestedMedium, LIMITS.suggestedMedium) || family,
    theme: "custom",
    hue: hueFor(name),
    custom: true
  };
}

function isConcept(c) {
  return !!c && typeof c === "object" && typeof c.id === "string" && typeof c.name === "string" &&
    FAMILIES.includes(c.family) && typeof c.short === "string" && typeof c.palette === "string" &&
    typeof c.motif === "string" && typeof c.suggestedMedium === "string";
}

export function allConcepts(custom = []) {
  return [...CONCEPTS, ...custom];
}

/** Landed cost and margin. All money inputs are per unit; feePercent is the marketplace/payment cut of the sale price. */
export function calcMargin({unitCost = 0, shipping = 0, feePercent = 0, price = 0} = {}) {
  const nums = {unitCost, shipping, feePercent, price};
  for (const [k, v] of Object.entries(nums)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) throw Error(k + " must be zero or more");
  }
  if (feePercent > 100) throw Error("feePercent cannot exceed 100");
  const round = x => Math.round(x * 100) / 100;
  const landed = unitCost + shipping;
  const fees = price * feePercent / 100;
  const profit = price - landed - fees;
  const marginPercent = price > 0 ? (profit / price) * 100 : 0;
  const keep = 1 - feePercent / 100;
  const breakEvenPrice = keep > 0 ? landed / keep : null;
  return {landed: round(landed), fees: round(fees), profit: round(profit), marginPercent: round(marginPercent), breakEvenPrice: breakEvenPrice === null ? null : round(breakEvenPrice)};
}

const money = n => "$" + n.toFixed(2);

export function makeBrief(concept, notes = "", {checks = [], costs = null} = {}) {
  if (!isConcept(concept)) throw Error("Unknown concept");
  if (typeof notes !== "string" || notes.length > LIMITS.notes) throw Error("Notes too long");
  const lines = [
    "# " + concept.name + " — Creative Brief", "",
    "Concept only — not production-approved or available for sale.", "",
    "- **Collection:** " + concept.family,
    "- **Proposed product:** " + concept.suggestedMedium,
    "- **Palette:** " + concept.palette,
    "- **Motif:** " + concept.motif,
    "- **Description:** " + concept.short,
    "",
    "## Production notes", "", notes.trim() || "(Add dimensions, source-art requirements, material, proof and test results.)", ""
  ];
  if (costs) {
    const m = calcMargin(costs);
    lines.push("## Cost estimate (per unit, unverified until a real proof is ordered)",
      "- Item cost: " + money(costs.unitCost ?? 0),
      "- Shipping to you: " + money(costs.shipping ?? 0),
      "- Selling fees: " + (costs.feePercent ?? 0) + "% (" + money(m.fees) + ")",
      "- Sale price: " + money(costs.price ?? 0),
      "- Profit: " + money(m.profit) + " (" + m.marginPercent + "% margin)",
      "- Break-even price: " + (m.breakEvenPrice === null ? "n/a" : money(m.breakEvenPrice)), "");
  }
  lines.push("## Required proof checks");
  PROOF_CHECKS.forEach((label, i) => lines.push("- [" + (checks[i] ? "x" : " ") + "] " + label));
  lines.push("");
  return lines.join("\n");
}

export function normalizeSelected(ids, validIds = CONCEPTS.map(c => c.id)) {
  if (!Array.isArray(ids)) throw Error("Selected concepts should be an array");
  const valid = new Set(validIds);
  return [...new Set(ids.filter(x => typeof x === "string" && valid.has(x)))];
}

function cleanCosts(c) {
  if (!c || typeof c !== "object") return null;
  const out = {};
  for (const k of ["unitCost", "shipping", "feePercent", "price"]) {
    const v = Number(c[k]);
    out[k] = Number.isFinite(v) && v >= 0 ? (k === "feePercent" ? Math.min(v, 100) : v) : 0;
  }
  return out;
}

/** Clean any saved or imported state so a bad backup file can never break the page. */
export function normalizeState(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const custom = [];
  const ids = CONCEPTS.map(c => c.id);
  for (const c of Array.isArray(r.custom) ? r.custom.slice(0, MAX_CUSTOM) : []) {
    try {
      const made = makeConcept(c, ids);
      if (typeof c.id === "string" && /^custom-[a-z0-9-]{1,48}$/.test(c.id) && !ids.includes(c.id)) made.id = c.id;
      ids.push(made.id);
      custom.push(made);
    } catch { /* skip invalid entries */ }
  }
  const pick = (obj, fn) => {
    const out = {};
    if (obj && typeof obj === "object") for (const id of ids) if (id in obj) { const v = fn(obj[id]); if (v !== undefined) out[id] = v; }
    return out;
  };
  return {
    version: 2,
    custom,
    saved: Array.isArray(r.saved) ? normalizeSelected(r.saved, ids) : [],
    notes: pick(r.notes, v => typeof v === "string" ? v.slice(0, LIMITS.notes) : undefined),
    checks: pick(r.checks, v => Array.isArray(v) ? PROOF_CHECKS.map((_, i) => v[i] === true) : undefined),
    costs: pick(r.costs, v => cleanCosts(v) ?? undefined)
  };
}
