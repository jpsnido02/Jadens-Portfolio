import { useEffect, useRef, useState, type CSSProperties } from "react"

export type StudyChapter = { id: string; label: string }

/** Follows either the portfolio reader's scroll container or a standalone page. */
export default function StudyNavigation({ chapters }: { chapters: StudyChapter[] }) {
    const nav = useRef<HTMLElement>(null)
    const [position, setPosition] = useState({ active: chapters[0]?.id, progress: 0 })
    useEffect(() => {
        const page = nav.current?.closest<HTMLElement>(".study-page")
        if (!page) return
        const scroller = page.closest<HTMLElement>(".reader-scroll")
        const target = scroller ?? window
        let frame = 0
        const measure = () => {
            frame = 0
            const height = scroller?.clientHeight ?? window.innerHeight
            const top = scroller?.getBoundingClientRect().top ?? 0
            const scrollTop = scroller?.scrollTop ?? window.scrollY
            const scrollHeight = scroller?.scrollHeight ?? document.documentElement.scrollHeight
            const progress = Math.max(0, Math.min(1, scrollTop / Math.max(1, scrollHeight - height)))
            let active = chapters[0]?.id
            for (const chapter of chapters) {
                const section = document.getElementById(chapter.id)
                if (section && section.getBoundingClientRect().top <= top + Math.min(180, height * .25)) active = chapter.id
            }
            if (progress > .985) active = chapters[chapters.length - 1]?.id
            setPosition(previous => previous.active === active && Math.abs(previous.progress - progress) < .002 ? previous : { active, progress })
        }
        const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
        target.addEventListener("scroll", schedule, { passive: true })
        window.addEventListener("resize", schedule)
        const observer = new ResizeObserver(schedule)
        observer.observe(page)
        measure()
        return () => { target.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); observer.disconnect(); cancelAnimationFrame(frame) }
    }, [chapters])
    return <aside className="study-navigation"><nav ref={nav} className="study-ticker" style={{"--reading-progress":position.progress} as CSSProperties} aria-label="Case study sections">
        <div className="study-ticker-scale" aria-hidden="true">{Array.from({length:45},(_,i) => <span key={i} className={i / 44 <= position.progress ? "is-read" : ""}/>)}<i style={{top:`${position.progress * 100}%`}}/></div>
        <div className="study-ticker-links">{chapters.map(chapter => <a key={chapter.id} href={`#${chapter.id}`} aria-current={position.active === chapter.id ? "location" : undefined} onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            event.preventDefault()
            document.getElementById(chapter.id)?.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"})
        }}>{chapter.label}</a>)}</div>
    </nav></aside>
}
