import { memo, useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRotateRight, faBell, faBuilding, faChartColumn, faCheck, faChevronDown, faChevronLeft, faChevronRight, faCircleQuestion, faClipboardCheck, faEllipsis, faEnvelope, faExpand, faFileLines, faFilter, faGear, faGripVertical, faLayerGroup, faLightbulb, faList, faLock, faMagnifyingGlass, faMoon, faPlus, faShareNodes, faSliders, faSort, faStar, faTableColumns, faTableCellsLarge, faXmark } from "@fortawesome/free-solid-svg-icons"
import { faGoogleDrive } from "@fortawesome/free-brands-svg-icons"
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { RoktWordmark } from "./icons"
import "./agent-operations-demo.css"

const W=1440, H=1000, RAIL=52, SIDE=240, MAIN_X=RAIL+SIDE, BOARD_X=MAIN_X+18, BOARD_Y=38+172
const COL_W=267.5, COL_STEP=281.5, CARD_W=251.5, CARD_H=148, ROW_STEP=157, CARD_Y=BOARD_Y+50
const COLUMNS=["Queue","Building","For review","Complete"] as const
type Stage=typeof COLUMNS[number]
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
// Establish → arrive → pick up → drag → inspect/build → review → approve → drag to complete.
const DURATIONS=[650,1800,450,1100,400,1000,5200,1000,400,1100,1900,700,3200,450,1000,250,400,1100,2300,350,100]
const STARTS=DURATIONS.reduce<number[]>((a,d)=>[...a,a[a.length-1]+d],[0])
const TOTAL=STARTS[STARTS.length-1]
const clamp=(n:number)=>Math.max(0,Math.min(1,n))
const mix=(a:number,b:number,t:number)=>a+(b-a)*t
function ease(t:number) { t=clamp(t); return t*t*(3-2*t) }
function out(t:number) { return 1-Math.pow(1-clamp(t),3) }
function Icon({icon,size=14}:{icon:IconDefinition;size?:number}) {return <FontAwesomeIcon icon={icon} style={{width:size,height:size}} aria-hidden="true"/>}
function FigmaMark() {return <svg width="13" height="19" viewBox="0 0 38 57" aria-hidden="true"><path fill="#0acf83" d="M9.5 57A9.5 9.5 0 0 1 9.5 38H19v9.5A9.5 9.5 0 0 1 9.5 57Z"/><path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 1 9.5 19H19v19H9.5A9.5 9.5 0 0 1 0 28.5Z"/><path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 1 9.5 0H19v19H9.5A9.5 9.5 0 0 1 0 9.5Z"/><path fill="#ff7262" d="M19 0h9.5a9.5 9.5 0 0 1 0 19H19Z"/><circle fill="#1abcfe" cx="28.5" cy="28.5" r="9.5"/></svg>}
function ChatMark() {return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#34a853" d="M3 3h18v14H9l-6 5Z"/><path fill="#188038" d="M3 3h6v14l-6 5Z"/><path fill="#fff" d="M7 7h10v2H7zm0 4h7v2H7z"/></svg>}

// Shared optical weight and 24px grid; each mark describes its app's job.
function AppMark({kind}:{kind:"agents"|"brands"|"demos"}) {return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">{kind==="agents"?<>
 <path d="m4 19 8-15 8 15M7.5 13h9" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
 <circle cx="4" cy="19" r="2.3" fill="white"/><circle cx="20" cy="19" r="2.3" fill="white"/><circle cx="12" cy="4" r="2.3" fill="white"/>
 </>:kind==="brands"?<>
 <path d="M5 3h6a4 4 0 0 1 0 8H5V3Zm0 10h8a4 4 0 0 1 0 8H5v-8Z" fill="white"/>
 <path d="m18 2 1.3 2.7L22 6l-2.7 1.3L18 10l-1.3-2.7L14 6l2.7-1.3L18 2Z" fill="white"/>
 </>:<>
 <rect x="3" y="4" width="18" height="16" rx="3" stroke="white" strokeWidth="2.2"/>
 <path d="M3 8h18" stroke="white" strokeWidth="2"/><path d="m10 11 6 3.5-6 3.5v-7Z" fill="white"/>
 </>}</svg>}
