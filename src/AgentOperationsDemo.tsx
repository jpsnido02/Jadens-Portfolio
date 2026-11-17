import { memo, useEffect, useLayoutEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBell, faBuilding, faChartColumn, faCheck, faChevronDown, faChevronLeft, faChevronRight, faCircleQuestion, faClipboardCheck, faEllipsis, faEnvelope, faExpand, faFileLines, faFilter, faGear, faGripVertical, faLayerGroup, faLightbulb, faList, faLock, faMagnifyingGlass, faMoon, faPlus, faShareNodes, faSliders, faSort, faStar, faTableColumns, faTableCellsLarge, faXmark } from "@fortawesome/free-solid-svg-icons"
import { faGoogleDrive } from "@fortawesome/free-brands-svg-icons"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { RoktWordmark } from "./icons"
import "./agent-operations-demo.css"
import { COLUMNS, GEOMETRY, TOTAL_MS, evaluateAgentWalkthrough, type Stage, type AgentWalkthroughFrame, type EntranceName } from "./AgentOperationsMotion"

const { W, H, BOARD_X, BOARD_Y, COL_W, COL_STEP, CARD_W, CARD_H, ROW_STEP, CARD_Y } = GEOMETRY
type Task={id:string; account:string; title:string; stage:Stage; made:number; total:number; due:string; owner:string}
const LOGOS:Record<string,string>={Shutterfly:"/projects/agent-logos/shutterfly.svg",OpenTable:"/projects/agent-logos/opentable.svg",eBay:"/projects/agent-logos/ebay.svg","Best Buy":"/projects/agent-logos/bestbuy.svg",Gap:"/projects/agent-logos/gap.svg"}
const FOCAL:Task={id:"DS-103",account:"Shutterfly",title:"Create photo book checkout designs",stage:"Queue",made:0,total:14,owner:"Elena Park",due:"Today"}
const TASKS:Task[]=[
 {id:"DS-104",account:"OpenTable",title:"Build reservation confirmation offers",stage:"Queue",made:0,total:18,owner:"Maya Chen",due:"Nov 18"},
 {id:"DS-100",account:"eBay",title:"Create order confirmation variants",stage:"Queue",made:0,total:24,owner:"Alex Rivera",due:"Nov 19"},

 {id:"DS-106",account:"Best Buy",title:"Refine protection plan placement",stage:"Building",made:8,total:18,owner:"Nina Patel",due:"Today"},



 {id:"DS-102",account:"eBay",title:"Review post-purchase offer designs",stage:"For review",made:30,total:30,owner:"Owen Brooks",due:"Today"},



 {id:"DS-101",account:"OpenTable",title:"Adapt dining rewards for mobile",stage:"Complete",made:30,total:30,owner:"Sam Taylor",due:"Nov 14"},



]
function Icon({icon,size=14}:{icon:IconDefinition;size?:number}) {return <FontAwesomeIcon icon={icon} style={{width:size,height:size}} aria-hidden="true"/>}
function FigmaMark() {return <svg width="13" height="19" viewBox="0 0 38 57" aria-hidden="true"><path fill="#0acf83" d="M9.5 57A9.5 9.5 0 0 1 9.5 38H19v9.5A9.5 9.5 0 0 1 9.5 57Z"/><path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 1 9.5 19H19v19H9.5A9.5 9.5 0 0 1 0 28.5Z"/><path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 1 9.5 0H19v19H9.5A9.5 9.5 0 0 1 0 9.5Z"/><path fill="#ff7262" d="M19 0h9.5a9.5 9.5 0 0 1 0 19H19Z"/><circle fill="#1abcfe" cx="28.5" cy="28.5" r="9.5"/></svg>}
function ChatMark() {return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#34a853" d="M3 3h18v14H9l-6 5Z"/><path fill="#188038" d="M3 3h6v14l-6 5Z"/><path fill="#fff" d="M7 7h10v2H7zm0 4h7v2H7z"/></svg>}

// Shared optical weight and 24px grid; each mark describes its app's job.
function AppMark({kind}:{kind:"agents"|"brands"|"demos"}) {return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">{kind==="agents"?<>
 <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="1.8"/>
 <path d="m12 5 1.9 5.1L19 12l-5.1 1.9L12 19l-1.9-5.1L5 12l5.1-1.9L12 5Z" fill="white"/>
 </>:kind==="brands"?<>
 <rect x="3" y="3" width="12" height="14" rx="1.5" stroke="white" strokeWidth="1.8"/>
 <rect x="9" y="7" width="12" height="14" rx="1.5" fill="white"/>
 <path d="M12 11h6M12 14h6" stroke="#6265df" strokeWidth="1.5" strokeLinecap="round"/>
 </>:<>
 <rect x="3" y="4" width="18" height="16" rx="3" stroke="white" strokeWidth="2.2"/>
 <path d="M3 8h18" stroke="white" strokeWidth="2"/><path d="m10 11 6 3.5-6 3.5v-7Z" fill="white"/>
 </>}</svg>}
