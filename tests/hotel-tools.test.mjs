import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../web/tools/hotel-calculations.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {wholeNumber,roomShuffle,breakfastSchedule,serviceTime}=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

test('room capacity stays finite and a feasible shuffle assigns distinct rooms',()=>{
  assert.equal(roomShuffle(32,24,12).shortage,4);
  const plan=roomShuffle(40,24,12);
  assert.equal(plan.remaining,4);
  const assigned=[...Array.from({length:12},(_,i)=>i+1),...plan.moves.map(move=>move.to)];
  assert.equal(new Set(assigned).size,36);
  assert.ok(assigned.every(room=>room>=1&&room<=40));
  assert.deepEqual(plan.moves[0],{from:1,to:13});
  assert.deepEqual(plan.moves.at(-1),{from:24,to:36});
  assert.equal(roomShuffle(32,24,0).moves.length,0);
  assert.equal(roomShuffle(12,0,12).remaining,0);
});

test('invalid counts never silently become zero, round down, or create unbounded arrays',()=>{
  for(const value of ['', ' ', '-1', '1.5', 'Infinity', 'NaN', '1e2', '501'])
    assert.throws(()=>wholeNumber(value,'Guests',0,500));
  assert.throws(()=>roomShuffle(12,13,0));
  assert.throws(()=>roomShuffle(0,0,0));
  assert.throws(()=>breakfastSchedule(20,0,30,10,'08:00'));
  assert.throws(()=>breakfastSchedule(20,10,0,10,'08:00'));
  assert.throws(()=>breakfastSchedule(20,10,30,-1,'08:00'));
});

test('breakfast includes resets between sittings, never after the final sitting',()=>{
  const plan=breakfastSchedule(48,16,30,10,'08:00');
  assert.equal(plan.duration,110);
  assert.equal(serviceTime(plan.finish),'09:50');
  assert.deepEqual(plan.sittings.map(s=>s.guests),[16,16,16]);
  assert.equal(plan.sittings[1].start-plan.sittings[0].end,10);
  assert.equal(breakfastSchedule(17,16,30,0,'08:00').sittings[1].guests,1);
  assert.equal(breakfastSchedule(5,16,30,10,'08:00').duration,30);
  assert.deepEqual(breakfastSchedule(0,16,30,10,'08:00'),{sittings:[],duration:0,finish:480});
});

test('service clock reports midnight crossings without inventing a calendar date',()=>{
  assert.equal(serviceTime(breakfastSchedule(2,1,30,10,'23:30').finish),'00:40 (+1 day)');
  assert.equal(serviceTime(2880),'00:00 (+2 days)');
  for(const start of ['','8:00','24:00','12:60','-1:30']) assert.throws(()=>breakfastSchedule(1,1,30,0,start));
});
