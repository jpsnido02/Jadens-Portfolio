import { memo, useEffect, useRef, useState, type ReactNode } from "react"
import UberAdsLoop from "./UberAdsLoop"
import MacysBagLoop from "./MacysBagLoop"
import { AgentDashboard, ShoppableDashboard } from "./PortfolioWorkbench"
import BrandedLayoutsLoop from "./BrandedLayoutsLoop"
import { UberPreview, BrandedPreview } from "./GalleryPreviews"
import KalshiPreview from "./KalshiPreview"
import ConceptStudy from "./ConceptStudies"
import ExpediaComposition from "./ExpediaComposition"
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

function ProjectCover({ project, index, live = true, focused = false, replayKey = 0, interactive = false }: { project: ProjectData; index: number; live?: boolean; focused?: boolean; replayKey?: number; interactive?: boolean }) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)
    const [activated, setActivated] = useState(!focused)
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
    useEffect(() => {
        const mq = matchMedia("(prefers-reduced-motion: reduce)")
        const change = () => setReduced(mq.matches)
        mq.addEventListener("change", change)
        const observer = new IntersectionObserver(([entry]) => {
            setVisible(entry.isIntersecting)
            if (entry.isIntersecting) setActivated(true)
        }, { rootMargin: "80px" })
        observer.observe(ref.current!)
        return () => { observer.disconnect(); mq.removeEventListener("change", change) }
    }, [])
    const playing = live && visible && !reduced
    // Mount gallery demos only once they approach the viewport; keep visited demos
    // alive so returning from a case study does not reconstruct the whole gallery.
    if (!activated) return <div ref={ref} className="project-cover" aria-hidden="true" inert />
    const kind = project.component
    if (project.link?.includes("expedia-1p-3p")) return <div ref={ref} className="project-cover project-cover--expedia" aria-hidden="true" inert><ExpediaComposition /></div>
    if (kind === "kalshi-live") return <div ref={ref} className={`project-cover ${!playing ? "is-paused" : ""}`} aria-hidden={interactive ? undefined : true} inert={!interactive}><KalshiPreview playing={playing} interactive={interactive} /></div>
    if (kind === "pantry-notes" || kind === "thought-atlas" || kind === "build-view") return <div ref={ref} className={`project-cover personal-cover ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert><ConceptStudy kind={kind} playing={playing}/></div>
    if (kind === "partner-agent" || kind === "shoppable-config") return <div ref={ref} className={`project-cover ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert>{kind === "partner-agent" ? <AgentDashboard playing={playing} /> : <ShoppableDashboard playing={playing} /> }</div>
    if (focused && kind) return <div ref={ref} className={`project-cover focused-cover focus-${kind} ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert>
        {kind === "uber-loop" && <UberPreview playing={playing} />}
        {kind === "macys-bag" && <MacysBagLoop key={replayKey} gallery paused={!playing} />}
        {kind === "branded-shuffle" && <BrandedPreview playing={playing} />}
    </div>
    return <div ref={ref} className={`project-cover cover-${index} ${!playing ? "is-paused" : ""}`} aria-hidden="true" inert>
        {kind === "uber-loop" && <Stage kind="uber"><UberAdsLoop fit="contain" paused={!playing} /></Stage>}
        {kind === "macys-bag" && <Stage kind="macys"><MacysBagLoop paused={!playing} /></Stage>}
        {kind === "branded-shuffle" && <Stage kind="branded"><BrandedLayoutsLoop paused={!playing} ink="#171717" muted="#666666" accent="#171717" /></Stage>}
        {!kind && <div className="photo-composition"><picture>{project.imageMobile && <source media="(max-width:620px)" srcSet={project.imageMobile}/>}<img className="cover-photo" src={project.image.src} alt="" loading="lazy" /></picture></div>}
    </div>
}

export default memo(ProjectCover)