const Shell=memo(function Shell(){return <>
 <div className="ado-browser"><span className="ado-lights"><i/><i/><i/></span><Icon icon={faTableColumns} size={12}/><Icon icon={faChevronLeft} size={10}/><Icon icon={faChevronRight} size={10}/><span className="ado-address"><Icon icon={faLock} size={8}/>design.rokt.demo/workspace<Icon icon={faArrowRotateRight} size={10}/></span><Icon icon={faPlus} size={12}/><Icon icon={faExpand} size={11}/></div>
 <div className="ado-rail"><span className="ado-rail-rokt" title="Rokt ecosystem"><RoktWordmark height={10}/></span><span className="ado-rail-app selected" title="Design Agents — automated design workflows"><AppMark kind="agents"/></span><span className="ado-rail-app" title="Brand Studio — partner brand systems"><AppMark kind="brands"/></span><span className="ado-rail-app" title="Demo Builder — commerce experience previews"><AppMark kind="demos"/></span><i/><span className="ado-rail-plus"><Icon icon={faPlus} size={19}/></span><span className="ado-rail-bottom"><Icon icon={faLightbulb} size={19}/><Icon icon={faMoon} size={19}/></span></div>
 <aside className="ado-sidebar">
  <div className="ado-product"><span className="ado-product-icon"><AppMark kind="agents"/></span><div><strong>Rokt</strong><span>Design Agents</span></div><Icon icon={faChevronLeft} size={13}/></div>

  <nav className="ado-nav"><span><Icon icon={faTableCellsLarge}/>Overview</span><span className="selected"><Icon icon={faTableColumns}/>Ticket queue</span><span><Icon icon={faFileLines}/>Brand systems</span><span><Icon icon={faEnvelope}/>Review inbox</span><span><Icon icon={faChartColumn}/>Build history</span></nav>
  <div className="ado-nav-group"><div className="ado-nav-group-title"><Icon icon={faChevronDown} size={10}/><span>Favorites</span><Icon icon={faEllipsis}/><Icon icon={faPlus} size={12}/></div><span><Icon icon={faBuilding}/>Account library<Icon icon={faStar} size={10}/></span><span><Icon icon={faLayerGroup}/>Brand guidelines<Icon icon={faStar} size={10}/></span><span><Icon icon={faClipboardCheck}/>Ready for review<Icon icon={faStar} size={10}/></span></div>
  <div className="ado-nav-group ado-projects"><div className="ado-nav-group-title"><Icon icon={faChevronRight} size={10}/><span>Projects</span><Icon icon={faEllipsis}/><Icon icon={faPlus} size={12}/></div></div>
  <nav className="ado-nav ado-nav-bottom"><span><Icon icon={faShareNodes}/>Integrations</span><span><Icon icon={faGear}/>Settings<Icon icon={faChevronRight} size={10}/></span><span><Icon icon={faCircleQuestion}/>Help center<Icon icon={faChevronRight} size={10}/></span></nav>
  <div className="ado-profile"><img src="/avatar.png" alt=""/><span><strong>Jaden Snyder</strong><small>Designer · reviewer</small></span><Icon icon={faChevronDown} size={12}/></div>
 </aside>
 <div className="ado-main-head"><span><Icon icon={faTableColumns} size={17}/>Ticket queue</span><div><i><Icon icon={faMagnifyingGlass}/></i><i><Icon icon={faShareNodes}/></i><i><Icon icon={faBell}/></i></div></div>
 <div className="ado-action-bar"><span className="ado-search"><Icon icon={faMagnifyingGlass} size={15}/>Search requests</span><span className="ado-control"><Icon icon={faGear}/>Agent settings</span><span className="ado-control">Imports / Export<Icon icon={faChevronDown} size={10}/></span><span className="ado-add"><Icon icon={faPlus}/>Add request<Icon icon={faChevronDown} size={11}/></span></div>
 <div className="ado-view-bar"><div className="ado-view-switch"><span><Icon icon={faList} size={12}/>List</span><span className="selected"><Icon icon={faTableColumns} size={12}/>Kanban</span><span><Icon icon={faChartColumn} size={12}/>Timeline</span></div><div><span className="ado-control"><Icon icon={faFilter} size={12}/>Filter</span><span className="ado-control"><Icon icon={faSort} size={12}/>Sort</span><span className="ado-control"><Icon icon={faSliders} size={12}/>Group<Icon icon={faChevronDown} size={10}/></span></div></div>
 </>})
