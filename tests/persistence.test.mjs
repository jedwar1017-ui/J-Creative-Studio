import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../app.mjs",import.meta.url),"utf8");
const handler=source.slice(source.indexOf("function persist()"),source.indexOf("\nfunction download("));
for(const fail of [false,true])test("workbench persistence "+(fail?"reports unsaved edits":"returns success"),()=>{
 let message="",writes=0;const badge={};
 const context=vm.createContext({state:{saved:["horizon"]},KEY:"test",
  localStorage:{setItem:()=>{writes++;if(fail)throw Error("quota");}},
  status:s=>message=s,$:()=>badge});
 vm.runInContext(handler,context);
 assert.equal(context.persist(),!fail);assert.equal(writes,1);
 assert.equal(badge.textContent,"1 on shortlist");
 if(fail)assert.match(message,/Saving failed/);
});
