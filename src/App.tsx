import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react"
import { flushSync } from "react-dom"
import { intro, projects as workProjects } from "./content"
import { personalProjects, personalMeta } from "./personalProjects"
import { bySlug } from "./caseStudies"
import CaseStudyPage from "./CaseStudyPage"
import ProjectCover from "./ProjectCover"
import ClickWord from "./ClickWord"
import BuildingWords from "./BuildingWords"
import { IntroIcon, resolveIntroIcon } from "./icons"
import { useTheme } from "./useTheme"
import "./gallery.css"

// Temporarily hidden from the gallery and reader rail; keep the project content.
const hiddenProjectLinks = new Set(["work/mcdonalds-kiosk/"])
const projects = [...workProjects.slice(0, 2), ...workProjects.filter(project => project.component === "kalshi-live"), ...personalProjects, ...workProjects.slice(2).filter(project => project.component !== "kalshi-live")].filter(project => !hiddenProjectLinks.has(project.link ?? ""))
const slugs = projects.map(p => p.link?.split("/").filter(Boolean).pop() ?? "")
const clients = ["Uber Eats", "Macy’s", "Rokt", "Multi-brand / Rokt", "Rokt", "McDonald’s", "Expedia", "Kalshi"]
const shortTitles = ["Uber Eats, right on time", "A better bag at Macy’s", "From prompt to prototype", "Same system. Different brands.", "Build it before the call ends", "A little extra with your order", "The rest of the trip"]
const oneLiners = ["Contextual offers during order tracking", "Turning bag review into a reason to add more", "An agent that builds client-ready mockups", "A design system that speaks every brand", "A live demo, made in minutes", "Rewards that reach beyond the kiosk", "Connecting bookings to what comes next", "An ad that moves with the prediction market"]
function selectedFromURL() {
    const slug = new URLSearchParams(location.search).get("project")
    return slug && bySlug(slug) ? slug : null
}
let transitionVersion = 0
let activeTransition: ViewTransition | undefined
function transition(update: () => void) {
    const version = ++transitionVersion
    activeTransition?.skipTransition()
    const commit = () => { if (version === transitionVersion) flushSync(update) }
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        activeTransition = document.startViewTransition(commit)
    } else commit()
}
export default function App() {
    const { theme, palette, toggle } = useTheme()
    const [selected, setSelected] = useState<string | null>(selectedFromURL)
    const selectedRef = useRef(selected)
    const [motion, setMotion] = useState(true)
    const [about, setAbout] = useState(false)
    const [macysReplay, setMacysReplay] = useState(0)
    const gallery = useRef<HTMLDivElement>(null)
    const reader = useRef<HTMLDivElement>(null)
    const closeButton = useRef<HTMLButtonElement>(null)
    const opener = useRef<HTMLAnchorElement | null>(null)
    const galleryPosition = useRef(0)
    const selectedIndex = selected ? slugs.indexOf(selected) : -1
    const select = (slug: string | null, push = true) => {
        if (slug === selectedRef.current) return
        if (!selectedRef.current) galleryPosition.current = gallery.current?.scrollTop ?? 0
        selectedRef.current = slug
        transition(() => setSelected(slug))
        if (push) {
            const url = new URL(location.href)
            if (slug) url.searchParams.set("project", slug)
            else url.searchParams.delete("project")
            history.pushState({ portfolio: true }, "", url)
        }
    }
    useEffect(() => {
        const pop = () => { selectedRef.current = selectedFromURL(); transition(() => setSelected(selectedRef.current)) }
        window.addEventListener("popstate", pop)
        return () => window.removeEventListener("popstate", pop)
    }, [])
    useEffect(() => {
        document.title = selected ? `${bySlug(selected)?.title} — Jaden Snyder` : "Jaden Snyder — Product Designer"
        reader.current?.scrollTo(0, 0)
        if (selected) closeButton.current?.focus({ preventScroll: true })
        else {
            gallery.current?.scrollTo(0, galleryPosition.current)
            opener.current?.focus({ preventScroll: true })
        }
    }, [selected])
    useEffect(() => {
        const key = (event: KeyboardEvent) => {
            if (event.key === "Escape") { if (about) setAbout(false); else if (selected) select(null) }
        }
        window.addEventListener("keydown", key)
        return () => window.removeEventListener("keydown", key)
    })
    const open = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
        event.preventDefault()
        opener.current = event.currentTarget
        select(slug)
    }
    const style = { "--gallery-bg": theme === "dark" ? "#111111" : "#ffffff", "--gallery-ink": theme === "dark" ? "#ffffff" : "#171717", "--gallery-muted": theme === "dark" ? "#b5b5b5" : "#707070", "--gallery-line": theme === "dark" ? "#353535" : "#e5e5e5", "--gallery-surface": theme === "dark" ? "#1a1a1a" : "#ffffff" } as CSSProperties
    return <div className={`portfolio ${selected ? "is-reading" : ""} ${!motion ? "motion-paused" : ""}`} style={style}>
        <div ref={gallery} className="gallery-scroll" inert={about} aria-label={selected ? "Choose another project" : "Portfolio"}>
            <header className="gallery-header">
                <a className="wordmark" href="./" aria-label="Jaden Snyder home">Jaden Snyder</a>
                <nav aria-label="Main navigation"><button onClick={() => setAbout(true)}>About</button><a href={intro.links.find(l => l.label === "Resume")?.url} target="_blank" rel="noreferrer">Résumé ↗</a><a className="contact-link" href="mailto:jadenpsnyder02@gmail.com">Let’s talk <span>↗</span></a></nav>
            </header>
            <section className="gallery-intro">
                <div><p className="eyebrow building-status"><span className="live-dot" /><span className="building-sentence"><span>Currently building</span><BuildingWords playing={motion} /><span>at Rokt</span></span></p><h1>Hi, I’m Jaden<br /><span>I create designs that</span>{" "}<ClickWord /></h1></div>
                <p className="intro-description">A product designer rethinking commerce through craft and curiosity.<br /><span>From idea to concept to engagement uplift</span></p>
            </section>
            <div className="work-heading"><span>SELECTED WORK <span className="project-count">{String(projects.length).padStart(2, "0")}</span></span><button className="motion-control" aria-pressed={motion} onClick={() => setMotion(!motion)}>{motion ? "Ⅱ" : "▷"} <span>{motion ? "Motion on" : "Motion paused"}</span></button></div>
            <div className="project-grid">
                {projects.map((project, index) => <a key={project.title} href={`?project=${slugs[index]}`} className={`project-tile ${selected === slugs[index] ? "is-selected" : ""}`} onClick={event => open(event, slugs[index])} onPointerEnter={project.component === "macys-bag" ? () => setMacysReplay(value => value + 1) : undefined} onFocus={project.component === "macys-bag" ? () => setMacysReplay(value => value + 1) : undefined} aria-current={selected === slugs[index] ? "page" : undefined} aria-label={`${project.title}${project.comingSoon ? ", case study in progress" : ""}`} style={{ "--tile-index": index, viewTransitionName: `project-${index}` } as CSSProperties}>
                    <div className="tile-visual"><ProjectCover project={project} index={Math.max(0, workProjects.indexOf(project))} live={motion && !selected} focused={!selected} replayKey={macysReplay} /><div className="tile-caption"><div className="tile-caption-line"><strong>{personalMeta[slugs[index]]?.label ?? clients[workProjects.indexOf(project)] ?? project.thumb?.alt ?? project.category}</strong><span className="tile-caption-separator">: </span><span>{personalMeta[slugs[index]]?.summary ?? oneLiners[workProjects.indexOf(project)] ?? project.description}</span><span className="tile-arrow">↗</span></div>{project.comingSoon && <span className="tile-wip">Case study in progress</span>}</div></div>
                </a>)}
            </div>
            <footer className="gallery-footer"><div><h2>Have a good problem?<br /><a href="mailto:jadenpsnyder02@gmail.com">Let’s make something click. ↗</a></h2></div><div className="footer-links">{intro.links.map(link => <a key={link.label} href={link.url} target={link.url.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">{link.label} ↗</a>)}<button onClick={toggle}>{theme === "dark" ? "Light" : "Dark"} mode ◐</button></div><p>Jaden Snyder · Product designer · 2026</p></footer>
        </div>
        {selected && <section className="case-reader" inert={about} aria-label="Case study">
            <div className="reader-toolbar"><button ref={closeButton} onClick={() => select(null)} aria-label="Close case study">← <span>All work</span></button><span>{selectedIndex >= 0 ? projects[selectedIndex].title : bySlug(selected)?.title}</span><button onClick={() => setMotion(!motion)} aria-label={motion ? "Pause animations" : "Play animations"} aria-pressed={!motion}>{motion ? "Ⅱ" : "▷"}</button><button onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>◐</button><button onClick={() => select(null)} aria-label="Close case study">✕</button></div>
            <div className="reader-scroll" ref={reader} onClick={event => {
                const link = (event.target as HTMLElement).closest("a")
                const match = link?.getAttribute("href")?.match(/^\.\.\/([^/]+)\/$/)
                if (match && bySlug(match[1]) && !event.metaKey && !event.ctrlKey) { event.preventDefault(); select(match[1]) }
            }}>
                <div key={selected} className="reader-content">
                    {selectedIndex >= 0 && <div className="reader-hero"><ProjectCover project={projects[selectedIndex]} index={Math.max(0, workProjects.indexOf(projects[selectedIndex]))} live={motion} /></div>}
                    <CaseStudyPage slug={selected} embedded appearance={{ theme, palette: { ...palette, background: theme === "dark" ? "#111111" : "#ffffff", text: theme === "dark" ? "#ffffff" : "#171717", textMuted: theme === "dark" ? "#b5b5b5" : "#707070", cardBorder: theme === "dark" ? "#353535" : "#e5e5e5", cardThumbBackground: theme === "dark" ? "#222222" : "#f5f5f5" } }} />
                </div>
            </div>
        </section>}
        {about && <div className="about-backdrop" onClick={() => setAbout(false)}><section className="about-card" role="dialog" aria-modal="true" aria-labelledby="about-title" onKeyDown={event => {
            if (event.key !== "Tab") return
            const controls = event.currentTarget.querySelectorAll<HTMLElement>("button, a[href]")
            const first = controls[0], last = controls[controls.length - 1]
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        }} onClick={e => e.stopPropagation()}><button autoFocus onClick={() => setAbout(false)} aria-label="Close about">✕</button><p className="eyebrow">A LITTLE ABOUT ME</p><h2 id="about-title">Hi, I’m Jaden.</h2><p>I’m a product designer at Rokt working on commerce experiences, design systems, and tools that help teams move from an idea to something real.</p><p>I like getting hands-on: researching, prototyping, coding, testing, and finding the details that make an experience click.</p><div>{intro.links.map(link => <a key={link.label} href={link.url}><IntroIcon size={15} name={resolveIntroIcon(link.label, link.url)} /> {link.label} ↗</a>)}</div></section></div>}
    </div>
}
