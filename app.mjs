import {FAMILIES, PROOF_CHECKS, allConcepts, calcMargin, makeBrief, makeConcept, normalizeState} from "./catalog.mjs";

const $ = id => document.getElementById(id);
const KEY = "jcreative-v1";

let state = normalizeState({});
try { state = normalizeState(JSON.parse(localStorage.getItem(KEY) ?? "{}")); } catch { /* storage blocked or corrupt */ }

const concepts = () => allConcepts(state.custom);
let selected = concepts()[0];

const el = (tag, text, cl) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cl) n.className = cl; return n; };
const status = text => { $("status").textContent = text; };
const money = n => "$" + n.toFixed(2);

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { status("This browser blocked saving. Use Backup to keep your work."); }
  $("saved").textContent = state.saved.length + " on shortlist";
}

function download(name, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], {type}));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function select(concept) {
  selected = concept;
  renderWorkbench();
}

function renderGallery() {
  const host = $("gallery"); host.replaceChildren();
  const filter = $("family").value;
  const showSaved = $("only-saved").checked;
  const list = concepts().filter(c => (filter === "all" || filter === c.family) && (!showSaved || state.saved.includes(c.id)));
  if (!list.length) host.append(el("p", "No designs match this filter yet.", "hint"));
  for (const c of list) {
    const card = el("article", undefined, "card" + (c.id === selected.id ? " active" : ""));
    const art = el("div", undefined, "art " + c.theme);
    if (c.custom) { art.style.setProperty("--h", c.hue); art.append(el("span", c.name.slice(0, 1).toUpperCase(), "monogram")); }
    art.setAttribute("role", "img");
    art.setAttribute("aria-label", "Abstract placeholder illustration for " + c.name);
    art.append(el("span", c.custom ? "YOUR DESIGN · NO ART YET" : "CONCEPT VISUAL · NOT PRODUCT", "art-label"));
    const done = (state.checks[c.id] ?? []).filter(Boolean).length;
    const content = el("div", undefined, "content");
    content.append(el("span", c.family + " · " + done + "/" + PROOF_CHECKS.length + " checks", "badge"), el("h3", c.name), el("p", c.short), el("p", "Palette: " + c.palette, "hint"));
    const pick = el("button", "Open in workbench");
    pick.addEventListener("click", () => { select(c); renderGallery(); status("Working on " + c.name); $("workbench").scrollIntoView({behavior: "smooth"}); });
    const isSaved = state.saved.includes(c.id);
    const save = el("button", isSaved ? "★ Shortlisted" : "☆ Shortlist", "primary");
    save.setAttribute("aria-pressed", String(isSaved));
    save.addEventListener("click", () => { state.saved = isSaved ? state.saved.filter(id => id !== c.id) : [...state.saved, c.id]; persist(); renderGallery(); });
    const row = el("div", undefined, "controls"); row.append(pick, save);
    content.append(row); card.append(art, content); host.append(card);
  }
}

function renderChecks() {
  const host = $("checks"); host.replaceChildren();
  const checks = state.checks[selected.id] ?? PROOF_CHECKS.map(() => false);
  PROOF_CHECKS.forEach((label, i) => {
    const row = el("label", undefined, "check");
    const box = document.createElement("input"); box.type = "checkbox"; box.checked = checks[i];
    box.addEventListener("change", () => {
      const next = [...(state.checks[selected.id] ?? PROOF_CHECKS.map(() => false))];
      next[i] = box.checked; state.checks[selected.id] = next; persist(); renderProgress(); renderGallery();
    });
    row.append(box, el("span", label)); host.append(row);
  });
  renderProgress();
}

function renderProgress() {
  const done = (state.checks[selected.id] ?? []).filter(Boolean).length;
  $("progress").value = done; $("progress").max = PROOF_CHECKS.length;
  $("progress-text").textContent = done === PROOF_CHECKS.length ? "All proof checks done — ready to consider listing it." : done + " of " + PROOF_CHECKS.length + " proof checks done";
}

const COST_FIELDS = ["unitCost", "shipping", "feePercent", "price"];

