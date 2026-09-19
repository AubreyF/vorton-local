import {useId, useState} from 'react';
import type {TaskFields} from '../types';
import {breakfastSchedule, roomShuffle, serviceTime, wholeNumber} from './hotel-calculations';
import {ToolsPage, type ToolProps, type ToolDefinition} from './tools-page';

const task = (title:string,notes:string):TaskFields => ({title,notes,owner:'',goalId:'',dueOn:'',priority:'normal',status:'todo'});
function calculate<T,>(run:()=>T):{value:T;error?:never}|{value?:never;error:string} {
  try {return {value:run()};} catch(error) {return {error:(error as Error).message};}
}
function NumberField({label,value,set,min=0,max=500}:{label:string;value:string;set:(value:string)=>void;min?:number;max?:number}) {
  const id=useId();
  return <label htmlFor={id}>{label}<input id={id} type="number" inputMode="numeric" min={min} max={max} step="1" value={value} onChange={event=>set(event.target.value)}/></label>;
}

function HilbertDesk({onDraftTask}:ToolProps) {
  const [rooms,setRooms]=useState('32'),[occupied,setOccupied]=useState('24'),[arrivals,setArrivals]=useState('12');
  const result=calculate(()=>roomShuffle(wholeNumber(rooms,'Available rooms',1,500),wholeNumber(occupied,'Occupied rooms',0,500),wholeNumber(arrivals,'Arriving guests',0,500)));
  const plan=result.value;
  const notes=plan ? `Room scenario: ${rooms} available rooms, ${occupied} occupied, ${arrivals} arrivals. ${plan.required} rooms required; ${plan.shortage} short; ${plan.remaining} spare. Assumes one guest per room. ${Number(occupied)?`Existing guests occupy rooms 1 through ${occupied}.`:'No rooms are occupied.'} ${plan.shortage?'Find capacity or reduce arrivals before assigning rooms.':Number(arrivals)?`${Number(occupied)?`Move existing guests from highest room number downward by ${arrivals}; `:''}arriving guests take rooms 1 through ${arrivals}.`:'No room moves needed.'} This scenario does not change bookings.` : '';
  return <div className="tool-layout">
    <fieldset className="tool-fields"><legend>Count the finite things</legend>
      <NumberField label="Available rooms" value={rooms} set={setRooms} min={1}/>
      <NumberField label="Occupied rooms" value={occupied} set={setOccupied}/>
      <NumberField label="Arriving guests" value={arrivals} set={setArrivals}/>
      <p className="quiet">One guest per room. Existing guests occupy consecutive rooms starting at 1. All available rooms are usable.</p>
    </fieldset>
    <div className="tool-result">
      <div aria-live="polite" aria-atomic="true">{result.error ? <p role="status">{result.error}</p> : plan && <>
        <p className="tool-number">{plan.shortage ? `${plan.shortage} rooms short` : `${plan.remaining} rooms spare`}</p>
        <p>{plan.shortage?'Infinity has declined your booking request. Add capacity or reduce arrivals.':Number(arrivals)?'Everyone fits. The luggage, regrettably, still has to move.':'No arrivals. Let the guests remain where reality left them.'}</p>
        <p className="quiet">{occupied} occupied + {arrivals} arrivals = {plan.required} rooms needed.</p>
      </>}</div>
      {plan && <>
        {!plan.shortage && Number(arrivals)>0 && <>
          <p><strong>New arrivals:</strong> rooms 1 through {arrivals}.</p>
          {plan.moves.length>0 && <><p><strong>Existing guests:</strong> move from the highest room downward to avoid collisions.</p>
            <ol className="tool-ledger" aria-label="First room moves">{plan.moves.slice().reverse().slice(0,5).map(move=><li key={move.from}><span>Room {move.from}</span><span aria-label="moves to">→</span><strong>Room {move.to}</strong></li>)}</ol>
            {plan.moves.length>5&&<p className="quiet">First 5 of {plan.moves.length} moves. Continue down to room 1 → {Number(arrivals)+1}.</p>}</>}
        </>}
        <button type="button" onClick={()=>onDraftTask(task(plan.shortage?`Find ${plan.shortage} more rooms before accepting arrivals`:'Review the room-shuffle plan',notes))}>Draft room task</button>
        <p className="quiet">Opens an editable task. Nothing is saved until you choose Save task.</p>
      </>}
    </div>
  </div>;
}

