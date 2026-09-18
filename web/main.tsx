import { createRoot } from "react-dom/client";
import { WorkspaceApp } from "./workspace";
import { ApplicationHeader } from "./design/application-header";
import { WorkspaceNavigation } from "./design/workspace-navigation";
import { BackgroundAtmosphere } from "./design/background-atmosphere";
import { initializeAppearance } from "./design/appearance-startup";
import "./design/themes.css";
import "./demo-shell.css";

const profile="LastResort";
const sections=[{id:"bridge",label:"Bridge"},{id:"council",label:"Council"},{id:"goals",label:"Goals"},{id:"tasks",label:"Tasks"},{id:"guestbook",label:"Organization"}];
function WorkspaceRoot() {
  const page=location.pathname.split("/")[2]||"bridge";
  const valid=/^\/lastresort(?:\/|$)/.test(location.pathname)&&sections.some(section=>section.id===page);
  document.title=`The Last Resort · ${sections.find(section=>section.id===page)?.label||"Not found"}`;
  return <><BackgroundAtmosphere/><div className="aubos-content-layer dashboard-shell single-level-navigation">
    <a className="skip-link" href="#workspace-main">Skip to content</a>
    <ApplicationHeader profile={profile} labels={{LastResort:"The Last Resort"}}><WorkspaceNavigation profile={profile} page={page} links={sections.map(section=>({...section,path:`/lastresort/${section.id}`}))}/></ApplicationHeader>
    <main className="view-frame" id="workspace-main" tabIndex={-1}>
      {valid?<WorkspaceApp profile={profile} page={page}/>:<section><h1>Page not found</h1><a href="/lastresort/bridge">Return to Bridge</a></section>}
    </main>
  </div></>;
}
initializeAppearance();
const root=document.getElementById("root");
if(root)createRoot(root).render(<WorkspaceRoot/>);
