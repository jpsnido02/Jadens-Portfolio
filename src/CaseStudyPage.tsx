import { useEffect, useRef, useState, type CSSProperties } from "react"
import { bySlug, type Block } from "./caseStudies"
import { visibleProjects, projectLabels, nextProjectSlug, projectSlug } from "./portfolioCatalog"
import ProjectCover from "./ProjectCover"
import ProjectEvidence from "./ProjectEvidence"
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
    if (!study || !project) return <main className="study-page" style={style}><a href="../../">Back to all work</a><h1>This project is not currently featured.</h1></main>
    const sections = study.blocks.flatMap((block,index) => block.kind === "section" ? [{label:block.label,index}] : [])
    const type = study.shape === "Iteration" ? "experiment" : study.shape === "System" ? "system" : "showcase"
    const abstract = study.blocks.find(block => block.kind === "abstract")
    const reflection = study.blocks.find(block => block.kind === "takeaway")
    const nextSlug = nextProjectSlug(slug)
    const next = bySlug(nextSlug)
    return <main className={`study-page study-page--${type}`} style={style}>
        <div className="study-column">
            {!embedded && <div className="study-topbar"><a href="../../"><SiteIcon name="back" size={12}/> All work</a><div><button onClick={() => setMotion(value => !value)} aria-label={motion ? "Pause animations" : "Play animations"}><SiteIcon name={motion ? "pause" : "play"}/></button><button onClick={ownTheme.toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}><SiteIcon name={theme === "dark" ? "sun" : "moon"}/></button></div></div>}
            <header className="study-masthead"><h1>{study.title}</h1><p className="study-summary">{study.preview}</p><dl className="study-facts"><div><dt>My role</dt><dd>{study.role}</dd></div><div><dt>Result / status</dt><dd>{study.result ?? study.status ?? "Personal design concept"}</dd></div></dl><p className="study-scope">{study.status ?? (study.client === "Personal concept" ? "Personal concept · interaction and visual design" : study.client)}{study.year && ` · ${study.year}`}</p></header>
            <figure className="study-opening"><div className="study-hero reader-hero"><ProjectCover project={project} index={visibleProjects.indexOf(project)} live={active}/></div><div className="study-figure-tools"><figcaption>{project.description}</figcaption><button type="button" onClick={() => setExpanded("project")}><SiteIcon name="search" size={12}/> Expand preview</button></div></figure>
            {abstract?.kind === "abstract" && <p className="study-abstract">{abstract.text}</p>}
            {sections.length > 1 && <nav className="study-chapters" aria-label="Case study chapters">{sections.map(section => <a href={`#${slug}-section-${section.index}`} key={section.index}>{section.label}</a>)}</nav>}
            <div className="study-story">{study.blocks.map((block,index) => {
                if (block.kind === "abstract") return null
                if (block.kind === "section") return <section key={index} id={`${slug}-section-${index}`} className="study-section"><div className="study-section-heading"><h2>{block.thesis ?? block.label}</h2></div>{block.body && <p>{block.body}</p>}</section>
                if (block.kind === "evidence") return <figure className="study-evidence" key={index}><ProjectEvidence name={block.name} playing={active}/>{block.caption && <figcaption>{block.caption}</figcaption>}</figure>
                if (block.kind === "takeaway") return null
                if (block.kind === "confidential") return <p key={index} className="study-disclosure">{block.text}</p>
                if (block.kind === "figure" && block.src) return <figure className="study-evidence" key={index}><button className="study-image-button" type="button" onClick={() => setExpanded(block.src!)} aria-label={`Expand ${block.alt ?? "project image"}`}><img src={block.src} alt={block.alt ?? ""} loading="lazy"/></button>{block.caption && <figcaption>{block.caption}</figcaption>}</figure>
                return null
            })}</div>
            {reflection?.kind === "takeaway" && <section className="study-reflection"><h2>{reflection.title.replace(/^Takeaway:\s*/i, "")}</h2><p>{reflection.body}</p></section>}
            {next && <a className="study-next" href={embedded ? `../${nextSlug}/` : `../${nextSlug}/`}><div><span>Next project</span><strong>{projectLabels[nextSlug] ?? next.title}</strong><p>{next.preview}</p></div><SiteIcon name="next" size={20}/></a>}
        </div>
        <dialog ref={dialog} className="study-lightbox" onClose={() => setExpanded(null)} aria-label="Expanded project preview"><div className="study-lightbox-toolbar"><button type="button" className="study-lightbox-pause" onClick={() => setEnlargedMotion(value => !value)}><SiteIcon name={enlargedMotion ? "pause" : "play"} size={12}/>{enlargedMotion ? "Pause preview" : "Play preview"}</button><button className="study-lightbox-close" type="button" onClick={() => dialog.current?.close()} autoFocus><SiteIcon name="close" size={18}/> Close preview</button></div>{expanded === "project" ? <div className="study-lightbox-stage"><ProjectCover project={project} index={visibleProjects.indexOf(project)} live={active && enlargedMotion}/></div> : expanded && <img src={expanded} alt="Expanded project evidence"/>}</dialog>
    </main>
}
