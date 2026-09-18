import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { coreIdentities, resolveCouncil } from "../modules/council/config.mjs";
import { Store } from "../server/store.mjs";
import { councilPacket, publishCouncil } from "../server/council.mjs";
import { reviewPacket } from "../server/review.mjs";

test("organizations inherit nine identities without mutating core or each other", () => {
  const extra={...coreIdentities[0],id:"LOCAL",name:"Local advisor",fictional:false};
  const a=resolveCouncil("AubOS",{additionalIdentities:[extra],identityOverrides:{CTO:{mandate:"Personal technical strategy"}},behavior:{focus:"Personal priorities",challengeRounds:2}});
  const f=resolveCouncil("FreedOS");
  assert.equal(a.identities.length,10);assert.equal(f.identities.length,9);
  assert.equal(a.identities.find(x=>x.id==="LOCAL").inherited,false);
  assert.notEqual(a.identities.find(x=>x.id==="CTO").mandate,f.identities.find(x=>x.id==="CTO").mandate);
  assert.equal(f.behavior.challengeRounds,1);
  assert.throws(()=>resolveCouncil("AubOS",{profile:"FreedOS"}),/profile/);
  assert.throws(()=>resolveCouncil("AubOS",{additionalIdentities:[coreIdentities[0]]}),/duplicate/);
  assert.throws(()=>resolveCouncil("AubOS",{behavior:{spendingAuthority:true}}),/unknown/);
  assert.throws(()=>resolveCouncil("AubOS",{identityOverrides:{ELON_MUSK:{fictional:false}}}),/unknown/);
  assert.throws(()=>resolveCouncil("AubOS",{disabledIdentities:coreIdentities.map(x=>x.id)}),/at least one/);
});

test("profile-scoped configuration controls prompts, attribution and stale-session rejection",async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),"council-config-"));const store=new Store(root);
  const folder=path.join(root,"AubOS","organization");await mkdir(folder,{recursive:true});
  const extension={version:1,profile:"AubOS",additionalIdentities:[{...coreIdentities[0],id:"LOCAL",name:"Local advisor"}],behavior:{maxRecommendations:1}};
  await writeFile(path.join(folder,"council.json"),JSON.stringify(extension));
  const state=await store.read("AubOS");const packet=councilPacket(state);
  assert.match(reviewPacket(state,"LOCAL").instruction,/Local advisor/);
  assert.throws(()=>reviewPacket(awaitableFreed(),"LOCAL"),/Unknown/);
  function awaitableFreed(){return {profile:"FreedOS",goals:[],tasks:[]};}
  const response={contract:packet.contract,sessionId:packet.sessionId,evidenceDigest:packet.evidenceDigest,summary:"Scoped review",bundle:{contract:"vorton-local.recommendations.v1",profile:"AubOS",basedOnRevision:0,recommendations:[{role:"LOCAL",kind:"task",rationale:"Fixture",proposal:{title:"Local proposal"}}]}};
  const clone=structuredClone(state);publishCouncil(clone,response);
  assert.equal(clone.recommendations[0].role,"LOCAL");assert.equal(clone.councilSessions[0].council.identities.length,10);
  const excessive=structuredClone(response);excessive.bundle.recommendations.push(excessive.bundle.recommendations[0]);
  assert.throws(()=>publishCouncil(structuredClone(state),excessive),/recommendations/);
  extension.behavior.focus="Changed focus";await writeFile(path.join(folder,"council.json"),JSON.stringify(extension));
  assert.throws(()=>publishCouncil(awaitState(),response),/evidence changed/);
  function awaitState(){return {...state,council:resolveCouncil("AubOS",extension)};}
  assert.equal((await store.read("FreedOS")).council.identities.length,9);
});
