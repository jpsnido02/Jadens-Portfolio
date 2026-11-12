import { useEffect, useRef, useState, type CSSProperties } from "react"

const FORMATS = [
    { name: "Text offer", image: "format-1.jpg", fn: "textOffer", property: 'headline: "Thank you!",', value: 'body: "7-day Disney+ trial"' },
    { name: "Logo offer", image: "format-3.jpg", fn: "logoOffer", property: 'logo: offer.logo,', value: 'ratio: "1.91:1"' },
    { name: "Hero offer", image: "format-4.jpg", fn: "heroOffer", property: 'image: offer.hero,', value: 'fit: "cover"' },
]
const PROMPT = "Build three Home Depot mockups."
const APPROVAL = "Looks good. Package the set."
const BEATS = [
    { name: "prompt", ms: 1700, format: 0 },
    { name: "send", ms: 400, format: 0 },
    ...FORMATS.flatMap((_, format) => [
        { name: "code", ms: 2200, format },
        { name: "render", ms: 550, format },
        { name: "preview", ms: 2100, format },
    ]),
    { name: "review", ms: 1700, format: 2 },
    { name: "approve", ms: 1700, format: 2 },
    { name: "package", ms: 1300, format: 2 },
    { name: "ready", ms: 3200, format: 2 },
    { name: "reset", ms: 650, format: 0 },
]
const READY = BEATS.findIndex(beat => beat.name === "ready")

/** A compact gallery story. Pausing preserves time within the current beat. */
export default function MockupAgentPreview({ playing }: { playing: boolean }) {
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
    const [beat, setBeat] = useState(() => reduced ? READY : 0)
    const [elapsed, setElapsed] = useState(0)
    const elapsedRef = useRef(0)
    useEffect(() => {
        const mq = matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => { setReduced(mq.matches); elapsedRef.current = 0; setElapsed(0); setBeat(mq.matches ? READY : 0) }
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])
    useEffect(() => {
        if (!playing || reduced) return
        const start = performance.now() - elapsedRef.current
        const tick = window.setInterval(() => {
            const next = Math.min(BEATS[beat].ms, performance.now() - start)
            elapsedRef.current = next
            setElapsed(next)
            if (next >= BEATS[beat].ms) {
                clearInterval(tick)
                elapsedRef.current = 0
                setElapsed(0)
                setBeat(value => (value + 1) % BEATS.length)
            }
        }, 32)
        return () => clearInterval(tick)
    }, [beat, playing, reduced])

    const phase = BEATS[beat]
    const format = FORMATS[phase.format]
    const progress = elapsed / phase.ms
    const completed = ["prompt", "send", "reset"].includes(phase.name) ? 0 :
        ["code", "render"].includes(phase.name) ? phase.format : phase.format + 1
    const packaging = phase.name === "package" || phase.name === "ready"
    const approval = ["review", "approve", "package", "ready"].includes(phase.name)
    const prompt = approval ? APPROVAL : PROMPT
    const composing = phase.name === "prompt" || phase.name === "approve"
    const promptText = composing ? prompt.slice(0, Math.floor(progress * prompt.length)) : phase.name === "review" ? "Review the three formats." : prompt
    const code = `export default\n${format.fn}({\n  ${format.property}\n  ${format.value}\n})`
    const shown = ["prompt", "send", "reset"].includes(phase.name) ? "" : phase.name === "code" ? code.slice(0, Math.floor(progress * code.length)) : code
    const previewIndex = Math.max(0, completed - 1)
    const status = phase.name === "code" ? `Writing ${format.name.toLowerCase()}…` :
        phase.name === "render" ? "Code ready. Building preview…" :
        phase.name === "review" || phase.name === "approve" ? "Three formats. Ready for your review." :
        phase.name === "package" ? "Collecting the approved files…" :
        phase.name === "ready" ? "Approved and ready to download." :
        completed ? `${completed} of 3 formats ready` : "One brief. Three client-ready formats."
    const attention = composing || phase.name === "send" || phase.name === "review" ? "prompt" : phase.name === "code" ? "code" : packaging ? "folder" : "preview"

    return <div className="mockup-story" data-phase={phase.name} data-attention={attention} data-playing={playing && !reduced} role="img" aria-label="A designer asks for three Home Depot mockups. Typed code produces each preview. The designer reviews the set, then the files collect into a download folder.">
        <div className={`mockup-brief ${composing ? "is-composing" : ""}`}>
            <span className="mockup-kicker">{approval ? "DESIGNER REVIEW" : "ASK THE AGENT"}</span>
            <div className="mockup-prompt"><strong>{reduced ? APPROVAL : promptText}<i className="mockup-caret" /></strong><span className="mockup-send" data-pressed={phase.name === "send"}>↑</span></div>
            <p>{status}</p>
        </div>
        <div className="mockup-editor">
            <div className="mockup-toolbar"><span className="mockup-code-icon">‹/›</span><span>home-depot.mocks.ts</span><span className="mockup-language">TS</span></div>
            <div className="mockup-code" key={phase.format}>{shown.split("\n").map((line, index) => <div key={index}><span>{index + 1}</span><code>{line.split(/("[^"]*"|export default|\w+(?=\())/g).map((token, i) => <span key={i} className={token.startsWith('"') ? "is-string" : token === "export default" ? "is-keyword" : token.endsWith("Offer") ? "is-function" : ""}>{token}</span>)}{phase.name === "code" && index === shown.split("\n").length - 1 && <i className="mockup-code-caret" />}</code></div>)}</div>
            <div className="mockup-editor-status"><i data-active={phase.name === "code"} />{phase.name === "code" ? "Generating layout" : shown ? "Layout ready" : "Waiting for your brief"}</div>
            {packaging && <div className="mockup-package">
                <div className="mockup-file-flight">{FORMATS.map((f, i) => <div key={f.name} style={{ "--file-index": i } as CSSProperties}><span>‹/›</span><b>0{i + 1}</b></div>)}</div>
                <div className="mockup-folder"><div className="mockup-folder-back" /><div className="mockup-folder-front"><span>{phase.name === "ready" ? "✓" : "↓"}</span></div></div>
                <strong>home-depot-mocks</strong><span>3 files · {phase.name === "ready" ? "Ready to download" : "Packaging…"}</span>
            </div>}
        </div>
        <div className="mockup-preview">
            <div className="mockup-toolbar"><span className="mockup-live-dot" /><span>LIVE PREVIEW</span><span className="mockup-language">{completed ? `0${previewIndex + 1} / 03` : "— / 03"}</span></div>
            <div className="mockup-preview-stage">
                {completed ? <img key={previewIndex} className="mockup-artwork" src={`/projects/partner-agent/${FORMATS[previewIndex].image}`} alt="" /> : <div className="mockup-empty"><span>✧</span>Your first mockup<br />starts with a brief.</div>}
                {phase.name === "render" && <div className="mockup-rendering"><span /><b>Building {format.name.toLowerCase()}</b></div>}
                {phase.name === "review" && <span className="mockup-review-badge">✓ Three formats to review</span>}
            </div>
            <div className="mockup-format-tray">{FORMATS.map((f, i) => <div key={f.name} className={`${completed > i ? "is-built" : ""} ${completed - 1 === i ? "is-current" : ""}`}><span>{completed > i ? "✓" : `0${i + 1}`}</span><b>{f.name}</b></div>)}</div>
        </div>
    </div>
}
