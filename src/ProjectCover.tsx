import { useEffect, useRef, useState, type ReactNode } from "react"
import { AgentReviewScene } from "./ProjectEvidence"
import { UberContextPreview, BrandedCompactPreview, PantryCompactPreview, AtlasCompactPreview } from "./CompactDemos"
import UberAdsLoop from "./UberAdsLoop"
import MacysBagLoop from "./MacysBagLoop"
import { AgentDashboard, ShoppableDashboard } from "./PortfolioWorkbench"
import BrandedLayoutsLoop from "./BrandedLayoutsLoop"
import { UberPreview, MacysPreview, BrandedPreview } from "./GalleryPreviews"
import KalshiPreview from "./KalshiPreview"
import ConceptStudy from "./ConceptStudies"
import type { ProjectData } from "./PortfolioScroll"

/** Fit the complete prototype stage inside its frame without cropping. */
function Stage({ children, kind }: { children: ReactNode; kind: string }) {
    const ref = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)
    const canvasWidth = kind === "uber" ? 560 : 900
    const canvasHeight = kind === "config" ? 900 : 780
    useEffect(() => {
        const el = ref.current!
        const observer = new ResizeObserver(([entry]) => setScale(Math.min(entry.contentRect.width / canvasWidth, entry.contentRect.height / canvasHeight)))
        observer.observe(el)
        return () => observer.disconnect()
    }, [canvasWidth, canvasHeight])
    return <div ref={ref} className={`cover-stage cover-stage--${kind}`}>
        <div className="cover-canvas" style={{ width: canvasWidth, height: canvasHeight, transform: `translate(-50%, -50%) scale(${scale})` }}>{scale > 0 && children}</div>
    </div>
}

export default function ProjectCover({ project, index, live = true, focused = false, replayKey = 0 }: { project: ProjectData; index: number; live?: boolean; focused?: boolean; replayKey?: number; interactive?: boolean }) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)
    const [compact,setCompact] = useState(() => matchMedia("(max-width:720px)").matches)
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
    useEffect(() => {
        const mq = matchMedia("(prefers-reduced-motion: reduce)")
        const change = () => setReduced(mq.matches)
        mq.addEventListener("change", change)
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "80px" })
        observer.observe(ref.current!)
        const resize = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 620))
        resize.observe(ref.current!)
        return () => { observer.disconnect(); resize.disconnect(); mq.removeEventListener("change", change) }
    }, [])
    const playing = live && visible && !reduced
    const kind = project.component
    const small = focused || compact
    if (kind === "partner-agent" && small) return <div ref={ref} className={`project-cover compact-demo ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert><AgentReviewScene playing={playing} compact /></div>
    if (kind === "uber-loop" && small) return <div ref={ref} className="project-cover compact-demo" aria-hidden="true" inert><UberContextPreview playing={playing}/></div>
    if (kind === "branded-shuffle" && small) return <div ref={ref} className="project-cover compact-demo" aria-hidden="true" inert><BrandedCompactPreview/></div>
    if (kind === "thought-atlas" && small) return <div ref={ref} className="project-cover compact-demo" aria-hidden="true" inert><AtlasCompactPreview playing={playing}/></div>
    if (kind === "pantry-notes" && small) return <div ref={ref} className="project-cover compact-demo" aria-hidden="true" inert><PantryCompactPreview playing={playing}/></div>
    if (kind === "macys-bag") return <div ref={ref} className={`project-cover focused-cover focus-macys-bag ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert><MacysPreview key={replayKey} playing={playing}/></div>
    if (kind === "kalshi-live") return <div ref={ref} className={`project-cover ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert><KalshiPreview playing={playing} compact={small} /></div>
    if (kind === "pantry-notes" || kind === "thought-atlas" || kind === "build-view") return <div ref={ref} className={`project-cover personal-cover ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert><ConceptStudy kind={kind} playing={playing}/></div>
    if (kind === "partner-agent" || kind === "shoppable-config") return <div ref={ref} className={`project-cover ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert>{kind === "partner-agent" ? <AgentDashboard playing={playing} /> : <ShoppableDashboard playing={playing} /> }</div>
    if (focused && kind) return <div ref={ref} className={`project-cover focused-cover focus-${kind} ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert>
        {kind === "uber-loop" && <UberPreview playing={playing} />}
        {kind === "branded-shuffle" && <BrandedPreview playing={playing} />}
    </div>
    return <div ref={ref} className={`project-cover cover-${index} ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert>
        {kind === "uber-loop" && <Stage kind="uber"><UberAdsLoop fit="contain" camera={false} paused={!playing} /></Stage>}
        {kind === "branded-shuffle" && <Stage kind="branded"><BrandedLayoutsLoop paused={!playing} ink="#171717" muted="#666666" accent="#171717" /></Stage>}
        {!kind && <div className="photo-composition"><picture>{project.imageMobile && <source media="(max-width:620px)" srcSet={project.imageMobile}/>}<img className="cover-photo" src={project.image.src} alt="" loading="lazy" /></picture></div>}
    </div>
}
