import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react"
import { flushSync } from "react-dom"
import { intro, projects as workProjects } from "./content"
import { personalMeta } from "./personalProjects"
import { visibleProjects, projectLabels } from "./portfolioCatalog"
import { bySlug } from "./caseStudies"
import CaseStudyPage from "./CaseStudyPage"
import ProjectCover from "./ProjectCover"
import ClickWord from "./ClickWord"
import { IntroIcon, SiteIcon, resolveIntroIcon } from "./icons"
import { useTheme } from "./useTheme"
import "./gallery.css"

const projects = visibleProjects
const workCount = projects.filter(project => workProjects.includes(project)).length
const slugs = projects.map(p => p.link?.split("/").filter(Boolean).pop() ?? "")
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
    } else { activeTransition = undefined; commit() }
}
export default function App() {
    const { theme, palette, toggle } = useTheme()
    const [selected, setSelected] = useState<string | null>(selectedFromURL)
    const selectedRef = useRef(selected)
    const hasOpenedProject = useRef(Boolean(selected))
    const [motion, setMotion] = useState(true)
    const [about, setAbout] = useState(false)
    const [macysReplay, setMacysReplay] = useState(0)
    const gallery = useRef<HTMLDivElement>(null)
    const reader = useRef<HTMLDivElement>(null)
    const casePanel = useRef<HTMLElement>(null)
    const projectOrigin = useRef<DOMRect | null>(null)
    const closeButton = useRef<HTMLButtonElement>(null)
    const opener = useRef<HTMLAnchorElement | null>(null)
    const galleryPosition = useRef(0)
    const previousSelected = useRef<string | null>(selected)
    const projectTiles = useRef(new Map<string, HTMLAnchorElement>())
    const selectedIndex = selected ? slugs.indexOf(selected) : -1
    const select = (slug: string | null, push = true) => {
        if (slug === selectedRef.current) return
        const opening = Boolean(slug && !selectedRef.current)
        if (opening && slug) projectOrigin.current = projectTiles.current.get(slug)?.querySelector(".tile-visual")?.getBoundingClientRect() ?? null
        if (!selectedRef.current) galleryPosition.current = gallery.current?.scrollTop ?? 0
        if (slug) hasOpenedProject.current = true
        selectedRef.current = slug
        if (opening && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
            activeTransition?.skipTransition()
            activeTransition = undefined
            flushSync(() => setSelected(slug))
        } else transition(() => setSelected(slug))
        if (push) {
            const url = new URL(location.href)
            url.hash = ""
            if (slug) url.searchParams.set("project", slug)
            else url.searchParams.delete("project")
            history.pushState({ portfolio: true }, "", url)
        }
    }
    useEffect(() => {
        const pop = () => {
            const next = selectedFromURL()
            if (!selectedRef.current && next) galleryPosition.current = gallery.current?.scrollTop ?? 0
            if (next) hasOpenedProject.current = true
            selectedRef.current = next
            transition(() => setSelected(next))
        }
        window.addEventListener("popstate", pop)
        return () => window.removeEventListener("popstate", pop)
    }, [])
    useLayoutEffect(() => {
        document.title = selected ? `${bySlug(selected)?.title} — Jaden Snyder` : "Jaden Snyder — Product Designer"
        reader.current?.scrollTo(0, 0)
        if (selected) {
            const panel = casePanel.current
            const source = projectOrigin.current
            if (!previousSelected.current && panel && source && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
                const target = panel.getBoundingClientRect()
                panel.animate([
                    { transform: `translate(${source.left - target.left}px,${source.top - target.top}px) scale(${source.width / target.width},${source.height / target.height})`, borderRadius: "18px" },
                    { transform: "none", borderRadius: "24px" }
                ], { duration:650, easing:"cubic-bezier(.22,.8,.2,1)" })
                for (const child of panel.children) child.animate([{opacity:0},{opacity:1}], {duration:450,delay:150,fill:"backwards"})
                projectOrigin.current = null
            }
            if (!previousSelected.current) gallery.current?.scrollTo({ top: 0, behavior: "instant" })
            closeButton.current?.focus({ preventScroll: true })
        }
        else {
            gallery.current?.scrollTo({ top: galleryPosition.current, behavior: "instant" })
            opener.current?.focus({ preventScroll: true })
        }
        previousSelected.current = selected
    }, [selected])
    useEffect(() => {
        if (!selected) return
        const rail = gallery.current
        const tile = projectTiles.current.get(selected)
        if (!rail || !tile) return
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
        let cancelled = false
        let timer = 0
        let frame = 0
        const stop = () => { cancelled = true; window.clearTimeout(timer); cancelAnimationFrame(frame) }
        const align = () => {
            if (cancelled || rail.clientWidth === 0) return
            const railBox = rail.getBoundingClientRect()
            const tileBox = tile.getBoundingClientRect()
            const target = Math.max(0, Math.min(rail.scrollHeight - rail.clientHeight,
                rail.scrollTop + tileBox.top - railBox.top - (rail.clientHeight - tileBox.height) / 2))
            if (reduced) { rail.scrollTop = target; return }
            const from = rail.scrollTop
            const started = performance.now()
            const tick = (now: number) => {
                if (cancelled) return
                const progress = Math.min(1, (now - started) / 560)
                const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
                rail.scrollTop = from + (target - from) * eased
                if (progress < 1) frame = requestAnimationFrame(tick)
            }
            frame = requestAnimationFrame(tick)
        }
        rail.addEventListener("wheel", stop, { passive: true })
        rail.addEventListener("touchstart", stop, { passive: true })
        const settled = reduced ? Promise.resolve() : activeTransition?.finished.catch(() => {}) ?? new Promise<void>(resolve => { timer = window.setTimeout(resolve, 700) })
        void settled.then(() => {
            if (!cancelled) timer = window.setTimeout(align, reduced ? 0 : 120)
        })
        return () => { stop(); rail.removeEventListener("wheel", stop); rail.removeEventListener("touchstart", stop) }
    }, [selected])
    useEffect(() => {
        const key = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !document.querySelector("dialog[open]")) { if (about) setAbout(false); else if (selected) select(null) }
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
    return <div className={`portfolio ${selected ? "is-reading" : ""} ${hasOpenedProject.current ? "has-opened-project" : ""} ${!motion ? "motion-paused" : ""}`} style={style}>
        <div ref={gallery} className="gallery-scroll" inert={about} aria-label={selected ? "Choose another project" : "Portfolio"}>
            <header className="gallery-header">
                <a className="wordmark" href="./" aria-label="Jaden Snyder home"><img src="/favicon.png" alt="" width="42" height="42" /></a>
                <nav aria-label="Main navigation"><button onClick={() => setAbout(true)}>About</button><a href={intro.links.find(l => l.label === "Resume")?.url} target="_blank" rel="noreferrer">Resume</a><a className="contact-link" href="mailto:jadenpsnyder02@gmail.com">Let’s talk <SiteIcon name="external" size={13} /></a></nav>
            </header>
            <section className="gallery-intro">
                <div><h1>Hi, I’m Jaden<br /><span>I create designs that</span>{" "}<ClickWord /></h1></div>
                <div className="intro-details"><p className="intro-description">A product designer rethinking commerce through craft and curiosity. From idea to concept to engagement uplift.</p><p className="building-status">Currently building AI systems for advertisements at Rokt</p></div>
            </section>
            <div className="work-heading"><span>WORK PROJECTS <span className="project-count">{String(workCount).padStart(2, "0")}</span></span><button className="motion-control" aria-pressed={motion} onClick={() => setMotion(!motion)}><SiteIcon name={motion ? "pause" : "play"} size={12} /> <span>{motion ? "Motion on" : "Motion paused"}</span></button></div>
            <div className="project-grid">
                {projects.map((project, index) => <Fragment key={project.title}>{index === workCount && <h2 className="project-group-heading">PERSONAL PROJECTS <span>{String(projects.length - workCount).padStart(2, "0")}</span></h2>}<a ref={element => { if (element) projectTiles.current.set(slugs[index], element); else projectTiles.current.delete(slugs[index]) }} data-project={slugs[index]} href={`?project=${slugs[index]}`} className={`project-tile ${selected === slugs[index] ? "is-selected" : ""}`} onClick={event => open(event, slugs[index])} onPointerEnter={project.component === "macys-bag" ? () => setMacysReplay(value => value + 1) : undefined} onFocus={project.component === "macys-bag" ? () => setMacysReplay(value => value + 1) : undefined} aria-current={selected === slugs[index] ? "page" : undefined} aria-label={`${project.title}${project.comingSoon ? ", case study in progress" : ""}`} style={{ "--tile-index": index, viewTransitionName: `project-${index}` } as CSSProperties}>
                    <div className="tile-visual"><ProjectCover project={project} index={Math.max(0, workProjects.indexOf(project))} live={motion && !selected} focused={!selected} replayKey={macysReplay} /><div className="tile-caption"><div className="tile-caption-line"><strong>{projectLabels[slugs[index]] ?? personalMeta[slugs[index]]?.label ?? project.title}</strong><span className="tile-caption-separator">: </span><span>{personalMeta[slugs[index]]?.summary ?? project.description}</span></div>{project.comingSoon && <span className="tile-wip">Case study in progress</span>}</div></div>
                </a></Fragment>)}
            </div>
            <footer className="gallery-footer"><div className="footer-links">{intro.links.map(link => <a key={link.label} href={link.url} target={link.url.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">{link.label}</a>)}<button onClick={toggle}>{theme === "dark" ? "Light" : "Dark"} mode <SiteIcon name={theme === "dark" ? "sun" : "moon"} size={13} /></button></div><p>Jaden Snyder · Product designer · 2026</p></footer>
        </div>
        {selected && <button ref={closeButton} className="project-close" onClick={() => select(null)} aria-label="Close project and return to all work" inert={about}><SiteIcon name="close" size={21} /></button>}
        {selected && <section ref={casePanel} className="case-reader" style={{animation:"none",transformOrigin:"top left"}} inert={about} aria-label="Case study">
            <div className="reader-toolbar"><button onClick={() => select(null)} aria-label="Back to all work"><SiteIcon name="back" size={12} /> <span>All work</span></button><span>{selectedIndex >= 0 ? projects[selectedIndex].title : bySlug(selected)?.title}</span><button onClick={() => setMotion(!motion)} aria-label={motion ? "Pause animations" : "Play animations"} aria-pressed={!motion}><SiteIcon name={motion ? "pause" : "play"} size={12} /></button><button onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}><SiteIcon name={theme === "dark" ? "sun" : "moon"} /></button></div>
            <div className="reader-scroll" ref={reader} onClick={event => {
                const link = (event.target as HTMLElement).closest("a")
                const match = link?.getAttribute("href")?.match(/^\.\.\/([^/]+)\/$/)
                if (match && bySlug(match[1]) && !event.metaKey && !event.ctrlKey) { event.preventDefault(); select(match[1]) }
            }}>
                <div key={selected} className="reader-content">
                    
                    <CaseStudyPage slug={selected} embedded playing={motion} appearance={{ theme, palette: { ...palette, background: theme === "dark" ? "#111111" : "#ffffff", text: theme === "dark" ? "#ffffff" : "#171717", textMuted: theme === "dark" ? "#b5b5b5" : "#707070", cardBorder: theme === "dark" ? "#353535" : "#e5e5e5", cardThumbBackground: theme === "dark" ? "#222222" : "#f5f5f5" } }} />
                </div>
            </div>
        </section>}
        {about && <div className="about-backdrop" onClick={() => setAbout(false)}><section className="about-card" role="dialog" aria-modal="true" aria-labelledby="about-title" onKeyDown={event => {
            if (event.key !== "Tab") return
            const controls = event.currentTarget.querySelectorAll<HTMLElement>("button, a[href]")
            const first = controls[0], last = controls[controls.length - 1]
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        }} onClick={e => e.stopPropagation()}><button autoFocus onClick={() => setAbout(false)} aria-label="Close about"><SiteIcon name="close" size={16} /></button><p className="eyebrow">A LITTLE ABOUT ME</p><h2 id="about-title">Hi, I’m Jaden.</h2><p>I’m a product designer at Rokt working on commerce experiences, design systems, and tools that help teams move from an idea to something real.</p><p>I like getting hands-on: researching, prototyping, coding, testing, and finding the details that make an experience click.</p><div>{intro.links.map(link => <a key={link.label} href={link.url}><IntroIcon size={15} name={resolveIntroIcon(link.label, link.url)} /> {link.label}</a>)}</div></section></div>}
    </div>
}
