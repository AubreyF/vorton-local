import {useEffect, type ComponentType} from 'react';
import type {TaskFields} from '../types';
import './tools.css';

export type ToolProps = {onDraftTask: (draft:TaskFields)=>void};
export type ToolDefinition = {
  id:string;
  title:string;
  description:string;
  component:ComponentType<ToolProps>;
};

/** Workspace entry points supply their tools; the shelf owns no organization logic. */
export function ToolsPage({tools,onDraftTask}: ToolProps & {tools:ToolDefinition[]}) {
  useEffect(()=>{
    const id=location.hash.slice(1);
    if(tools.some(tool=>tool.id===id)) document.getElementById(id)?.scrollIntoView({block:'start'});
  },[tools]);
  return <div className="workspace-tools">
    <div className="page-heading"><div><h1>Tools</h1><p>Explore a scenario. Turn the useful part into a task.</p></div></div>
    <nav className="tool-index" aria-label="Available tools">{tools.map(tool=><a key={tool.id} href={`#${tool.id}`}>{tool.title} ↓</a>)}</nav>
    {tools.map(({component:Component,...tool})=><section className="panel workspace-tool" id={tool.id} key={tool.id} aria-labelledby={`${tool.id}-title`}>
      <header><h2 id={`${tool.id}-title`}>{tool.title}</h2><p>{tool.description}</p></header>
      <Component onDraftTask={onDraftTask}/>
    </section>)}
  </div>;
}