function BreakfastLab({onDraftTask}:ToolProps) {
  const [guests,setGuests]=useState('48'),[seats,setSeats]=useState('16'),[eating,setEating]=useState('30'),[reset,setReset]=useState('10'),[start,setStart]=useState('08:00');
  const result=calculate(()=>breakfastSchedule(wholeNumber(guests,'Hungry guests',0,500),wholeNumber(seats,'Seats',1,100),wholeNumber(eating,'Minutes per sitting',1,120),wholeNumber(reset,'Reset minutes',0,60),start));
  const plan=result.value;
  const notes=plan ? `Breakfast scenario: ${guests} guests, ${seats} seats, ${eating} minutes per sitting, ${reset} minutes between sittings, starting ${start}. ${plan.sittings.length} sittings; ${plan.duration} minutes; finish ${serviceTime(plan.finish)}. Assumes all guests are ready, each sitting starts together, and the kitchen can serve all seats at once. Relative service clock; no date or time-zone conversion. No final reset included.` : '';
  return <div className="tool-layout">
    <fieldset className="tool-fields"><legend>Set the breakfast conditions</legend>
      <NumberField label="Hungry guests" value={guests} set={setGuests}/>
      <NumberField label="Seats" value={seats} set={setSeats} min={1} max={100}/>
      <div className="tool-field-pair"><NumberField label="Minutes per sitting" value={eating} set={setEating} min={1} max={120}/><NumberField label="Reset minutes" value={reset} set={setReset} max={60}/></div>
      <label>First sitting<input type="time" required value={start} onChange={event=>setStart(event.target.value)}/></label>
      <p className="quiet">Guests are ready together. The kitchen serves a full sitting at once. Reset time falls between sittings, never after the last. Times use a relative service clock.</p>
    </fieldset>
    <div className="tool-result">
      <div aria-live="polite" aria-atomic="true">{result.error ? <p role="status">{result.error}</p> : plan && <>
        <p className="tool-number">{plan.duration} minutes</p>
        <p>{plan.sittings.length?`${plan.sittings.length} sittings. Last guest finished by ${serviceTime(plan.finish)}. The toaster has no right of appeal.`:'No guests, no sittings. A rare victory over entropy.'}</p>
      </>}</div>
      {plan && plan.sittings.length>0 && <>
        <ol className="breakfast-sittings" aria-label="Breakfast sittings">{plan.sittings.slice(0,6).map((sitting,index)=><li key={index}><strong>Sitting {index+1} · {sitting.guests} guests</strong><span>{serviceTime(sitting.start)} → {serviceTime(sitting.end)}</span></li>)}</ol>
        {plan.sittings.length>6&&<p className="quiet">First 6 of {plan.sittings.length} sittings. The final sitting ends at {serviceTime(plan.finish)}.</p>}
        <button type="button" onClick={()=>onDraftTask(task(`Plan breakfast for ${guests} guests`,notes))}>Draft breakfast task</button>
        <p className="quiet">Review the assumptions and assign an owner before saving.</p>
      </>}
    </div>
  </div>;
}

const hotelTools:ToolDefinition[]=[
  {id:'hilbert-desk',title:'Hilbert’s Overbooking Desk',description:'Try the famous room shuffle. This hotel, unlike the thought experiment, has a last room.',component:HilbertDesk},
  {id:'breakfast-lab',title:'Breakfast Causality Lab',description:'Find out when breakfast ends before authorizing another round of toast.',component:BreakfastLab},
];
export function LastResortTools(props:ToolProps) {return <ToolsPage tools={hotelTools} {...props}/>;}
