import React, { useEffect, useId, useRef, useState } from "react";

const DAY = 86_400_000;
const dateAt = (year: number, month: number, day: number) => { const date=new Date(0); date.setUTCFullYear(year,month,day); return date; };
const label = (day: number) => new Date(day*DAY).toLocaleDateString(undefined,{dateStyle:"full",timeZone:"UTC"});

export function CouncilCalendar({today,sessionDays,onJump}: {today:number;sessionDays:Set<number>;onJump:(day:number)=>void}) {
  const now=new Date(today*DAY);
  const [open,setOpen]=useState(false);
  const [year,setYear]=useState(String(now.getUTCFullYear()));
  const [month,setMonth]=useState(now.getUTCMonth());
  const [notice,setNotice]=useState("");
  const root=useRef<HTMLDivElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const yearField=useRef<HTMLInputElement>(null);
  const panelId=useId();
  const validYear=/^\d{1,4}$/.test(year) && Number(year)>=1 && Number(year)<=now.getUTCFullYear();
  const days=validYear ? dateAt(Number(year),month+1,0).getUTCDate() : 0;
  const offset=validYear ? dateAt(Number(year),month,1).getUTCDay() : 0;
  const close=()=>{setOpen(false);trigger.current?.focus({preventScroll:true});};
  useEffect(()=>{
    if(!open) return;
    yearField.current?.focus({preventScroll:true});
    const outside=(event:PointerEvent)=>{if(event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);};
    document.addEventListener("pointerdown",outside);
    return()=>document.removeEventListener("pointerdown",outside);
  },[open]);
  return <div className="council-calendar" ref={root} onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();close();}}}>
    <button ref={trigger} type="button" className="timeline-calendar-button" aria-label="Choose council date" aria-haspopup="dialog" aria-expanded={open} aria-controls={open?panelId:undefined} onClick={()=>{setNotice("");setOpen(value=>!value);}}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18M7 14h2m3 0h2m3 0h1M7 17h2m3 0h2"/></svg>
    </button>
    {open && <div id={panelId} className="council-calendar-panel" role="dialog" aria-modal="false" aria-label="Jump to council date">
      <div className="calendar-fields"><label>Month<select value={month} onChange={event=>{setMonth(Number(event.target.value));setNotice("");}}>{Array.from({length:12},(_,index)=><option key={index} value={index}>{dateAt(2000,index,1).toLocaleDateString(undefined,{month:"long",timeZone:"UTC"})}</option>)}</select></label><label>Year<input ref={yearField} type="number" min="1" max={now.getUTCFullYear()} value={year} onChange={event=>{setYear(event.target.value);setNotice("");}}/></label></div>
      {!validYear ? <p role="status">Enter a year from 1 to {now.getUTCFullYear()}.</p> : <div className="calendar-days">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><span className="calendar-weekday" key={day} aria-label={day}>{day[0]}</span>)}
        {Array.from({length:offset},(_,index)=><span key={`blank-${index}`} aria-hidden="true"/>)}
        {Array.from({length:days},(_,index)=>{const day=Math.floor(dateAt(Number(year),month,index+1).getTime()/DAY);const recorded=sessionDays.has(day);return <button type="button" key={day} disabled={day>today} className={recorded?"has-session":undefined} aria-current={day===today?"date":undefined} aria-label={`${label(day)}${recorded?", saved council session":""}`} onClick={()=>{onJump(day);if(recorded) close();else setNotice(`No session recorded for ${label(day)}.`);}}>{index+1}</button>;})}
      </div>}
      <p className="calendar-notice" role="status">{notice || "Highlighted dates have saved sessions."}</p>
    </div>}
  </div>;
}
