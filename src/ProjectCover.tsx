import { useEffect, useRef, useState, type ReactNode } from "react"
import UberAdsLoop from "./UberAdsLoop"
import MacysBagLoop from "./MacysBagLoop"
import { AgentDashboard, ShoppableDashboard } from "./PortfolioWorkbench"
import BrandedLayoutsLoop from "./BrandedLayoutsLoop"
import { UberPreview, MacysPreview, BrandedPreview } from "./GalleryPreviews"
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

export default function ProjectCover({ project, index, live = true, focused = false, replayKey = 0, interactive = false }: { project: ProjectData; index: number; live?: boolean; focused?: boolean; replayKey?: number; interactive?: boolean }) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
    useEffect(() => {
        const mq = matchMedia("(prefers-reduced-motion: reduce)")
        const change = () => setReduced(mq.matches)
        mq.addEventListener("change", change)
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "80px" })
        observer.observe(ref.current!)
        return () => { observer.disconnect(); mq.removeEventListener("change", change) }
    }, [])
    const playing = live && visible && !reduced
    const kind = project.component
    if (kind === "pantry-notes" || kind === "thought-atlas" || kind === "build-view") return <div ref={ref} className={`project-cover personal-cover ${!playing ? "is-paused" : ""}`} aria-hidden="true"><ConceptStudy kind={kind} playing={playing}/></div>
    if (kind === "partner-agent" || kind === "shoppable-config") return <div ref={ref} className={`project-cover ${!playing ? "is-paused" : ""}`} aria-hidden={interactive ? undefined : true}>{kind === "partner-agent" ? <AgentDashboard playing={playing} interactive={interactive} /> : <ShoppableDashboard playing={playing} interactive={interactive} />}</div>
    if (focused && kind) return <div ref={ref} className={`project-cover focused-cover focus-${kind} ${!playing ? "is-paused" : ""}`} aria-hidden="true">
        {kind === "uber-loop" && <UberPreview playing={playing} />}
        {kind === "macys-bag" && <MacysPreview key={replayKey} playing={playing} />}
        {kind === "branded-shuffle" && <BrandedPreview playing={playing} />}
    </div>
    return <div ref={ref} className={`project-cover cover-${index} ${!playing ? "is-paused" : ""}`} aria-hidden="true">
        {kind === "uber-loop" && <Stage kind="uber"><UberAdsLoop fit="contain" camera={false} paused={!playing} /></Stage>}
        {kind === "macys-bag" && <Stage kind="macys"><MacysBagLoop paused={!playing} /></Stage>}
        {kind === "branded-shuffle" && <Stage kind="branded"><BrandedLayoutsLoop paused={!playing} ink="#171717" muted="#666666" accent="#171717" /></Stage>}
        {!kind && <div className="photo-composition"><img className="cover-photo" src={project.image.src} alt="" loading="lazy" /></div>}
    </div>
}