function readCosts() {
  const out = {};
  for (const k of COST_FIELDS) { const v = parseFloat($(k).value); out[k] = Number.isFinite(v) && v >= 0 ? v : 0; }
  out.feePercent = Math.min(out.feePercent, 100);
  return out;
}

function renderCostResult() {
  const touched = COST_FIELDS.some(k => $(k).value !== "");
  if (!touched) { $("cost-result").textContent = "Fill in what you know — the rest counts as $0."; $("cost-result").className = "result"; return; }
  const m = calcMargin(readCosts());
  $("cost-result").textContent = "Profit per sale: " + money(m.profit) + " (" + m.marginPercent + "% margin) · Break-even price: " + (m.breakEvenPrice === null ? "n/a" : money(m.breakEvenPrice));
  $("cost-result").className = "result " + (m.profit > 0 ? "good" : "bad");
}

function renderWorkbench() {
  $("selected").textContent = selected.name;
  $("notes").value = state.notes[selected.id] ?? "";
  const c = state.costs[selected.id];
  for (const k of COST_FIELDS) $(k).value = c ? String(c[k]) : "";
  renderCostResult();
  renderChecks();
  $("delete").hidden = !selected.custom;
}

$("family").addEventListener("change", renderGallery);
$("only-saved").addEventListener("change", renderGallery);
$("notes").addEventListener("input", () => { state.notes[selected.id] = $("notes").value.slice(0, 3000); persist(); });
for (const k of COST_FIELDS) $(k).addEventListener("input", () => {
  if (COST_FIELDS.every(f => $(f).value === "")) delete state.costs[selected.id]; else state.costs[selected.id] = readCosts();
  persist(); renderCostResult();
});

$("download").addEventListener("click", () => {
  const md = makeBrief(selected, $("notes").value, {checks: state.checks[selected.id] ?? [], costs: state.costs[selected.id] ?? null});
  download(selected.id + "-creative-brief.md", md, "text/markdown;charset=utf-8");
  status("Brief downloaded. Double-check every claim before production.");
});

$("delete").addEventListener("click", () => {
  if (!selected.custom || !confirm("Delete \"" + selected.name + "\" and its notes? This can't be undone.")) return;
  const id = selected.id;
  state.custom = state.custom.filter(c => c.id !== id);
  state.saved = state.saved.filter(x => x !== id);
  delete state.notes[id]; delete state.checks[id]; delete state.costs[id];
  persist(); select(concepts()[0]); renderGallery(); status("Design deleted.");
});

const familySelect = $("new-family");
for (const f of FAMILIES) { const o = el("option", f); o.value = f; familySelect.append(o); }

$("add-form").addEventListener("submit", e => {
  e.preventDefault();
  try {
    const f = new FormData(e.target);
    const c = makeConcept(Object.fromEntries(f), concepts().map(x => x.id));
    state.custom.push(c); persist(); e.target.reset();
    $("add-panel").open = false;
    select(c); renderGallery();
    status("Added " + c.name + ". It's open in the workbench.");
    $("workbench").scrollIntoView({behavior: "smooth"});
  } catch (err) { $("add-error").textContent = err.message; }
});
$("add-form").addEventListener("input", () => { $("add-error").textContent = ""; });

$("backup").addEventListener("click", () => {
  const stamp = new Date().toISOString().slice(0, 10);
  download("j-creative-studio-backup-" + stamp + ".json", JSON.stringify(state, null, 2), "application/json");
  status("Backup saved. Keep it somewhere safe, like Google Drive.");
});

$("restore").addEventListener("change", async e => {
  const file = e.target.files[0]; e.target.value = "";
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw Error("That file is too big to be a backup");
    const next = normalizeState(JSON.parse(await file.text()));
    if (!confirm("Replace everything on this device with the backup (" + next.custom.length + " of your own designs)?")) return;
    state = next; persist(); select(concepts()[0]); renderGallery();
    status("Backup restored.");
  } catch (err) { status("Couldn't restore: " + (err instanceof SyntaxError ? "that isn't a backup file" : err.message)); }
});

persist(); renderWorkbench(); renderGallery();
