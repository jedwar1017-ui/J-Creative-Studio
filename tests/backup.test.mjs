import test from "node:test";
import assert from "node:assert/strict";
import {makeConcept, normalizeState, parseBackup} from "../catalog.mjs";

test("unrelated JSON cannot be used to replace saved designs", () => {
  for (const raw of [null, [], 42, {}, {projects:[]}, {version:99,saved:[],notes:{}}]) {
    assert.throws(() => parseBackup(JSON.stringify(raw)), /backup/);
  }
});
test("version 2 backup round trip preserves design-linked work", () => {
  const state = normalizeState({custom:[{id:"custom-dragon",name:"Dragon",family:"Tattoo"}],
    saved:["custom-dragon"],notes:{"custom-dragon":"Keep original art"},checks:{"custom-dragon":[true]},
    costs:{"custom-dragon":{unitCost:10,price:25}}});
  assert.deepEqual(parseBackup(JSON.stringify(state)),state);
});
test("old shortlist and notes backup remains supported", () => {
  assert.equal(parseBackup('{"saved":["bloom"],"notes":{"bloom":"original"}}').notes.bloom,"original");
});
test("design 51 is rejected before saving, and oversized restore fails", () => {
  const custom = [];
  for(let i=0;i<50;i++) custom.push(makeConcept({name:"Design "+i,family:"Apparel"},custom.map(c=>c.id)));
  assert.throws(()=>makeConcept({name:"Extra",family:"Apparel"},custom.map(c=>c.id)),/50/);
  assert.equal(parseBackup(JSON.stringify(normalizeState({custom,saved:[],notes:{}}))).custom.length,50);
  assert.throws(()=>parseBackup(JSON.stringify({custom:[...custom,custom[0]],saved:[],notes:{}})),/50/);
});
test("damaged or duplicate IDs are rejected instead of dropping design data", () => {
  const c=makeConcept({name:"A",family:"Apparel"});
  for(const custom of [[c,c],[{...c,name:""}]]) {
    assert.throws(()=>parseBackup(JSON.stringify({custom,saved:[],notes:{}})),/invalid|duplicate/);
  }
  assert.throws(()=>parseBackup('{"saved":[],"notes":{"ghost":"important"}}'),/invalid/);
});