const Ticket=memo(function Ticket({task,made,stage,click,press=0}:{task:Task;made:number;stage:Stage;click:boolean;press?:number}) {return <div className="ado-task" style={{transform:`scale(${1-press*.025})`}}>
 <div className="ado-task-brand"><img src={LOGOS[task.account]} alt={task.account}/><Icon icon={faEllipsis} size={13}/></div>
 <div className="ado-task-title">{task.title}</div><div className="ado-task-meta"><span>{task.owner}</span><i/><span>{task.due === "Today" ? "Due today" : task.due}</span></div>
 <div className="ado-task-footer"><span>Mock status <b>{made}<em>/{task.total}</em></b></span><span className={`ado-task-action ${stage === "For review"?"review":""}`}>{stage === "Queue" ? "Start build" : stage === "For review" ? "Review build" : "View build"}{click && <span className="uber-tap ado-tap"/>}</span></div>
 <div className="ado-progress"><span style={{transform:`scaleX(${made/task.total})`}}/></div>
 </div>})
function frame(time:number,size:{w:number;h:number}) {
 let phase=0;while(phase<DURATIONS.length-1&&time>=STARTS[phase+1])phase++
 const local=time-STARTS[phase],p=clamp(local/DURATIONS[phase])
 const present=phase>=1&&phase<=19
 const arrival=phase===1?out(local/850):present?1:0
 const occupancy=[0,0,0,0]
 let col=0,dragProgress=0,rotation=0,lift=0,held=false
 if(phase<=2){occupancy[0]=arrival;col=0}
 else if(phase===3){dragProgress=ease(p);occupancy[0]=1-dragProgress;occupancy[1]=dragProgress;col=dragProgress}
 else if(phase<=8){occupancy[1]=1;col=1}
 else if(phase===9){dragProgress=ease(p);occupancy[1]=1-dragProgress;occupancy[2]=dragProgress;col=1+dragProgress}
 else if(phase<=16){occupancy[2]=1;col=2}
 else if(phase===17){dragProgress=ease(p);occupancy[2]=1-dragProgress;occupancy[3]=dragProgress;col=2+dragProgress}
 else if(phase<=19){occupancy[3]=1;col=3}
 if([2,8,16].includes(phase)){held=true;rotation=-2.7*out(local/180);lift=-5*out(local/180)}
 if([3,9,17].includes(phase)){held=true;rotation=mix(-2.7,-.7,dragProgress);lift=-5-6*Math.sin(Math.PI*dragProgress)}
 if([4,10,18].includes(phase)){rotation=-.7*(1-out(local/220));lift=-5*(1-out(local/220))}
 const stage:Stage=phase<3||phase===20?"Queue":phase<9?"Building":phase<17?"For review":"Complete"
 const made=phase<6||phase===20?0:Math.min(14,Math.floor(Math.max(0,time-STARTS[6])/340))
 let zoom=0;if(phase===5)zoom=ease(p);else if(phase===6)zoom=1;else if(phase===7)zoom=1-ease(p)
 const compact=size.w>0&&size.w<500
 const base=Math.max(0,(size.w-48)/W)
 const s=compact?Math.max(0,(size.w-44)/CARD_W):base*mix(1,1.85,zoom)
 const anchor={x:BOARD_X+COL_STEP+8+CARD_W/2,y:CARD_Y+CARD_H/2}
 const wide={x:(size.w-W*base)/2,y:24},close={x:size.w/2-anchor.x*base*1.85,y:size.h/2-anchor.y*base*1.85}
 const tx=compact?size.w/2-(BOARD_X+8+col*COL_STEP+CARD_W/2)*s:mix(wide.x,close.x,zoom)
 const ty=compact?110-CARD_Y*s:mix(wide.y,close.y,zoom)
 const opacity=phase===19?1-ease(p):phase===20?0:phase===0?out(local/250):1
 const modal=phase>=12&&phase<=15,approved=phase>=14
 const modalIn=phase===12?out(local/280):phase===15?1-ease(local/220):1
 const modalScale=compact?Math.min(1,(size.w-36)/326,(size.h-36)/340):Math.min(1,(size.w-56)/710,(size.h-48)/520)
 const focalPress=phase===11?Math.sin(clamp(local/300)*Math.PI):0
 const focusX=BOARD_X+8+col*COL_STEP,focusY=CARD_Y+lift
 return {phase,local,p,present,arrival,occupancy,col,held,stage,made,compact,s,tx,ty,opacity,modal,approved,modalIn,modalScale,focalPress,focusX,focusY,rotation}
}
function useTimeline(playing:boolean,reduced:boolean,onFrame:(t:number)=>void) {
 const [time,setTime]=useState(()=>reduced?STARTS[10]+500:0)
 const clock=useRef(time), callback=useRef(onFrame);callback.current=onFrame
 useEffect(()=>{
  if(!playing||reduced)return
  let raf=0,last=performance.now(),signature=""
  const tick=(now:number)=>{clock.current=(clock.current+Math.min(now-last,80))%TOTAL;last=now;callback.current(clock.current);const f=frame(clock.current,{w:0,h:0});const next=`${f.phase}:${f.made}`;if(next!==signature){signature=next;setTime(clock.current)}raf=requestAnimationFrame(tick)}
  raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)
 },[playing,reduced])
 return time
}
export function AgentDashboard({playing,interactive:_interactive=false}:{playing:boolean;interactive?:boolean}) {
 const root=useRef<HTMLDivElement>(null)
 const [size,setSize]=useState({w:0,h:0})
 const [reduced,setReduced]=useState(()=>matchMedia("(prefers-reduced-motion: reduce)").matches)
 useEffect(()=>{const q=matchMedia("(prefers-reduced-motion: reduce)");const change=()=>setReduced(q.matches);q.addEventListener("change",change);return()=>q.removeEventListener("change",change)},[])
 useEffect(()=>{const ro=new ResizeObserver(([e])=>setSize({w:e.contentRect.width,h:e.contentRect.height}));ro.observe(root.current!);return()=>ro.disconnect()},[])
 const scene=useRef<HTMLDivElement>(null),focal=useRef<HTMLDivElement>(null),slots=useRef<(HTMLDivElement|null)[]>([]),modalLayer=useRef<HTMLDivElement>(null),modalBox=useRef<HTMLDivElement>(null)
 const elapsed=useTimeline(playing,reduced,t=>{
  const f=frame(t,size)
  if(scene.current){scene.current.style.transform=`matrix(${f.s},0,0,${f.s},${f.tx},${f.ty})`;scene.current.style.opacity=String(f.opacity)}
  slots.current.forEach((el,index)=>{if(!el)return;const task=TASKS[index],i=COLUMNS.indexOf(task.stage),row=TASKS.filter(t=>t.stage===task.stage).findIndex(t=>t.id===task.id);el.style.transform=`translate(${BOARD_X+8+i*COL_STEP}px,${CARD_Y+(row+f.occupancy[i])*ROW_STEP}px)`})
  if(focal.current){focal.current.style.transform=`translate(${f.focusX}px,${f.focusY+(f.phase===1?8*(1-f.arrival):0)}px) rotate(${f.rotation}deg)`;focal.current.style.opacity=String(f.arrival)}
  if(modalLayer.current)modalLayer.current.style.opacity=String(f.modalIn)
  if(modalBox.current)modalBox.current.style.transform=`scale(${f.modalScale*mix(.98,1,f.modalIn)}) translateY(${8*(1-f.modalIn)}px)`
 }),time=reduced?STARTS[10]+500:elapsed
 const f=frame(time,size)
 const {phase,local,p,present,arrival,occupancy,col,held,stage,made,compact,s,tx,ty,opacity,modal,approved,modalIn,modalScale,focalPress,focusX,focusY,rotation}=f

 return <div ref={root} className={`ado-stage ${compact?"ado-compact":""} ${!playing?"ado-paused":""}`} data-agent-phase={phase} data-agent-stage={stage} data-agent-mocks={made}>
  <div ref={scene} className="ado-scene" style={{width:W,height:H,opacity,transform:`matrix(${s},0,0,${s},${tx},${ty})`}}>
   <Shell/>
   <div className="ado-board" style={{left:BOARD_X,top:BOARD_Y,width:COL_W*4+14*3}}>
    {COLUMNS.map((name,i)=><div key={name} className={`ado-column ado-column-${i}`} style={{left:i*COL_STEP,width:COL_W}}><div className="ado-column-head"><Icon icon={faGripVertical} size={12}/><span className="ado-column-name">{name}</span><b>{TASKS.filter(t=>t.stage===name).length+(present&&Math.round(col)===i?1:0)}</b><Icon icon={faEllipsis} size={14}/><Icon icon={faPlus} size={14}/></div>{held&&[3,9,17].includes(phase)&&i===Math.ceil(col)&&<div className="ado-drop-slot" style={{height:CARD_H}}/>}</div>)}
   </div>
   {TASKS.map((task,index)=>{const i=COLUMNS.indexOf(task.stage),row=TASKS.filter(t=>t.stage===task.stage).findIndex(t=>t.id===task.id);return <div ref={el=>{slots.current[index]=el}} key={task.id} className="ado-ticket-slot" data-ticket={task.id} style={{width:CARD_W,height:CARD_H,transform:`translate(${BOARD_X+8+i*COL_STEP}px,${CARD_Y+(row+occupancy[i])*ROW_STEP}px)`}}><Ticket task={task} made={task.made} stage={task.stage} click={false}/></div>})}
   <div ref={focal} className={`ado-ticket-slot ado-focal ${held?"ado-held":""}`} data-ticket="DS-103" style={{width:CARD_W,height:CARD_H,opacity:arrival,transform:`translate(${focusX}px,${focusY+(phase===1?8*(1-arrival):0)}px) rotate(${rotation}deg)`,zIndex:held?10:3}}>
    <Ticket task={FOCAL} made={made} stage={stage} click={phase===11} press={focalPress}/>{held&&<span className="ado-grab"/>}
   </div>
  </div>
  {compact&&<div className="ado-mini-browser"><span className="ado-lights"><i/><i/><i/></span><span>Design Agents</span><Icon icon={faEllipsis} size={12}/></div>}
  {modal&&<div ref={modalLayer} className="ado-modal-layer" style={{opacity:modalIn}}><div className="ado-modal-backdrop"/><div ref={modalBox} className="ado-modal" role="img" aria-label="Shutterfly design review" style={{transform:`scale(${modalScale*mix(.98,1,modalIn)}) translateY(${8*(1-modalIn)}px)`}}>
   <div className="ado-modal-top"><img src={LOGOS.Shutterfly} alt="Shutterfly"/><span>DS-103</span><Icon icon={faXmark} size={15}/></div>
   <div className="ado-modal-title">Create photo book checkout designs</div><div className="ado-modal-sub">Requested by Elena Park<span>Due today</span></div>
   <div className="ado-review-stages">{COLUMNS.map((c,i)=><div key={c} className={i<2?"done":i===2?"current":""}><i/><span>{c}</span></div>)}</div>
   <div className="ado-review-summary"><div><span>Mock status</span><strong>14 / 14</strong></div><div><span>Build time</span><strong>5m 58s</strong></div><div><span>Brand system</span><strong>Shutterfly</strong></div></div>
   <div className="ado-review-links"><span><FigmaMark/>Figma</span><span><Icon icon={faGoogleDrive} size={17}/>Google Drive</span><span><ChatMark/>Google Chat</span></div>
   <div className="ado-review-checks"><div>Before you approve<span>3 checks completed</span></div><span><Icon icon={faCheck} size={12}/>Brand tokens match the account</span><span><Icon icon={faCheck} size={12}/>Responsive layouts reviewed</span><span><Icon icon={faCheck} size={12}/>Contrast and layout QA complete</span></div>
   <div className="ado-modal-footer"><span>Request changes</span><span className={`ado-approve ${approved?"approved":""}`}><Icon icon={faCheck} size={13}/>{approved?"Approved":"Approve build"}{phase===13&&<span className="uber-tap ado-tap"/>}</span></div>
  </div></div>}
 </div>
}