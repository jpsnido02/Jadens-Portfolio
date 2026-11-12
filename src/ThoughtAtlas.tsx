import { useEffect, useRef, useState, type CSSProperties } from "react"
import { brainSilhouette, brainZones } from "./brainNetwork"
import useStudySequence from "./useStudySequence"
import "./thought-atlas.css"

const TIMING = [2300,1300,1500,2800,3900,1000,1500]
const COLLECTIONS = [
    {id:"ideas",name:"Ideas",count:128,color:"#b8a4fa"},
    {id:"projects",name:"Projects",count:64,color:"#edaa85"},
    {id:"reading",name:"Reading",count:32,color:"#91c0ac"},
    {id:"personal",name:"Personal",count:16,color:"#d5c28c"},
    {id:"clippings",name:"Clippings",count:8,color:"#91adc9"},
    {id:"archive",name:"Archive",count:4,color:"#b79fae"},
]
/** One lobe per collection: Ideas frontal, Projects parietal, Reading temporal, Personal occipital, Clippings cerebellum, Archive brain stem. */
const ZONES = COLLECTIONS.map(c => brainZones.find(z => z.key === c.id)!)
const f = (v:number) => v.toFixed(1)
const dots = (pts:number[][], r?:number) => pts.map(([x,y,pr]) => { const rr = r ?? pr; return `M${f(x-rr)} ${f(y)}a${rr} ${rr} 0 1 0 ${f(rr*2)} 0a${rr} ${rr} 0 1 0 ${f(-rr*2)} 0`}).join("")
const lines = (pts:number[][], pairs:[number,number][]) => pairs.map(([a,b]) => `M${f(pts[a][0])} ${f(pts[a][1])}L${f(pts[b][0])} ${f(pts[b][1])}`).join("")
const GEOMETRY = ZONES.map(z => {
    const all = (z.files as number[][]).concat(z.structure)
    return { files: dots(z.files), structure: dots(z.structure, .95), fileLinks: lines(z.files, z.fileLinks), structLinks: lines(all, z.structLinks) }
})
const SILHOUETTE = dots(brainSilhouette, .85)
const IDEAS = ZONES[0]
const IDEAS_HULL = IDEAS.poly.map(p => p.join(",")).join(" ")
/** Camera: the frontal lobe's centroid lands at (336, 373) at 215%. */
const ZOOM = 2.15
const ZOOM_X = 336 - IDEAS.centroid[0]*ZOOM, ZOOM_Y = 373 - IDEAS.centroid[1]*ZOOM
const RING = [IDEAS.centroid[0], IDEAS.centroid[1]-10]
const FILES = [
    {title:"Motion principles",kind:"MARKDOWN",meta:"12 connections · edited 2h ago",body:"Keep the object. Change its state. Let the eye follow the cause.",x:57,y:129},
    {title:"Type & rhythm",kind:"COLLECTION",meta:"14 studies · 5 linked notes",body:"Scales, line lengths, and the spacing that lets a page breathe.",x:425,y:152},
    {title:"Critique learnings",kind:"NOTE",meta:"9 connections · updated today",body:"Name the problem before proposing the fix.",x:134,y:355},
]
/** Neighbouring files in the zoomed lobe, labelled so the dots read as files. Design-adjacent sample topics. */
const NEIGHBORS = [
    {title:"Film editing & cuts",x:403,y:140,opacity:1},
    {title:"Wayfinding in architecture",x:545,y:412,opacity:.8},
    {title:"Behavioral nudges",x:461,y:462,opacity:.7},
]
/** The part of the 800×600 world visible at 215%, for the minimap viewport. */
const VIEW = { x:-ZOOM_X/ZOOM, y:-ZOOM_Y/ZOOM, w:800/ZOOM, h:600/ZOOM }

