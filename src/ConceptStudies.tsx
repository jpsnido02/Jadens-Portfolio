import { useEffect, useRef, useState, type ReactNode } from "react"
import "./concept-studies.css"
import PantryNotes from "./PantryNotes"
import ThoughtAtlas from "./ThoughtAtlas"
import BB8Assembly, { BB8Part } from "./BB8Assembly"

export type ConceptKind = "pantry-notes" | "thought-atlas" | "build-view"
function useSequence(durations: number[], playing: boolean, poster = 0) {
    const [phase, setPhase] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches ? poster : 0)
    useEffect(() => {
        if (!playing || matchMedia("(prefers-reduced-motion: reduce)").matches) return
        const timer = window.setTimeout(() => setPhase(p => (p + 1) % durations.length), durations[phase])
        return () => window.clearTimeout(timer)
    }, [phase, playing, durations])
    return phase
}
function StudyStage({ children, kind }: { children: ReactNode; kind: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setScale(Math.min(entry.contentRect.width / 800, entry.contentRect.height / 600)))
        observer.observe(ref.current!)
        return () => observer.disconnect()
    }, [])
    return <div ref={ref} className={`concept-study concept-${kind}`}><div className="study-canvas" style={{transform:`translate(-50%, -50%) scale(${scale})`}}>{children}</div></div>
}
const BUILD_TIMING=[2000,1100,3000,900]
function BuildView({playing}:{playing:boolean}) {
    const phase=useSequence(BUILD_TIMING,playing,2)
    const placed=phase===1 || phase===2
    return <StudyStage kind="build"><div className={`build-study build-phase-${phase}`}>
        <div className="build-manual-step"><span>STEP</span><strong>118</strong></div>
        <div className="build-parts-tray bb8-parts-tray"><div className={`${!placed?"is-active":"is-done"}`}><BB8Part/><b>1×</b><span className="build-part-check">✓</span></div></div>
        <BB8Assembly phase={phase}/>
        <div className={`build-success ${phase===2?"is-visible":""}`}><i>✓</i> Hello, BB-8. <span>✦</span></div>
        <div className="build-instruction"><span>{phase===2?"One little piece.":""}</span><strong>{phase===2?"Big personality.":"One tiny antenna tip."}</strong></div>
        <div className="build-back"><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg></div><div className={`build-next ${phase===2?"is-ready":""}`}><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></div><span className="build-page-number">BB-8 · 75452</span>
    </div></StudyStage>
}
export default function ConceptStudy({kind,playing=true}:{kind:ConceptKind;playing?:boolean}) {
    if(kind === "pantry-notes")return <PantryNotes playing={playing}/>
    if(kind === "thought-atlas")return <ThoughtAtlas playing={playing}/>
    return <BuildView playing={playing}/>
}