// Safari frame adapted from Eren's Safari Desktop and Mobile Browser (CC BY 4.0).
// https://www.figma.com/community/file/881126482834000423/safari-desktop-and-mobile-browser
// Recreated in SVG/CSS; address and dimensions adapted to this demo.
function SafariGlyph({kind}:{kind:"sidebar"|"back"|"forward"|"shield"|"share"|"tabs"|"reload"|"plus"}) {return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind==="sidebar"?<><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M9 5v14"/></>:kind==="back"?<path d="m14 5-7 7 7 7"/>:kind==="forward"?<path d="m10 5 7 7-7 7"/>:kind==="shield"?<><path d="M12 3 5 5v6c0 5 7 10 7 10s7-5 7-10V5l-7-2Z"/><path d="M12 3v18c-3-2-7-6-7-10V5l7-2Z" fill="currentColor" stroke="none"/></>:kind==="share"?<><path d="M8 9H5v12h14V9h-3M12 15V2m-4 4 4-4 4 4"/></>:kind==="tabs"?<><rect x="7" y="3" width="14" height="14" rx="1.5"/><path d="M17 17v4H3V7h4"/></>:kind==="reload"?<><path d="M18.5 7a8 8 0 1 0 1 9M16 3l4 4-4 4M20 7h-8"/></>:<path d="M12 4v16M4 12h16"/>}</svg>}
const Shell=memo(function Shell(){return <>
 <div className="ado-browser"><span className="ado-lights"><i/><i/><i/></span><span className="ado-safari-nav"><SafariGlyph kind="sidebar"/><SafariGlyph kind="back"/><SafariGlyph kind="forward"/></span><span className="ado-safari-privacy"><SafariGlyph kind="shield"/></span><span className="ado-address"><span><Icon icon={faLock} size={10}/>https://design.rokt.demo</span><SafariGlyph kind="reload"/></span><span className="ado-safari-tools"><SafariGlyph kind="share"/><SafariGlyph kind="plus"/><SafariGlyph kind="tabs"/></span></div>
 <div className="ado-entry-group ado-side-group" data-entrance="side"><div className="ado-rail"><span className="ado-rail-rokt" title="Rokt ecosystem"><RoktWordmark height={10}/></span><span className="ado-rail-app selected" title="Design Agents — automated design workflows"><AppMark kind="agents"/></span><span className="ado-rail-app" title="Brand Studio — partner brand systems"><AppMark kind="brands"/></span><span className="ado-rail-app" title="Demo Builder — commerce experience previews"><AppMark kind="demos"/></span><i/><span className="ado-rail-plus"><Icon icon={faPlus} size={19}/></span><span className="ado-rail-bottom"><Icon icon={faLightbulb} size={19}/><Icon icon={faMoon} size={19}/></span></div>
 <aside className="ado-sidebar">
  <div className="ado-product"><span className="ado-product-icon"><AppMark kind="agents"/></span><div><strong>Rokt</strong><span>Design Agents</span></div><Icon icon={faChevronLeft} size={13}/></div>

  <nav className="ado-nav"><span><Icon icon={faTableCellsLarge}/>Overview</span><span className="selected"><Icon icon={faTableColumns}/>Ticket queue</span><span><Icon icon={faFileLines}/>Brand systems</span><span><Icon icon={faEnvelope}/>Review inbox</span><span><Icon icon={faChartColumn}/>Build history</span></nav>
  <div className="ado-nav-group"><div className="ado-nav-group-title"><Icon icon={faChevronDown} size={10}/><span>Favorites</span><Icon icon={faEllipsis}/><Icon icon={faPlus} size={12}/></div><span><Icon icon={faBuilding}/>Account library<Icon icon={faStar} size={10}/></span><span><Icon icon={faLayerGroup}/>Brand guidelines<Icon icon={faStar} size={10}/></span><span><Icon icon={faClipboardCheck}/>Ready for review<Icon icon={faStar} size={10}/></span></div>
  <div className="ado-nav-group ado-projects"><div className="ado-nav-group-title"><Icon icon={faChevronRight} size={10}/><span>Projects</span><Icon icon={faEllipsis}/><Icon icon={faPlus} size={12}/></div></div>
  <nav className="ado-nav ado-nav-bottom"><span><Icon icon={faShareNodes}/>Integrations</span><span><Icon icon={faGear}/>Settings<Icon icon={faChevronRight} size={10}/></span><span><Icon icon={faCircleQuestion}/>Help center<Icon icon={faChevronRight} size={10}/></span></nav>
  <div className="ado-profile"><img src="/avatar.png" alt=""/><span><strong>Jaden Snyder</strong><small>Designer · reviewer</small></span><Icon icon={faChevronDown} size={12}/></div>
 </aside></div>
 <div className="ado-entry-group ado-controls-group" data-entrance="controls"><div className="ado-main-head"><span><Icon icon={faTableColumns} size={17}/>Ticket queue</span><div><i><Icon icon={faMagnifyingGlass}/></i><i><Icon icon={faShareNodes}/></i><i><Icon icon={faBell}/></i></div></div>
 <div className="ado-action-bar"><span className="ado-search"><Icon icon={faMagnifyingGlass} size={15}/>Search requests</span><span className="ado-control"><Icon icon={faGear}/>Agent settings</span><span className="ado-control">Imports / Export<Icon icon={faChevronDown} size={10}/></span><span className="ado-add"><Icon icon={faPlus}/>Add request<Icon icon={faChevronDown} size={11}/></span></div>
 <div className="ado-view-bar"><div className="ado-view-switch"><span><Icon icon={faList} size={12}/>List</span><span className="selected"><Icon icon={faTableColumns} size={12}/>Kanban</span><span><Icon icon={faChartColumn} size={12}/>Timeline</span></div><div><span className="ado-control"><Icon icon={faFilter} size={12}/>Filter</span><span className="ado-control"><Icon icon={faSort} size={12}/>Sort</span><span className="ado-control"><Icon icon={faSliders} size={12}/>Group<Icon icon={faChevronDown} size={10}/></span></div></div>
 </div></>})
const Ticket=memo(function Ticket({task,made,stage,click,pressScale=1,progress=made/task.total}:{task:Task;made:number;stage:Stage;click:boolean;pressScale?:number;progress?:number}) {return <div className="ado-task" style={{transform:`scale(${pressScale})`}}>
 <div className="ado-task-brand"><img src={LOGOS[task.account]} alt={task.account}/><Icon icon={faEllipsis} size={13}/></div>
 <div className="ado-task-title">{task.title}</div><div className="ado-task-meta"><span>{task.owner}</span><i/><span>{task.due === "Today" ? "Due today" : task.due}</span></div>
 <div className="ado-task-footer"><span>Mock status <b>{made}<em>/{task.total}</em></b></span><span className={`ado-task-action ${stage === "For review"?"review":""}`}>{stage === "Queue" ? "Start build" : stage === "For review" ? "Review build" : "View build"}{click && <span className="uber-tap ado-tap"/>}</span></div>
 <div className="ado-progress"><span style={{transform:`scaleX(${progress})`}}/></div>
 </div>})
/** One retained clock; style updates do not go through React's render cycle. */
function useTimeline(playing:boolean,reduced:boolean,onFrame:(time:number)=>string) {
 const clock=useRef(0), callback=useRef(onFrame), lastRenderKey=useRef("")
 const [,rerender]=useState(0)
 callback.current=onFrame
 useEffect(()=>{
  if(!playing||reduced)return
  let raf=0,last=performance.now()
  const tick=(now:number)=>{
   clock.current=(clock.current+Math.min(Math.max(0,now-last),80))%TOTAL_MS;last=now
   const key=callback.current(clock.current)
   if(key!==lastRenderKey.current){lastRenderKey.current=key;rerender(n=>n+1)}
   raf=requestAnimationFrame(tick)
  }
  raf=requestAnimationFrame(tick)
  return()=>cancelAnimationFrame(raf)
 },[playing,reduced])
 return clock
}
export function AgentDashboard({playing,interactive:_interactive=false}:{playing:boolean;interactive?:boolean}) {
 const root=useRef<HTMLDivElement>(null),scene=useRef<HTMLDivElement>(null),focal=useRef<HTMLDivElement>(null)
 const modalLayer=useRef<HTMLDivElement>(null),modalBox=useRef<HTMLDivElement>(null),approveButton=useRef<HTMLSpanElement>(null)
 const hoverFill=useRef<HTMLSpanElement>(null), confirmation=useRef<HTMLSpanElement>(null), approveLabel=useRef<HTMLSpanElement>(null)
 const slots=useRef<(HTMLDivElement|null)[]>([])
 const groups=useRef<{node:HTMLElement;name:EntranceName}[]>([])
 const parts=useRef<{fill:HTMLElement|null;card:HTMLElement|null;contact:HTMLElement|null;shadow:HTMLElement|null}>({fill:null,card:null,contact:null,shadow:null})
 const [size,setSize]=useState({w:0,h:0})
 const [reduced,setReduced]=useState(()=>matchMedia("(prefers-reduced-motion: reduce)").matches)
 useEffect(()=>{const q=matchMedia("(prefers-reduced-motion: reduce)");const change=()=>setReduced(q.matches);q.addEventListener("change",change);return()=>q.removeEventListener("change",change)},[])
 useEffect(()=>{const ro=new ResizeObserver(([e])=>setSize({w:e.contentRect.width,h:e.contentRect.height}));ro.observe(root.current!);return()=>ro.disconnect()},[])
 useLayoutEffect(()=>{
  groups.current=Array.from(scene.current?.querySelectorAll<HTMLElement>("[data-entrance]")??[]).map(node=>({node,name:node.dataset.entrance as EntranceName}))
  parts.current={fill:focal.current?.querySelector(".ado-progress>span")??null,card:focal.current?.querySelector(".ado-task")??null,contact:focal.current?.querySelector(".ado-grab")??null,shadow:focal.current?.querySelector(".ado-lift-shadow")??null}
 },[])
 const apply=(f:AgentWalkthroughFrame)=>{
  const {camera:c,cardPose:p}=f
  if(root.current){root.current.dataset.agentBeat=f.beat;root.current.dataset.agentTime=String(f.time)}
  if(scene.current){scene.current.style.transform=`matrix(${c.s},0,0,${c.s},${c.tx},${c.ty})`;scene.current.style.opacity=String(f.sceneOpacity)}
  for(const {node,name} of groups.current){const e=f.entrances[name];node.style.transform=`translateY(${e.y}px)`;node.style.opacity=String(e.opacity)}
  slots.current.forEach((node,index)=>{if(!node)return;const task=TASKS[index],column=COLUMNS.indexOf(task.stage),row=TASKS.filter(t=>t.stage===task.stage).findIndex(t=>t.id===task.id);node.style.transform=`translate(${BOARD_X+8+column*COL_STEP}px,${CARD_Y+(row+f.columnOccupancy[column])*ROW_STEP}px)`})
  if(focal.current){focal.current.style.transform=`translate(${p.x}px,${p.y}px) rotate(${p.rotation}deg) scale(${p.scale})`;focal.current.style.opacity=String(f.cardOpacity)}
  const n=parts.current
  if(n.card)n.card.style.transform=`scale(${f.cardPressScale})`
  if(n.fill)n.fill.style.transform=`scaleX(${f.buildProgress})`
  if(n.contact)n.contact.style.opacity=String(f.contactOpacity)
  if(n.shadow)n.shadow.style.opacity=String(f.shadowOpacity)
  if(modalLayer.current)modalLayer.current.style.opacity=String(f.modal.opacity)
  if(modalBox.current)modalBox.current.style.transform=`translateY(${f.modal.y}px) scale(${f.modal.scale*f.modal.scaleMultiplier})`
  if(approveButton.current)approveButton.current.style.transform=`scale(${f.modal.approveScale})`
  if(hoverFill.current)hoverFill.current.style.opacity=String(f.modal.approveHover)
  if(approveLabel.current)approveLabel.current.style.opacity=String(1-f.modal.confirmation)
  if(confirmation.current)confirmation.current.style.opacity=String(f.modal.confirmation)
 }
 const clock=useTimeline(playing,reduced,time=>{const next=evaluateAgentWalkthrough(time,size);apply(next);return next.renderKey})
 const f=evaluateAgentWalkthrough(clock.current,size,reduced)
 // Reapply the current clock after semantic React commits so a stale milestone never rewinds a transform.
 useLayoutEffect(()=>apply(evaluateAgentWalkthrough(clock.current,size,reduced)))
 const entranceStyle=(name:EntranceName)=>({transform:`translateY(${f.entrances[name].y}px)`,opacity:f.entrances[name].opacity})
 const columnEntrances:EntranceName[]=["queue","building","review","complete"]
 const p=f.cardPose,c=f.camera
 return <div ref={root} className={`ado-stage ${f.compact?"ado-compact":""} ${!playing?"ado-paused":""}`} data-agent-phase={f.phase} data-agent-beat={f.beat} data-agent-stage={f.stage} data-agent-mocks={f.made}>
  <div ref={scene} className="ado-scene" style={{width:W,height:H,opacity:f.sceneOpacity,transform:`matrix(${c.s},0,0,${c.s},${c.tx},${c.ty})`}}>
   <Shell/>
   {COLUMNS.map((name,i)=><div className="ado-entry-group ado-column-track" key={name} data-entrance={columnEntrances[i]} style={entranceStyle(columnEntrances[i])}>
    <div className={`ado-column ado-column-${i}`} style={{left:BOARD_X+i*COL_STEP,top:BOARD_Y,width:COL_W,height:772}}>
     <div className="ado-column-head"><Icon icon={faGripVertical} size={12}/><span className="ado-column-name">{name}</span><b>{TASKS.filter(t=>t.stage===name).length+(f.present&&COLUMNS.indexOf(f.stage)===i?1:0)}</b><Icon icon={faEllipsis} size={14}/><Icon icon={faPlus} size={14}/></div>
     {f.dropTarget===i&&<div className="ado-drop-slot" style={{height:CARD_H}}/>}
    </div>
    {TASKS.map((task,index)=>{if(task.stage!==name)return null;const row=TASKS.filter(t=>t.stage===name).findIndex(t=>t.id===task.id);return <div ref={node=>{slots.current[index]=node}} key={task.id} className="ado-ticket-slot" data-ticket={task.id} style={{width:CARD_W,height:CARD_H,transform:`translate(${BOARD_X+8+i*COL_STEP}px,${CARD_Y+(row+f.columnOccupancy[i])*ROW_STEP}px)`}}><Ticket task={task} made={task.made} stage={task.stage} click={false}/></div>})}
   </div>)}
   <div ref={focal} className={`ado-ticket-slot ado-focal ${f.held?"ado-held":""}`} data-ticket="DS-103" style={{width:CARD_W,height:CARD_H,opacity:f.cardOpacity,transformOrigin:`${GEOMETRY.GRIP_X}px ${GEOMETRY.GRIP_Y}px`,transform:`translate(${p.x}px,${p.y}px) rotate(${p.rotation}deg) scale(${p.scale})`,zIndex:10}}>
    <Ticket task={FOCAL} made={f.made} stage={f.stage} progress={f.buildProgress} click={f.reviewRippleVisible} pressScale={f.cardPressScale}/><span className="ado-lift-shadow" style={{opacity:f.shadowOpacity}}/><span className="ado-grab" style={{opacity:f.contactOpacity}}/>
   </div>
  </div>
  {f.compact&&<div className="ado-mini-browser"><span className="ado-lights"><i/><i/><i/></span><span>Design Agents</span><Icon icon={faEllipsis} size={12}/></div>}
  {f.modal.visible&&<div ref={modalLayer} className="ado-modal-layer" style={{opacity:f.modal.opacity}}><div className="ado-modal-backdrop"/><div ref={modalBox} className="ado-modal" role="img" aria-label="Shutterfly design review" style={{transform:`translateY(${f.modal.y}px) scale(${f.modal.scale*f.modal.scaleMultiplier})`}}>
   <div className="ado-modal-top"><img src={LOGOS.Shutterfly} alt="Shutterfly"/><span>DS-103</span><Icon icon={faXmark} size={15}/></div>
   <div className="ado-modal-title">Create photo book checkout designs</div><div className="ado-modal-sub">Requested by Elena Park<span>Due today</span></div>
   <div className="ado-review-stages">{COLUMNS.map((column,i)=><div key={column} className={i<2?"done":i===2?"current":""}><i/><span>{column}</span></div>)}</div>
   <div className="ado-review-summary"><div><span>Mock status</span><strong>14 / 14</strong></div><div><span>Build time</span><strong>5m 58s</strong></div><div><span>Brand system</span><strong>Shutterfly</strong></div></div>
   <div className="ado-review-links"><span><FigmaMark/>Figma</span><span><Icon icon={faGoogleDrive} size={17}/>Google Drive</span><span><ChatMark/>Google Chat</span></div>
   <div className="ado-review-checks"><div>Before you approve<span>3 checks completed</span></div><span><Icon icon={faCheck} size={12}/>Brand tokens match the account</span><span><Icon icon={faCheck} size={12}/>Responsive layouts reviewed</span><span><Icon icon={faCheck} size={12}/>Contrast and layout QA complete</span></div>
   <div className="ado-modal-footer"><span>Request changes</span><span ref={approveButton} className="ado-approve" data-approved={f.modal.approved}>
    <span ref={hoverFill} className="ado-approve-hover" aria-hidden="true"/>
    <span ref={approveLabel} className="ado-approve-label" aria-hidden={f.modal.approved}>Approve build</span>
    <span ref={confirmation} className="ado-approve-success" aria-hidden={!f.modal.approved}><Icon icon={faCheck} size={13}/>Approved</span>
    {f.approveRippleVisible&&<span className="uber-tap ado-tap"/>}
   </span></div>
  </div></div>}
 </div>
}
