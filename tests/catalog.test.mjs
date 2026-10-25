import test from "node:test";import assert from "node:assert/strict";import {CONCEPTS,makeBrief,normalizeSelected} from "../catalog.mjs";
test("three distinct launch directions",()=>{assert.equal(CONCEPTS.length,3);assert.equal(new Set(CONCEPTS.map(c=>c.id)).size,3);});
test("every concept has proposed physical medium",()=>assert.ok(CONCEPTS.every(c=>c.suggestedMedium&&c.palette&&c.motif)));
test("production brief includes evidence requirements",()=>{const x=makeBrief(CONCEPTS[0],"Check silk-screen sample");assert.match(x,/Physical test sample ordered/);assert.match(x,/Check silk-screen sample/);assert.match(x,/not production-approved/);});
test("shortlist ignores unknown ids",()=>assert.deepEqual(normalizeSelected(["horizon","missing","horizon","bloom"]),["horizon","bloom"]));
test("unknown concept rejected",()=>assert.throws(()=>makeBrief({id:"unknown"}),/Unknown/));
