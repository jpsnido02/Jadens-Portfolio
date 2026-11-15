import { useEffect, useRef, useState, type CSSProperties } from "react"
import { brainSilhouette, brainZones } from "./brainNetwork"
import "./thought-atlas.css"

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
function Minus() { return <svg className="atlas-icon" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14"/></svg> }
function Plus() { return <svg className="atlas-icon" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> }

function Brain() {
    return <>
        <path className="atlas-silhouette" d={SILHOUETTE}/>
        {COLLECTIONS.map((collection,zone)=><g key={collection.id} className={`atlas-region ${zone===0?"is-selected":""}`} data-collection={collection.id} data-node-count={ZONES[zone].files.length} style={{"--zone":collection.color} as CSSProperties}>
            <path className="atlas-structure-links" d={GEOMETRY[zone].structLinks}/>
            <path className="atlas-structure-dots" d={GEOMETRY[zone].structure}/>
            <path className="atlas-links" d={GEOMETRY[zone].fileLinks}/>
            <path className="atlas-nodes" d={GEOMETRY[zone].files}/>
            {ZONES[zone].files.filter((_,i)=>i%11===0).map(([x,y,r],i)=><circle key={i} className="atlas-activity-node" cx={x} cy={y} r={r} style={{animationDelay:`${-(zone*0.7+i*1.3)}s`,animationDuration:`${3.6+(i%3)*0.6}s`}}/>)}
        </g>)}
    </>
}

export default function ThoughtAtlas({playing}:{playing:boolean}) {
    const ref=useRef<HTMLDivElement>(null)
    const [scale,setScale]=useState(0)
    useEffect(()=>{const observer=new ResizeObserver(([entry])=>setScale(Math.min(entry.contentRect.width/800,entry.contentRect.height/600)));observer.observe(ref.current!);return()=>observer.disconnect()},[])
    return <div ref={ref} className={`atlas-study ${playing?"atlas-active":""}`} data-atlas-phase="overview">
        <div className="atlas-canvas" style={{transform:`translate(-50%,-50%) scale(${scale})`}}>
            <svg className="atlas-graph" viewBox="0 0 800 600" role="img" aria-label="A brain of six collections: 128 ideas, 64 projects, 32 reading notes, 16 personal notes, 8 clippings, and 4 archived files">
                <g className="atlas-world">
                    <Brain/>
                    <g className="atlas-map-labels">{COLLECTIONS.map((c,zone)=><g key={c.id} transform={`translate(${ZONES[zone].label[0]},${ZONES[zone].label[1]})`}><rect x="-45.5" y="-12.5" width="91" height="25" rx="4"/><text x="-35.5" y="3" fill={c.color}>{c.name} <tspan>{c.count}</tspan></text></g>)}</g>
                </g>
            </svg>
            <footer className="atlas-legend">{COLLECTIONS.map(c=><span key={c.id}><i style={{backgroundColor:c.color}}/>{c.name} <b>{c.count}</b></span>)}</footer>
            <div className="atlas-zoom-label">100% <span><Minus/><Plus/></span></div>
        </div>
    </div>
}
