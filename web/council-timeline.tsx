import React, { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { State } from "./types";
import { CouncilCalendar } from "./council-calendar";

type Session = NonNullable<State["councilSessions"]>[number];
const DAY = 86_400_000;
// Use calendar dates as integer positions, so daylight saving cannot skip days.
const dayOf = (value: string | Date) => { const date = new Date(value); return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()) / DAY); };
const dayLabel = (day: number) => new Date(day*DAY).toLocaleDateString(undefined,{month:"short",day:"numeric",timeZone:"UTC"});
const fullLabel = (day: number) => new Date(day*DAY).toLocaleDateString(undefined,{dateStyle:"full",timeZone:"UTC"});

export function SessionTimeline({sessions,selected,onSelect}: {sessions: Session[];selected:string;onSelect:(id:string)=>void}) {
  const today = dayOf(new Date());
  const [range,setRange] = useState({start:today-90,end:today});
  const [geometry,setGeometry] = useState({width:0,left:0,right:0});
  const rail = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLDivElement>(null);
  const pending = useRef<{key:string;left:number} | null>(null);
  const initialized = useRef(false);
  const atPresent = useRef(true);
  const changing = useRef(false);
  const reveal = useRef<string | null>(null);
  const activeDay = sessions.find(s=>s.id === selected);
  const items: {key:string;day:number;session?:Session}[] = [];
  const byDay = new Map<number,Session[]>();
  sessions.forEach(session=> { const day=dayOf(session.publishedAt); byDay.set(day,[...(byDay.get(day) ?? []),session]); });
  for(let day=range.start;day<=range.end;day++) {
    const daily=byDay.get(day);
    if(daily?.length) daily.forEach(session=>items.push({key:session.id,day,session}));
    else items.push({key:`day-${day}`,day});
  }
  useLayoutEffect(()=> {
    const content=heading.current;
    if(!content) return;
    const canvas=document.documentElement;
    const measure=()=> {
      const box=content.getBoundingClientRect(); const width=canvas.clientWidth;
      setGeometry({width,left:-box.left,right:width-box.right});
    };
    const observer=new ResizeObserver(measure); observer.observe(canvas); observer.observe(content); measure();
    window.addEventListener("resize",measure);
    return ()=>{observer.disconnect();window.removeEventListener("resize",measure);};
  },[]);
  useLayoutEffect(()=> {
    const el=rail.current;
    if(!el || !geometry.width) return;
    if(pending.current) {
      const anchor=Array.from(el.querySelectorAll<HTMLElement>('[data-stop-key]')).find(node=>node.dataset.stopKey === pending.current?.key);
      if(anchor) el.scrollLeft+=anchor.getBoundingClientRect().left-pending.current.left;
      pending.current=null;
    } else if(!initialized.current || (atPresent.current && range.end===today)) {
      const marker=reveal.current ? Array.from(el.querySelectorAll<HTMLElement>('[data-stop-key]')).find(node=>node.dataset.stopKey === reveal.current) : null;
      if(marker) el.scrollLeft+=marker.getBoundingClientRect().left-el.getBoundingClientRect().left+marker.offsetWidth/2-el.clientWidth/2;
      else if(!reveal.current) {
        // Align the actual circle, independently of the viewport-wide strip.
        const present=Array.from(el.querySelectorAll<HTMLElement>('[data-today="true"] .timeline-orbit')).at(-1);
        if(present && heading.current) el.scrollLeft+=present.getBoundingClientRect().right-heading.current.getBoundingClientRect().right;
      }
      initialized.current=true; reveal.current=null;
    }
    changing.current=false;
  },[range,geometry]);
  useEffect(()=> {
    if(!activeDay || !initialized.current) return;
    const day=dayOf(activeDay.publishedAt);
    if(day<range.start || day>range.end) { const end=Math.min(today,day+30); initialized.current=false; reveal.current=selected; setRange({start:end-90,end}); }
    else {
      const el=rail.current;
      const marker=el && Array.from(el.querySelectorAll<HTMLElement>('[data-stop-key]')).find(node=>node.dataset.stopKey === selected);
      if(el && marker) { const bounds=el.getBoundingClientRect(); const box=marker.getBoundingClientRect(); if(box.left<bounds.left || box.right>bounds.right) el.scrollLeft+=box.left-bounds.left+box.width/2-el.clientWidth/2; }
    }
  },[selected,geometry.width]); // Selection scrolls only the strip, never the page.
  function extend() {
    const el=rail.current;
    if(!el || !initialized.current || changing.current) return;
    atPresent.current=range.end===today && el.scrollWidth-el.clientWidth-el.scrollLeft<2;
    const before=el.scrollLeft<450; const after=range.end<today && el.scrollWidth-el.clientWidth-el.scrollLeft<450;
    if(!before && !after) return;
    const box=el.getBoundingClientRect();
    const anchor=Array.from(el.querySelectorAll<HTMLElement>('[data-stop-key]')).find(node=>node.getBoundingClientRect().right>box.left);
    if(!anchor) return;
    pending.current={key:anchor.dataset.stopKey!,left:anchor.getBoundingClientRect().left}; changing.current=true;
    setRange(current=>{const shift=before ? -30 : Math.min(30,today-current.end);return {start:current.start+shift,end:current.end+shift};});
  }
  useEffect(()=> {
    const el=rail.current; if(!el) return;
    const wheel=(event:WheelEvent)=> { if(event.ctrlKey || Math.abs(event.deltaX)>=Math.abs(event.deltaY)) return; event.preventDefault(); el.scrollLeft+=event.deltaY*(event.deltaMode===1 ? 20 : event.deltaMode===2 ? el.clientWidth : 1); };
    el.addEventListener("wheel",wheel,{passive:false}); return ()=>el.removeEventListener("wheel",wheel);
  },[]);
  function returnToday() { initialized.current=false; atPresent.current=true; pending.current=null; reveal.current=null; setRange({start:today-90,end:today}); }
  function jumpToDay(day:number) {
    const session=byDay.get(day)?.at(-1);
    const end=Math.min(today,day+30);
    pending.current=null; initialized.current=false; atPresent.current=false;
    reveal.current=session?.id ?? `day-${day}`;
    setRange({start:end-90,end});
    if(session) onSelect(session.id);
  }
  return <section className="council-timeline" aria-label="Council session timeline">
    <div ref={heading} className="timeline-heading"><CouncilCalendar today={today} sessionDays={new Set(byDay.keys())} onJump={jumpToDay}/><button type="button" className="timeline-today" onClick={returnToday}>Today</button></div>
    <div ref={rail} className="timeline-rail" tabIndex={0} aria-label="Council dates. Scroll left for earlier sessions, right to return toward today." onScroll={extend} onKeyDown={event=>{if(event.key === "ArrowLeft" || event.key === "ArrowRight") {event.preventDefault();event.currentTarget.scrollLeft+=event.key === "ArrowLeft" ? -150 : 150;} if(event.key === "End") {event.preventDefault();returnToday();}}} style={geometry.width ? {width:geometry.width,marginLeft:geometry.left,"--timeline-right-inset":`${geometry.right}px`} as CSSProperties : undefined}>
      <ol data-present-end={range.end===today ? "true" : undefined}>{items.map(({key,day,session})=><li key={key} data-stop-key={key} data-today={day===today ? "true" : undefined}>
        {session ? <button type="button" className="timeline-stop" aria-pressed={session.id===selected} aria-label={`${fullLabel(day)}, ${new Date(session.publishedAt).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}`} onClick={()=>onSelect(session.id)}><span className="timeline-day">{day===today ? "Today" : dayLabel(day)}</span><span className="timeline-orbit"><span className="timeline-dot">{new Date(day*DAY).getUTCDate()}</span></span><span className="timeline-time">{new Date(session.publishedAt).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}</span></button>
          : <div className="timeline-stop timeline-vacant" aria-label={`${fullLabel(day)}, no session`}><span className="timeline-day">{day===today ? "Today" : dayLabel(day)}</span><span className="timeline-orbit"><span className="timeline-dot"/></span><span className="timeline-time">{day===today ? "No briefing yet" : ""}</span></div>}
      </li>)}</ol>
    </div>
  </section>;
}
