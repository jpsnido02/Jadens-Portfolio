import { useEffect, useRef, useState } from "react"
import UberOfferCard, { OFFERS } from "./UberOfferCard"
import useStudySequence from "./useStudySequence"
import { BrandedComparison } from "./ProjectEvidence"
import { SiteIcon } from "./icons"
import "./compact-demos.css"

const UBER_BEATS = [1600, 3200, 2600, 500]
export function UberContextPreview({ playing }: { playing: boolean }) {
    const phase = useStudySequence(UBER_BEATS, playing, 1)
    const root = useRef<HTMLDivElement>(null)
    const [scale,setScale] = useState(1)
    useEffect(() => {const observer=new ResizeObserver(([entry])=>setScale(Math.min((entry.contentRect.width-40)/358,1.35)));observer.observe(root.current!);return()=>observer.disconnect()},[])
    return <div ref={root} className="uber-context-preview" data-phase={phase} aria-hidden="true"><div className="uber-preview-context"><img src="/projects/icon-ubereats.svg" alt=""/><div><strong>Your breakfast is on its way.</strong><span>A little listening for the wait.</span></div></div><div className="uber-preview-card-space" style={{height:245*scale}}><div className="uber-preview-card" style={{width:358,transform:`scale(${scale})`}}><UberOfferCard offer={OFFERS[0]} index={0} px={value=>value} swapMs={420} animate={playing} tap={phase===2?"claim":null}/></div></div><div className="uber-preview-payoff"><SiteIcon name={phase===2?"check":"next"} size={12}/>{phase===2?"The customer chooses to listen":"Order context → relevant offer → clear action"}</div></div>
}
export function BrandedCompactPreview() { return <div className="branded-compact-preview" aria-hidden="true"><div className="brand-compact-heading"><strong>One offer. Different brands.</strong><span>Consistent structure · partner-specific design</span></div><BrandedComparison/></div> }
const PANTRY_BEATS=[1200,3200,4200,500]
export function PantryCompactPreview({playing}:{playing:boolean}) {
    const phase=useStudySequence(PANTRY_BEATS,playing,1)
    return <div className="pantry-compact" data-phase={phase} aria-hidden="true"><div className="pantry-compact-title"><span>pantry notes</span><strong>{phase===2?"From your haul to tonight’s dinner.":"Good ingredients. A little inspiration."}</strong></div><div className="pantry-compact-photo"><img src="/projects/pantry/grocery-haul.jpg" alt="A grocery haul"/><div className="pantry-compact-note"><span>20 min · for two</span><strong>Lemony<br/>spinach pasta</strong><small>{phase===2?"Your recipe":"Made with your ingredients"}</small></div><div className="pantry-compact-recipe"><span className="pantry-compact-tab">Lemony spinach pasta</span><strong>Dinner, already<br/>in your grocery haul.</strong><p>Fusilli · spinach · tomatoes · lemon</p><ol><li>Cook the pasta.</li><li>Soften tomatoes; fold in spinach.</li><li>Toss with lemon and cheese.</li></ol></div></div></div>
}
const ATLAS_BEATS=[1800,2000,4200,450]
export function AtlasCompactPreview({playing}:{playing:boolean}) {
    const phase=useStudySequence(ATLAS_BEATS,playing,2)
    return <div className="atlas-compact" data-phase={phase} aria-hidden="true"><img src="/projects/thought-atlas/network.svg" alt=""/><div className="atlas-compact-path">Thought Atlas <span>/ Ideas</span></div><div className="atlas-compact-collection"><span>IDEAS · CONNECTED NOTES</span><strong>Keep a thought.<br/>Follow its connections.</strong><div>Motion principles <SiteIcon name="next" size={12}/></div><div>Type & rhythm <SiteIcon name="next" size={12}/></div><div>Critique learnings <SiteIcon name="next" size={12}/></div></div><div className="atlas-compact-note"><span>IDEAS / MOTION-PRINCIPLES.MD</span><strong>Motion principles</strong><p>Continuity makes a change feel inevitable.</p><div>Keep one element still while the next state arrives. The object stays recognizable through the change.</div><small>Connected to Type & rhythm</small></div></div>
}
