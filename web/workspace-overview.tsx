import type {State} from './types';
import {CouncilAvatar} from './council-avatar';
import './workspace-overview.css';

const open = (status:string) => !['done','cancelled'].includes(status);
export function OperationsOverview({state}: {state:State}) {
  const base=`/${state.profile.toLowerCase()}`;
  const goals=state.goals.filter(g=>g.status==='active'&&!g.parentId);
  const decisions=state.recommendations.filter(r=>r.status==='pending');
  const priority:Record<string,number>={urgent:0,high:1,normal:2,low:3};
  const tasks=state.tasks.filter(t=>open(t.status)).sort((a,b)=>Number(b.status==='blocked')-Number(a.status==='blocked')||(priority[a.priority]??4)-(priority[b.priority]??4)||(a.dueOn||'9999').localeCompare(b.dueOn||'9999'));
  return <div className="operations-overview">
    <section className="operations-metrics" aria-label="Operating picture">
      <a href={`${base}/goals`}><strong>{goals.length}</strong><span>Active goals</span></a>
      <a href={`${base}/tasks`}><strong>{tasks.length}</strong><span>Open tasks</span></a>
      <a href={`${base}/council#recommendations`}><strong>{decisions.length}</strong><span>Awaiting your decision</span></a>
    </section>
    <div className="operations-columns">
      <section className="panel operations-goals"><h2>What we're moving toward</h2>{goals.length ? goals.map(goal=><article key={goal.id}>
        <div className="operations-row"><span className="badge">{goal.priority}</span><span>{goal.owner}</span></div>
        <h3><a href={`${base}/goals#goal-${goal.id}`}>{goal.title}</a></h3>
        <p>{goal.successCriteria || goal.intent}</p>
        <div className="operations-progress"><progress max={100} value={goal.progress} aria-label={`${goal.title} progress`}/><span>{goal.progress}%</span></div>
        {goal.milestones.find(m=>!m.done)&&<p className="operations-next"><strong>Next milestone</strong> {goal.milestones.find(m=>!m.done)?.title}</p>}
      </article>):<p>No active goals.</p>}</section>
      <div className="operations-stack">
        {decisions.length>0&&<section className="panel operations-decisions"><h2>Needs a decision</h2><ul>{decisions.slice(0,3).map(r=><li key={r.id}><a href={`${base}/council#recommendation-${r.id}`}>{r.proposal.title}</a><p>{r.rationale}</p></li>)}</ul><a href={`${base}/council#recommendations`}>Review {decisions.length===1?'recommendation':`all ${decisions.length} recommendations`} ↗</a></section>}
        <section className="panel operations-tasks"><div className="operations-row"><h2>Next up</h2><a href={`${base}/tasks`}>All tasks ↗</a></div><ul>{tasks.slice(0,5).map(task=><li key={task.id}><span className="badge">{task.status.replaceAll('-',' ')}</span><h3><a href={`${base}/tasks#task-${task.id}`}>{task.title}</a></h3><p>{task.owner}{task.dueOn&&<> · Due <time dateTime={task.dueOn}>{task.dueOn}</time></>}</p></li>)}</ul>{!tasks.length&&<p>No open tasks.</p>}</section>
      </div>
    </div>
  </div>;
}

export function OrganizationOverview({state}: {state:State}) {
  const base=`/${state.profile.toLowerCase()}`;
  return <section className="organization-overview">
    <header className="page-heading"><h1>Organization</h1><p>{state.council?.behavior.focus}</p></header>
    {state.council?.behavior.decisionCriteria&&<section className="panel"><h2>How we decide</h2><p>{state.council.behavior.decisionCriteria}</p><a href={`${base}/council`}>Open Council ↗</a></section>}
    <h2>People & responsibilities</h2>
    <div className="organization-roster">{state.council?.identities.map(person=>{
      const tasks=state.tasks.filter(task=>task.owner===person.name&&open(task.status));
      const goals=state.goals.filter(goal=>goal.owner===person.name&&goal.status==='active');
      return <article className="panel" key={person.id}><div className="organization-person"><CouncilAvatar identity={person} size={64}/><div><h3>{person.name}</h3><p>{person.title}</p></div></div><p>{person.mandate}</p><ul>{goals.map(goal=><li key={goal.id}><a href={`${base}/goals#goal-${goal.id}`}>{goal.title}</a></li>)}{tasks.slice(0,3).map(task=><li key={task.id}><a href={`${base}/tasks#task-${task.id}`}>{task.title}</a></li>)}</ul><span className="quiet">{tasks.length} open {tasks.length===1?'task':'tasks'} · {goals.length} active {goals.length===1?'goal':'goals'}</span></article>;
    })}</div>
  </section>;
}
