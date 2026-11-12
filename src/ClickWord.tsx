import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import "./click-word.css"

/** The word's gradient and underline share one wipe and one finish point. */
export default function ClickWord() {
    const [running, setRunning] = useState(false)
    const [reversed, setReversed] = useState(false)
    const letters = useRef<HTMLSpanElement>(null)
    useLayoutEffect(() => {
        const word = letters.current!
        const measure = () => {
            const bounds = word.getBoundingClientRect()
            word.style.setProperty("--word-width", `${bounds.width}px`)
            word.querySelectorAll<HTMLElement>(".click-letter").forEach(letter => {
                const glyph = letter.getBoundingClientRect()
                const left = glyph.left - bounds.left
                letter.style.setProperty("--glyph-left", `${left}px`)
                letter.style.setProperty("--glyph-right", `${left + glyph.width}px`)
                letter.style.setProperty("--glyph-width", `${glyph.width}px`)
            })
            // Both palettes use the same letter-group boundaries. Reversing
            // their coordinates would put a color seam inside the I and K.
            if (bounds.width > 0) {
                const glyphs = word.querySelectorAll<HTMLElement>(".click-letter")
                const afterCL = (glyphs[2].getBoundingClientRect().left - bounds.left) / bounds.width * 100
                const afterIC = (glyphs[4].getBoundingClientRect().left - bounds.left) / bounds.width * 100
                const host = word.parentElement!
                host.style.setProperty("--click-first-stop", `${afterCL}%`)
                host.style.setProperty("--click-second-stop", `${afterIC}%`)
            }
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(word)
        return () => observer.disconnect()
    }, [])
    useEffect(() => {
        if (!running) return
        const mq = matchMedia("(prefers-reduced-motion: reduce)")
        const timer = mq.matches ? window.setTimeout(() => { setReversed(value => !value); setRunning(false) }, 600) : undefined
        const stopForReducedMotion = () => { if (mq.matches) setRunning(false) }
        mq.addEventListener("change", stopForReducedMotion)
        return () => { window.clearTimeout(timer); mq.removeEventListener("change", stopForReducedMotion) }
    }, [running])
    return <button type="button" className={`click-word ${running ? "is-running" : ""} ${reversed ? "is-reversed" : ""}`} onClick={() => { if (!running) setRunning(true) }} aria-label="click." title="Play the color fill" aria-busy={running} onAnimationEnd={event => {
        if (event.animationName === "click-transfer" && event.target === event.currentTarget) {
            setReversed(value => !value)
            setRunning(false)
        }
    }}>
        <span ref={letters} className="click-letters" aria-hidden="true">
            {"click.".split("").map((letter,index) => <span className="click-letter" key={index} style={{ "--letter-index": index } as CSSProperties}><span className="click-base">{letter}</span><span className="click-ink">{letter}</span></span>)}
        </span>
        <span className="click-line-track" aria-hidden="true"><span className="click-line" /></span>
    </button>
}