function ArrowUpRight({size=9}:{size?:number}) { return <svg className="atlas-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8.5 7H17v8.5"/></svg> }
function Close({size=11}:{size?:number}) { return <svg className="atlas-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg> }
function Command({size=11}:{size?:number}) { return <svg className="atlas-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3Z"/></svg> }
function Minus() { return <svg className="atlas-icon" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14"/></svg> }
function Plus() { return <svg className="atlas-icon" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> }

function Brain({mini=false}:{mini?:boolean}) {
    return <>
        <path className="atlas-silhouette" d={SILHOUETTE}/>
        {!mini && <polygon className="atlas-selected-area" points={IDEAS_HULL}/>}
        {COLLECTIONS.map((collection,zone)=><g key={collection.id} className={`atlas-region ${zone===0?"is-selected":""}`} data-collection={collection.id} data-node-count={ZONES[zone].files.length} style={{"--zone":collection.color} as CSSProperties}>
            <path className="atlas-structure-links" d={GEOMETRY[zone].structLinks}/>
            <path className="atlas-structure-dots" d={GEOMETRY[zone].structure}/>
            <path className="atlas-links" d={GEOMETRY[zone].fileLinks}/>
            <path className="atlas-nodes" d={GEOMETRY[zone].files}/>
        </g>)}
    </>
}

export default function ThoughtAtlas({playing}:{playing:boolean}) {
    const phase=useStudySequence(TIMING,playing,3)
    const selection=phase>=1&&phase<=5
    const zoomed=phase>=2&&phase<=5
    const cards=phase>=3&&phase<=5
    const open=phase===4
    const ref=useRef<HTMLDivElement>(null)
    const [scale,setScale]=useState(0)
    useEffect(()=>{const observer=new ResizeObserver(([entry])=>setScale(Math.min(entry.contentRect.width/800,entry.contentRect.height/600)));observer.observe(ref.current!);return()=>observer.disconnect()},[])
    return <div ref={ref} className={`atlas-study ${selection?"atlas-has-selection":""} ${zoomed?"atlas-is-zoomed":""} ${cards?"atlas-has-files":""} ${open?"atlas-document-open":""}`} data-atlas-phase={phase}>
        <div className="atlas-canvas" style={{transform:`translate(-50%,-50%) scale(${scale})`}}>
            <svg className="atlas-graph" viewBox="0 0 800 600" role="img" aria-label="A brain of six collections: 128 ideas, 64 projects, 32 reading notes, 16 personal notes, 8 clippings, and 4 archived files">
                <g className="atlas-world" style={{transform:zoomed?`translate(${ZOOM_X}px,${ZOOM_Y}px) scale(${ZOOM})`:"translate(0px,0px) scale(1)"}}>
                    <Brain/>
                    <g className="atlas-map-labels">{COLLECTIONS.map((c,zone)=><g key={c.id} transform={`translate(${ZONES[zone].label[0]},${ZONES[zone].label[1]})`}><rect x="-45.5" y="-12.5" width="91" height="25" rx="4"/><text x="-35.5" y="3" fill={c.color}>{c.name} <tspan>{c.count}</tspan></text></g>)}</g>
                    <circle className="atlas-selection-ring" cx={RING[0]} cy={RING[1]} r="72"/>
                </g>
            </svg>
            <div className="atlas-selection-caption"><span>SELECTED COLLECTION</span><strong>Ideas <b>128 files</b></strong><p>Follow the connections.</p></div>
            <div className="atlas-neighbors" aria-hidden="true">{NEIGHBORS.map((n,i)=><div key={n.title} className="atlas-neighbor" style={{left:n.x,top:n.y,"--neighbor-opacity":n.opacity,"--neighbor-delay":`${300+i*60}ms`} as CSSProperties}><i/><span>{n.title}<ArrowUpRight/></span></div>)}</div>
            <svg className="atlas-file-links" viewBox="0 0 800 600"><path d="M400 310 191 212M400 310 559 235M400 310 268 438"/><circle cx="400" cy="310" r="4"/></svg>
            <div className="atlas-files">{FILES.map((file,i)=><article key={file.title} className={`atlas-file ${i===0?"atlas-opening-file":""}`} style={{left:file.x,top:file.y,"--spawn-x":`${400-file.x-140}px`,"--spawn-y":`${310-file.y-78}px`,"--file-delay":`${i*110}ms`} as CSSProperties}><div><span>{file.kind}</span><i><ArrowUpRight size={14}/></i></div><h3>{file.title}</h3><p>{file.body}</p><footer>{file.meta}</footer></article>)}</div>
            <div className="atlas-scrim" aria-hidden="true"/>
            <div className="atlas-collection-bar"><span className="atlas-collection-count"><i/><b>IDEAS</b>3 of 128 shown</span><span className="atlas-browse">Browse all 128</span></div>
            <div className="atlas-minimap" aria-hidden="true">
                <svg viewBox="0 0 800 600"><g className="atlas-minimap-brain"><Brain mini/></g><rect className="atlas-minimap-view" x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} rx="12"/></svg>
                <span>215% · Ideas</span>
            </div>
            <article className="atlas-document"><div className="atlas-document-toolbar"><span className="atlas-document-path"><Command/>/ ideas / motion-principles.md</span><span className="atlas-document-actions"><ArrowUpRight size={11}/><Close/></span></div><div className="atlas-document-body"><span className="atlas-note-kicker">LINKED NOTE · 12 CONNECTIONS</span><h3>Motion principles</h3><p className="atlas-note-intro">Continuity makes a change feel inevitable.</p><h4>01 / Preserve the anchor</h4><p>Keep one element still while the next state arrives.<br/>The object stays recognizable through the change.</p><pre><span>const</span> transition = {'{'}<br/>  duration: <b>280</b>,<br/>  easing: <i>"easeOut"</i><br/>{'}'}</pre><div className="atlas-related"><span>RELATED</span><b>Type &amp; rhythm<ArrowUpRight/></b><b>Critique learnings<ArrowUpRight/></b></div></div></article>
            <footer className="atlas-legend">{COLLECTIONS.map(c=><span key={c.id}><i style={{backgroundColor:c.color}}/>{c.name} <b>{c.count}</b></span>)}</footer>
            <div className="atlas-zoom-label">{zoomed?"215%":"100%"} <span><Minus/><Plus/></span></div>
        </div>
    </div>
}
