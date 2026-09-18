import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import http from "node:http";
import { brotliDecompressSync, gunzipSync } from "node:zlib";
import { createCoreServer } from "../server/core-http.mjs";

async function fixture(t) {
  const root=await mkdtemp(path.join(os.tmpdir(),"portable-http-"));
  const app=createCoreServer({root,port:0});
  await new Promise(resolve=>app.server.listen(0,"127.0.0.1",resolve));
  const base=`http://127.0.0.1:${app.server.address().port}`;
  app.hosts.add(new URL(base).host);app.allowed.add(base);
  t.after(async()=>{await new Promise(resolve=>app.server.close(resolve));await rm(root,{recursive:true,force:true});});
  const session=await(await fetch(`${base}/api/session`)).json();
  const headers={Origin:base,"Content-Type":"application/json","X-Vorton-Session":session.token};
  return {root,base,headers};
}
test("portable mutations reject foreign origins, forged sessions, malformed bodies, and stale revisions",async t=>{
  const {base,headers}=await fixture(t);
  const command={requestId:randomUUID(),expectedRevision:0,action:"goal.create",payload:{fields:{title:"Controlled fixture"}}};
  const post=(body,overrides={})=>fetch(`${base}/api/lastresort/command`,{method:"POST",headers:{...headers,...overrides},body});
  assert.equal((await post(JSON.stringify(command),{Origin:"https://foreign.example"})).status,403);
  assert.equal((await post(JSON.stringify(command),{"X-Vorton-Session":"wrong"})).status,403);
  for(const body of ["{","null","[]"])assert.equal((await post(body)).status,400);
  assert.equal((await post(JSON.stringify(command))).status,200);
  assert.equal((await post(JSON.stringify(command))).status,200,"Identical retries remain idempotent");
  assert.equal((await post(JSON.stringify({...command,requestId:randomUUID()}))).status,409);
  const state=await(await fetch(`${base}/api/lastresort/state`)).json();
  assert.equal(state.goals.length,1);
  assert.equal("requests" in state,false);
  assert.equal((await fetch(`${base}/api/lastresort/state`,{headers:{"Sec-Fetch-Site":"cross-site"}})).status,403);
});
test("portable assets reject symlink escapes and only fingerprinted assets receive immutable caching",async t=>{
  const {root,base}=await fixture(t);
  const dist=path.join(root,"dist");
  await mkdir(path.join(dist,"demo-assets"),{recursive:true});
  await writeFile(path.join(dist,"index.html"),"<!doctype html><title>Controlled fixture</title>");
  await writeFile(path.join(dist,"demo-assets/app-12345678.js"),"export const fixture = true;");
  await writeFile(path.join(root,"outside.txt"),"Controlled data outside the served directory");
  await symlink(path.join(root,"outside.txt"),path.join(dist,"demo-assets/escape.js"));
  assert.equal((await fetch(`${base}/demo-assets/escape.js`)).status,404);
  assert.equal((await fetch(`${base}/outside.txt`)).status,404);
  const page=await fetch(`${base}/lastresort/bridge`);
  assert.equal(page.status,200);
  assert.equal(page.headers.get("cache-control"),"no-store");
  const asset=await fetch(`${base}/demo-assets/app-12345678.js`);
  assert.equal(asset.status,200);
  assert.match(asset.headers.get("cache-control"),/immutable/);
  const head=await fetch(`${base}/demo-assets/app-12345678.js`,{method:"HEAD"});
  assert.equal(head.status,200);
  assert.equal(await head.text(),"");
});

test("portable production assets negotiate compression without caching private responses", async t => {
  const {root,base}=await fixture(t);
  const body=Buffer.from("export const fixture = '"+"portable asset ".repeat(1000)+"';");
  await mkdir(path.join(root,"dist/demo-assets"),{recursive:true});
  await writeFile(path.join(root,"dist/demo-assets/app-12345678.js"),body);
  const request=(route,encoding,method="GET")=>new Promise((resolve,reject)=>{
    const req=http.request(base+route,{method,headers:{"Accept-Encoding":encoding}},res=>{
      const chunks=[];res.on("data",chunk=>chunks.push(chunk));
      res.on("end",()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));
      res.on("error",reject);
    });
    req.on("error",reject);req.end();
  });
  for(const encoding of ["br","gzip"]) {
    const result=await request("/demo-assets/app-12345678.js",encoding);
    assert.equal(result.status,200);
    assert.equal(result.headers["content-encoding"],encoding);
    assert.match(result.headers["cache-control"],/private.*immutable/);
    assert.match(result.headers.vary,/Accept-Encoding/);
    assert.ok(result.body.length<body.length);
    assert.deepEqual(encoding==="br"?brotliDecompressSync(result.body):gunzipSync(result.body),body);
  }
  const plain=await request("/demo-assets/app-12345678.js","br;q=0,gzip;q=0");
  assert.equal(plain.headers["content-encoding"],undefined);
  assert.deepEqual(plain.body,body);
  const head=await request("/demo-assets/app-12345678.js","br","HEAD");
  assert.equal(head.body.length,0);
  assert.equal(Number(head.headers["content-length"]),body.length);
  for(const route of ["/api/lastresort/state","/demo-assets/missing-12345678.js","/api/aubos/state"]) {
    const result=await request(route,"br");
    assert.equal(result.status,route==="/api/lastresort/state"?200:404);
    assert.equal(result.headers["cache-control"],"no-store");
  }
});
