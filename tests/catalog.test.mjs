import test from "node:test";
import assert from "node:assert/strict";
import {CONCEPTS, FAMILIES, PROOF_CHECKS, allConcepts, calcMargin, makeBrief, makeConcept, normalizeSelected, normalizeState} from "../catalog.mjs";

test("three distinct launch directions", () => {
  assert.equal(CONCEPTS.length, 3);
  assert.equal(new Set(CONCEPTS.map(c => c.id)).size, 3);
});

test("every concept has proposed physical medium", () => assert.ok(CONCEPTS.every(c => c.suggestedMedium && c.palette && c.motif)));

test("production brief includes evidence requirements", () => {
  const x = makeBrief(CONCEPTS[0], "Check silk-screen sample");
  assert.match(x, /Physical test sample ordered/);
  assert.match(x, /Check silk-screen sample/);
  assert.match(x, /not production-approved/);
});

test("shortlist ignores unknown ids", () => assert.deepEqual(normalizeSelected(["horizon", "missing", "horizon", "bloom"]), ["horizon", "bloom"]));

test("unknown concept rejected", () => assert.throws(() => makeBrief({id: "unknown"}), /Unknown/));

test("tattoo is a supported collection", () => assert.ok(FAMILIES.includes("Tattoo")));

test("custom design gets a unique id and sensible defaults", () => {
  const a = makeConcept({name: "  Night   Shift Dragon ", family: "Tattoo"}, ["custom-night-shift-dragon"]);
  assert.equal(a.name, "Night Shift Dragon");
  assert.equal(a.id, "custom-night-shift-dragon-2");
  assert.equal(a.suggestedMedium, "Tattoo");
  assert.ok(a.custom && Number.isInteger(a.hue));
  assert.match(makeBrief(a), /Night Shift Dragon/);
});

test("custom design requires a name and valid collection", () => {
  assert.throws(() => makeConcept({name: "   ", family: "Apparel"}), /name/);
  assert.throws(() => makeConcept({name: "X", family: "Shoes"}), /collection/);
});

test("margin math: profit, margin and break-even", () => {
  const m = calcMargin({unitCost: 8, shipping: 2, feePercent: 10, price: 25});
  assert.deepEqual(m, {landed: 10, fees: 2.5, profit: 12.5, marginPercent: 50, breakEvenPrice: 11.11});
  assert.equal(calcMargin({unitCost: 5, feePercent: 100, price: 10}).breakEvenPrice, null);
  assert.throws(() => calcMargin({unitCost: -1}), /zero or more/);
});

test("brief records ticked checks and costs", () => {
  const md = makeBrief(CONCEPTS[1], "", {checks: [true, false, true], costs: {unitCost: 8, shipping: 2, feePercent: 10, price: 25}});
  assert.match(md, /- \[x\] Artwork ownership/);
  assert.match(md, /- \[ \] Production dimensions/);
  assert.match(md, /Profit: \$12\.50 \(50% margin\)/);
  assert.equal((md.match(/- \[[ x]\]/g) ?? []).length, PROOF_CHECKS.length);
});

test("normalizeState survives garbage and keeps valid data", () => {
  assert.deepEqual(normalizeState("nope"), {version: 2, custom: [], saved: [], notes: {}, checks: {}, costs: {}});
  const s = normalizeState({
    custom: [{id: "custom-wolf", name: "Wolf", family: "Apparel"}, {name: "", family: "Apparel"}, {id: "custom-wolf", name: "Wolf", family: "Tattoo"}],
    saved: ["custom-wolf", "horizon", "ghost"],
    notes: {"custom-wolf": "hi", ghost: "x", bloom: 5},
    checks: {horizon: [true, "yes", true]},
    costs: {"custom-wolf": {unitCost: "4", price: -3, feePercent: 500}}
  });
  assert.deepEqual(s.custom.map(c => c.id), ["custom-wolf", "custom-wolf-2"]);
  assert.deepEqual(s.saved, ["custom-wolf", "horizon"]);
  assert.deepEqual(s.notes, {"custom-wolf": "hi"});
  assert.deepEqual(s.checks.horizon, [true, false, true, false, false, false]);
  assert.deepEqual(s.costs["custom-wolf"], {unitCost: 4, shipping: 0, feePercent: 100, price: 0});
  assert.equal(allConcepts(s.custom).length, 5);
});

test("old v1 saved data still loads", () => {
  const s = normalizeState({saved: ["bloom"], notes: {bloom: "keep me"}});
  assert.deepEqual(s.saved, ["bloom"]);
  assert.equal(s.notes.bloom, "keep me");
});
