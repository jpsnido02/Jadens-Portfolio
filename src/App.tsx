import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react"
import { flushSync } from "react-dom"
import { intro, projects as workProjects } from "./content"
import { personalMeta } from "./personalProjects"
import { visibleProjects, projectLabels } from "./portfolioCatalog"
import { bySlug } from "./caseStudies"
import CaseStudyPage from "./CaseStudyPage"
import ProjectCover from "./ProjectCover"
import ProjectRailMark, { railProjectTitle } from "./ProjectRailMark"
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
    const closeButton = useRef<HTMLButtonElement>(null)
    const opener = useRef<HTMLAnchorElement | null>(null)
    const galleryPosition = useRef(0)
    const previousSelected = useRef<string | null>(selected)
    const navigationVersion = useRef(0)
    const activeTransition = useRef<ViewTransition | null>(null)
    const nativeReady = useRef(false)
    const panelAnimation = useRef<Animation | null>(null)
    const contentAnimation = useRef<Animation | null>(null)
    const panelOpacityAnimation = useRef<Animation | null>(null)
    const nativeDirection = useRef<"enter" | "exit" | null>(null)
    const projectTiles = useRef(new Map<string, HTMLAnchorElement>())
    const selectedIndex = selected ? slugs.indexOf(selected) : -1
    const select = (slug: string | null, push = true) => {
        if (slug === selectedRef.current) return
        const version = ++navigationVersion.current
        const wasSelected = selectedRef.current
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
        const interrupted = Boolean(activeTransition.current || panelAnimation.current)
        // Preserve the visible reader pose before cancelling an in-flight navigation.
        let pose: Keyframe | undefined
        if (panelAnimation.current && casePanel.current) {
            const style = getComputedStyle(casePanel.current)
            pose = { transform: style.transform, opacity: style.opacity }
        } else if (activeTransition.current && nativeDirection.current) {
            if (nativeReady.current) {
                const snapshot = nativeDirection.current === "enter" ? "new" : "old"
                const style = getComputedStyle(document.documentElement, `::view-transition-${snapshot}(case-reader)`)
                pose = { transform: style.transform, opacity: style.opacity }
            } else {
                // Reading pseudo styles before capture is ready can block pending snapshots.
                pose = nativeDirection.current === "enter"
                    ? { transform: "scale(.88)", opacity: 0 }
                    : { transform: "scale(1)", opacity: 1 }
            }
        }
        activeTransition.current?.skipTransition()
        activeTransition.current = null
        nativeReady.current = false
        panelAnimation.current?.cancel()
        panelAnimation.current = null
        panelOpacityAnimation.current?.cancel()
        panelOpacityAnimation.current = null
        contentAnimation.current?.cancel()
        document.documentElement.classList.remove("project-navigation")
        if (!wasSelected && slug && !casePanel.current) galleryPosition.current = gallery.current?.scrollTop ?? 0
        if (slug) hasOpenedProject.current = true
        selectedRef.current = slug
        if (push) {
            const url = new URL(location.href)
            url.hash = ""
            if (slug) url.searchParams.set("project", slug)
            else url.searchParams.delete("project")
            history.pushState({ portfolio: true }, "", url)
        }
        const commit = () => {
            if (version === navigationVersion.current) flushSync(() => setSelected(slug))
        }
        const animatePanel = (from: Keyframe, closing: boolean) => {
            const panel = casePanel.current
            if (!panel) { commit(); return }
            const timing = getComputedStyle(panel)
            const duration = timing.getPropertyValue("--project-transition-duration").trim()
            const durationMs = parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000)
            const animation = panel.animate([{ transform: from.transform }, {
                transform: closing ? "scale(.88)" : "scale(1)"
            }], {
                duration: durationMs,
                easing: timing.getPropertyValue("--project-transition-ease").trim(),
                fill: "both"
            })
            const opacityAnimation = panel.animate([
                { opacity: from.opacity }, { opacity: closing ? 0 : 1 }
            ], {
                duration: 200, delay: closing ? Math.max(0, durationMs - 200) : 0,
                easing: closing ? "cubic-bezier(.68,0,.77,0)" : "cubic-bezier(.23,1,.32,1)", fill: "both"
            })
            panelAnimation.current = animation
            panelOpacityAnimation.current = opacityAnimation
            void animation.finished.then(() => {
                if (version !== navigationVersion.current) return
                if (closing) commit()
                animation.cancel()
                opacityAnimation.cancel()
                panelAnimation.current = null
                panelOpacityAnimation.current = null
            }).catch(() => {})
        }
        if (reduced) { commit(); return }
        if (wasSelected && slug) {
            commit()
            const content = reader.current?.firstElementChild
            if (content) contentAnimation.current = content.animate([{ opacity: 0 }, { opacity: 1 }], {
                duration: 200, easing: "cubic-bezier(0.23,1,0.32,1)"
            })
            // An interrupted entrance continues from its current pose; settled frames never move.
            if (pose) animatePanel(pose, false)
        } else if (document.startViewTransition && !interrupted) {
            nativeDirection.current = slug ? "enter" : "exit"
            document.documentElement.classList.add("project-navigation")
            const transition = document.startViewTransition(commit)
            activeTransition.current = transition
            void transition.ready.then(() => {
                if (version === navigationVersion.current) nativeReady.current = true
            }).catch(() => {})
            void transition.finished.finally(() => {
                if (version !== navigationVersion.current) return
                activeTransition.current = null
                nativeDirection.current = null
                document.documentElement.classList.remove("project-navigation")
            }).catch(() => {})
        } else if (slug) {
            commit()
            animatePanel(pose ?? { transform: "scale(.88)", opacity: 0 }, false)
        } else {
            // Keep the fallback reader mounted until its exit completes.
            animatePanel(pose ?? { transform: "scale(1)", opacity: 1 }, true)
        }
    }
    useEffect(() => {
        const pop = () => select(selectedFromURL(), false)
        window.addEventListener("popstate", pop)
        return () => window.removeEventListener("popstate", pop)
    }, [])
    useLayoutEffect(() => {
        document.title = selected ? `${bySlug(selected)?.title} — Jaden Snyder` : "Jaden Snyder"
        reader.current?.scrollTo(0, 0)
        if (selected) {
            // This layout effect runs inside the navigation commit, before new snapshots.
            // Align once so neither a delayed scroll nor a queued callback can fight user input.
            const rail = gallery.current
            const tile = projectTiles.current.get(selected)
            if (rail && tile && rail.clientWidth > 0) {
                const railBox = rail.getBoundingClientRect()
                const tileBox = tile.getBoundingClientRect()
                rail.scrollTop = Math.max(0, Math.min(rail.scrollHeight - rail.clientHeight,
                    rail.scrollTop + tileBox.top - railBox.top - (rail.clientHeight - tileBox.height) / 2))
            }
            if (!previousSelected.current) closeButton.current?.focus({ preventScroll: true })
        } else {
            gallery.current?.scrollTo({ top: galleryPosition.current, behavior: "instant" })
            opener.current?.focus({ preventScroll: true })
        }
        previousSelected.current = selected
    }, [selected])
    useEffect(() => {
        const key = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !document.querySelector("dialog[open]")) { if (about) setAbout(false); else if (selectedRef.current) select(null) }
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
    return <div className={`portfolio ${selected ? "is-reading" : ""} ${hasOpenedProject.current ? "has-opened-project" : ""} ${!motion ? "motion-paused" : ""}`} style={style} data-theme={theme}>
        <div ref={gallery} className="gallery-scroll" inert={about} aria-label={selected ? "Choose another project" : "Portfolio"}>
            <header className="gallery-header">
                <a className="wordmark" href="./" aria-label="Jaden Snyder home"><img src="/favicon.svg" alt="" width="42" height="42" /></a>
                <nav aria-label="Main navigation"><button onClick={() => setAbout(true)}>About</button><a href={intro.links.find(l => l.label === "Resume")?.url} target="_blank" rel="noreferrer">Resume</a><a className="contact-link" href="mailto:jadenpsnyder02@gmail.com"><span>Let’s talk</span><SiteIcon name="external" size={13} /></a></nav>
            </header>
            <section className="gallery-intro">
                <div><h1>Hi, I’m Jaden<br /><span>I create designs that</span>{" "}<ClickWord /></h1></div>
                <div className="intro-details"><p className="intro-description">A product designer comfortable working at every step of the product lifecycle. From ideation to prototype to code.</p><p className="building-status"><span className="current-work-dot" aria-hidden="true"/><span>Currently building AI systems for advertisements at Rokt</span></p></div>
            </section>
            <div className="work-heading"><span>WORK PROJECTS <span className="project-count">{String(workCount).padStart(2, "0")}</span></span><button className="motion-control" aria-pressed={motion} onClick={() => setMotion(!motion)}><SiteIcon name={motion ? "pause" : "play"} size={12} /> <span>{motion ? "Motion on" : "Motion paused"}</span></button></div>
            <div className="project-grid">
                {projects.map((project, index) => <Fragment key={project.title}>{index === workCount && <h2 className="project-group-heading">PERSONAL PROJECTS <span>{String(projects.length - workCount).padStart(2, "0")}</span></h2>}<a ref={element => { if (element) projectTiles.current.set(slugs[index], element); else projectTiles.current.delete(slugs[index]) }} data-project={slugs[index]} href={`?project=${slugs[index]}`} className={`project-tile ${selected === slugs[index] ? "is-selected" : ""}`} onClick={event => open(event, slugs[index])} onPointerEnter={project.component === "macys-bag" ? () => setMacysReplay(value => value + 1) : undefined} onFocus={project.component === "macys-bag" ? () => setMacysReplay(value => value + 1) : undefined} aria-current={selected === slugs[index] ? "page" : undefined} aria-label={`${project.title}${project.comingSoon ? ", case study in progress" : ""}`} style={{ "--tile-index": index, viewTransitionName: `project-${index}` } as CSSProperties}>
                    {selected ? (
                        <div className="tile-visual rail-mark" title={project.title}>
                            <ProjectRailMark slug={slugs[index]} title={project.title} />
                            {selected === slugs[index] && <span className="rail-selected-name" aria-hidden="true">
                                {railProjectTitle[slugs[index]] ?? project.title}
                            </span>}
                        </div>
                    ) : (
                        <div className="tile-visual"><ProjectCover project={project} index={Math.max(0, workProjects.indexOf(project))} live={motion} focused replayKey={macysReplay} /><div className="tile-caption"><div className="tile-caption-line"><strong>{projectLabels[slugs[index]] ?? personalMeta[slugs[index]]?.label ?? project.title}</strong><span className="tile-caption-separator">: </span><span>{personalMeta[slugs[index]]?.summary ?? project.description}</span></div>{project.comingSoon && <span className="tile-wip">Case study in progress</span>}</div></div>
                    )}
                </a></Fragment>)}
            </div>
            <footer className="gallery-footer"><div className="footer-links">{intro.links.map(link => <a key={link.label} href={link.url} target={link.url.startsWith("mailto:") ? undefined : "_blank"} rel="noreferrer">{link.label}</a>)}<button onClick={toggle}>{theme === "dark" ? "Light" : "Dark"} mode <SiteIcon name={theme === "dark" ? "sun" : "moon"} size={13} /></button></div><p>© Jaden Snyder 2026</p></footer>
        </div>
        {selected && <button ref={closeButton} className="project-close" onClick={() => select(null)} aria-label="Close project and return to all work" inert={about}><SiteIcon name="close" size={21} /></button>}
        {selected && <section ref={casePanel} className="case-reader" inert={about} aria-label="Case study">
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
