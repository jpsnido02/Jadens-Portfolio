import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { bySlug } from "./caseStudies"
import { visibleProjects, projectLabels, nextProjectSlug, projectSlug } from "./portfolioCatalog"
import ProjectCover from "./ProjectCover"
import ProjectEvidence from "./ProjectEvidence"
import StudyNavigation from "./StudyNavigation"
import StudyCredits from "./StudyCredits"
import BrandedEditorial, { BrandedOfferDetail } from "./BrandedEditorial"
import { SiteIcon } from "./icons"
import { useTheme } from "./useTheme"
import type { Palette, ThemeName } from "./theme"
import "./case-study-editorial.css"

export default function CaseStudyPage({ slug, embedded = false, appearance, playing = true }: { slug: string; embedded?: boolean; playing?: boolean; appearance?: { theme: ThemeName; palette: Palette } }) {
    const ownTheme = useTheme()
    const { theme, palette } = appearance ?? ownTheme
    const [motion, setMotion] = useState(true)
    const [enlargedMotion, setEnlargedMotion] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)
    const dialog = useRef<HTMLDialogElement>(null)
    const study = bySlug(slug)
    const project = visibleProjects.find(item => projectSlug(item.link) === slug)
    const active = playing && motion
    useEffect(() => { if (expanded && dialog.current && !dialog.current.open) dialog.current.showModal() }, [expanded])
    useEffect(() => { setExpanded(null); dialog.current?.close() }, [slug])
    const style = {"--study-bg":palette.background,"--study-ink":palette.text,"--study-muted":palette.textMuted,"--study-line":theme === "dark" ? "#383838" : "#e3e3e3","--study-surface":theme === "dark" ? "#1c1c1c" : "#f6f6f5"} as CSSProperties
    const chapters = useMemo(() => {
        if (slug === "branded-layouts") return [
            {id:"branded-opening",label:"Designs"},{id:"branded-overview",label:"Overview"},
            {id:"branded-system",label:"System"},{id:"branded-context",label:"Experience"},{id:"branded-outcome",label:"Impact"},
        ]
        const labels: Record<string,string> = {"Design decision":"Design","The design decision":"Design","Finding a recipe":"Recipes","Reading the map":"Structure","Motion design":"Motion"}
        return [{id:`${slug}-opening`,label:"Preview"},{id:`${slug}-overview`,label:"Overview"},
            ...(study?.blocks.flatMap((block,index) => block.kind === "section" ? [{id:`${slug}-section-${index}`,label:labels[block.label] ?? block.label.replace(/^The /i, "").split(" ")[0].replace(/^./, letter => letter.toUpperCase())}] : []) ?? []),
            ...(study?.blocks.some(block => block.kind === "takeaway") ? [{id:`${slug}-reflection`,label:"Reflection"}] : [])]
    }, [slug, study])
    if (!study || !project) return <main className="study-page" style={style}><a href="../../">Back to all work</a><h1>This project is not currently featured.</h1></main>
    const type = study.shape === "Iteration" ? "experiment" : study.shape === "System" ? "system" : "showcase"
    const abstract = study.blocks.find(block => block.kind === "abstract")
    const reflection = study.blocks.find(block => block.kind === "takeaway")
    const nextSlug = nextProjectSlug(slug)
    const next = bySlug(nextSlug)
    const isBranded = slug === "branded-layouts"
    const preview = <figure id={`${slug}-opening`} className="study-opening" aria-label={project.description}><div className="study-hero reader-hero"><ProjectCover project={project} index={visibleProjects.indexOf(project)} live={active}/><button type="button" className="study-expand" aria-label="Expand preview" aria-haspopup="dialog" onClick={() => setExpanded("project")}><SiteIcon name="expand" size={18}/></button></div></figure>
    return <main className={`study-page study-page--${type}${isBranded ? " study-page--branded" : ""}`} data-appearance={theme} style={style}>
        <StudyNavigation chapters={chapters}/>
        <div className="study-column">
            {!embedded && <div className="study-topbar"><a href="../../"><SiteIcon name="back" size={12}/> All work</a><div><button onClick={() => setMotion(value => !value)} aria-label={motion ? "Pause animations" : "Play animations"}><SiteIcon name={motion ? "pause" : "play"}/></button><button onClick={ownTheme.toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}><SiteIcon name={theme === "dark" ? "sun" : "moon"}/></button></div></div>}
            {isBranded ? <BrandedEditorial study={study} playing={active} demo={preview} onExpand={id => setExpanded(`branded:${id}`)}/> : <>
            {preview}
            <header id={`${slug}-overview`} className="study-masthead"><h1>{study.title}</h1><p className="study-summary">{study.result ?? study.preview}</p><StudyCredits study={study}/></header>
            {abstract?.kind === "abstract" && <p className="study-abstract">{abstract.text}</p>}
            <div className="study-story">{study.blocks.map((block,index) => {
                if (block.kind === "abstract") return null
                if (block.kind === "section") return <section key={index} id={`${slug}-section-${index}`} className="study-section"><div className="study-section-heading"><h2>{block.thesis ?? block.label}</h2></div>{block.body && <p>{block.body}</p>}</section>
                if (block.kind === "evidence") return <figure className="study-evidence" key={index} aria-label={block.caption}><ProjectEvidence name={block.name} playing={active}/></figure>
                if (block.kind === "takeaway") return null
                if (block.kind === "confidential") return <p key={index} className="study-disclosure">{block.text}</p>
                if (block.kind === "figure" && block.src) return <figure className="study-evidence" key={index} aria-label={block.caption}><button className="study-image-button" type="button" onClick={() => setExpanded(block.src!)} aria-label={`Expand ${block.alt ?? "project image"}`}><img src={block.src} alt={block.alt ?? ""} loading="lazy"/></button></figure>
                return null
            })}</div>
            {reflection?.kind === "takeaway" && <section id={`${slug}-reflection`} className="study-reflection"><h2>{reflection.title.replace(/^Takeaway:\s*/i, "")}</h2><p>{reflection.body}</p></section>}
            </>}
            {next && <a className="study-next" href={embedded ? `../${nextSlug}/` : `../${nextSlug}/`}><div><span>Next project</span><strong>{projectLabels[nextSlug] ?? next.title}</strong><p>{next.preview}</p></div><SiteIcon name="next" size={20}/></a>}
        </div>
        <dialog ref={dialog} className={`study-lightbox${expanded?.startsWith("branded:") ? " study-lightbox--offer" : ""}`} onClose={() => setExpanded(null)} aria-label="Expanded project preview"><div className="study-lightbox-toolbar">{expanded === "project" && <button type="button" className="study-lightbox-pause" onClick={() => setEnlargedMotion(value => !value)}><SiteIcon name={enlargedMotion ? "pause" : "play"} size={12}/>{enlargedMotion ? "Pause preview" : "Play preview"}</button>}<button className="study-lightbox-close" type="button" onClick={() => dialog.current?.close()} autoFocus><SiteIcon name="close" size={18}/> Close preview</button></div>{expanded === "project" ? <div className="study-lightbox-stage"><ProjectCover project={project} index={visibleProjects.indexOf(project)} live={active && enlargedMotion}/></div> : expanded?.startsWith("branded:") ? <BrandedOfferDetail id={expanded.slice(8)}/> : expanded && <img src={expanded} alt="Expanded project evidence"/>}</dialog>
    </main>
}
