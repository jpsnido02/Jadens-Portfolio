import { useEffect, useLayoutEffect, useRef, useState } from "react"
import ShoppablePhone, { FRAME_H, FRAME_W, type Stage } from "./ShoppablePhone"

/**
 * The Shoppable pitching-platform hero: code types out on the left while the
 * placement it describes assembles itself on the right.
 *
 * The phone's layers are Figma exports, positioned at coordinates measured from
 * the file — the sheet at (0, 273) 393x579, the header at (21.5, 297), the
 * gallery at (21.5, 369), the details at (21.5, 640) and the buttons at
 * (16, 744). The Figma frame already held the build as three states (blank,
 * header-only sheet, complete ad); this decomposes the complete one so the
 * assembly can land one piece at a time against the lines that describe it.
 */

/* --------------------------------------------------------------- the code */

/**
 * Token kinds, coloured for a white ground. The brief was colourful and
 * standing out, so this runs hotter than an editor theme would: saturated
 * hues rather than the muted pastels a dark theme can afford.
 */
const INK: Record<string, string> = {
    p: "#94A3B8", // punctuation — deliberately the quietest thing here
    t: "#2563EB", // component tags
    a: "#D97706", // props
    s: "#059669", // strings
    e: "#DB2777", // expressions inside braces
    x: "#334155", // literal text content
}

type Token = [string, keyof typeof INK]
interface Line {
    indent: number
    tokens: Token[]
    /** Fires when this line finishes typing. */
    reveal?: Stage
}

const T = (s: string): Token => [s, "t"]
const P = (s: string): Token => [s, "p"]
const A = (s: string): Token => [s, "a"]
const S = (s: string): Token => [s, "s"]
const E = (s: string): Token => [s, "e"]
const X = (s: string): Token => [s, "x"]

const CODE: Line[] = [
    {
        indent: 0,
        tokens: [
            P("<"),
            T("Page"),
            P(" "),
            A("brand"),
            P("="),
            S('"alder-co"'),
            P(" />"),
        ],
        reveal: "background",
    },
    {
        indent: 0,
        tokens: [
            P("<"),
            T("BottomSheet"),
            P(" "),
            A("slot"),
            P("="),
            S('"confirmation"'),
            P(">"),
        ],
        reveal: "sheet",
    },
    {
        indent: 1,
        tokens: [
            P("<"),
            T("Greeting"),
            P(" "),
            A("name"),
            P("={"),
            E("order.name"),
            P("} />"),
        ],
        reveal: "greeting",
    },
    {
        indent: 1,
        tokens: [
            P("<"),
            T("Headline"),
            P(">"),
            X("30% off unlocked"),
            P("</"),
            T("Headline"),
            P(">"),
        ],
        reveal: "headline",
    },
    { indent: 0, tokens: [] },
    {
        indent: 1,
        tokens: [
            P("<"),
            T("Offer"),
            P(" "),
            A("id"),
            P("="),
            S('"stagg-ekg"'),
            P(">"),
        ],
    },
    {
        indent: 2,
        tokens: [
            P("<"),
            T("Accessory"),
            P(" "),
            A("text"),
            P("="),
            S('"Free shipping"'),
            P(" />"),
        ],
        reveal: "accessory",
    },
    {
        indent: 2,
        tokens: [
            P("<"),
            T("Gallery"),
            P(" "),
            A("main"),
            P("={"),
            E("hero"),
            P("} "),
            A("alt"),
            P("={"),
            E("thumbs"),
            P("} />"),
        ],
        reveal: "images",
    },
    { indent: 2, tokens: [P("<"), T("Details")] },
    { indent: 3, tokens: [A("name"), P("={"), E("offer.title"), P("}")] },
    { indent: 3, tokens: [A("price"), P("={"), E("offer.price"), P("}")] },
    {
        indent: 3,
        tokens: [A("was"), P("={"), E("offer.rrp"), P("} />")],
        reveal: "details",
    },
    { indent: 1, tokens: [P("</"), T("Offer"), P(">")] },
    { indent: 0, tokens: [] },
    { indent: 1, tokens: [P("<"), T("Actions"), P(">")] },
    { indent: 2, tokens: [P("<"), T("Button"), P(" "), A("primary"), P(">")] },
    { indent: 3, tokens: [X("View this Deal")] },
    {
        indent: 2,
        tokens: [P("</"), T("Button"), P(">")],
        reveal: "buttonPrimary",
    },
    {
        indent: 2,
        tokens: [
            P("<"),
            T("Button"),
            P(">"),
            X("Decline Offer"),
            P("</"),
            T("Button"),
            P(">"),
        ],
        reveal: "buttonDecline",
    },
    { indent: 1, tokens: [P("</"), T("Actions"), P(">")] },
    { indent: 0, tokens: [P("</"), T("BottomSheet"), P(">")] },
]

const INDENT = "  "
const lineText = (l: Line) =>
    INDENT.repeat(l.indent) + l.tokens.map(([s]) => s).join("")

/** Character index at which each line finishes, computed once. */
const LINE_ENDS = (() => {
    const ends: number[] = []
    let n = 0
    for (const l of CODE) {
        n += lineText(l).length + 1 // + the newline
        ends.push(n)
    }
    return ends
})()
const TOTAL_CHARS = LINE_ENDS[LINE_ENDS.length - 1]

/** Blank lines type instantly, so they should not cost a beat. */
// Slow enough to watch each component land before the next line starts.
// At 14ms the whole build was over in eight seconds.
const CHAR_MS = 32
const HOLD_MS = 2600
const TYPE_MS = TOTAL_CHARS * CHAR_MS

const MONO =
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'

const PIECE_EASE = "cubic-bezier(0.33, 1, 0.68, 1)"

/* ---------------------------------------------------------------- render */

export default function ShoppableBuildLoop({ alt }: { alt?: string }) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 0, h: 0 })
    const [typed, setTyped] = useState(0)
    const [visible, setVisible] = useState(true)
    const [reduced, setReduced] = useState(false)

    useLayoutEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const measure = () => {
            const r = el.getBoundingClientRect()
            if (r.width > 0) setBox({ w: r.width, h: r.height })
        }
        measure()
        window.addEventListener("resize", measure)
        let ro: ResizeObserver | undefined
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure)
            ro.observe(el)
        }
        return () => {
            window.removeEventListener("resize", measure)
            ro?.disconnect()
        }
    }, [])

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduced(mq.matches)
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])

    useEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const io = new IntersectionObserver(
            ([e]) => setVisible(e.isIntersecting),
            { threshold: 0.15 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    // One interval deriving the caret from wall-clock time, rather than a tick
    // per character: the typing stays smooth at ~30 renders a second instead
    // of 70, and a throttled background tab cannot desynchronise it.
    useEffect(() => {
        if (!visible || reduced) return
        const start = performance.now()
        const id = window.setInterval(() => {
            const elapsed = performance.now() - start
            if (elapsed > TYPE_MS + HOLD_MS) {
                setTyped(0)
                return
            }
            setTyped(Math.min(TOTAL_CHARS, Math.floor(elapsed / CHAR_MS)))
        }, 33)
        return () => window.clearInterval(id)
    }, [visible, reduced])

    // Reduced motion gets the finished state, which is the useful one.
    const caret = reduced ? TOTAL_CHARS : typed
    const done = (stage: Stage) => {
        const i = CODE.findIndex((l) => l.reveal === stage)
        return i >= 0 && caret >= LINE_ENDS[i]
    }

    // The phone is height-led; the code takes what is left. Below this the
    // columns stop fitting side by side and the code is dropped rather than
    // squeezed into illegibility.
    const SIDE_BY_SIDE = box.w >= 640
    const pad = box.w < 480 ? 16 : 28
    const gap = 24
    const availH = Math.max(0, box.h - pad * 2)
    const phoneH = SIDE_BY_SIDE
        ? Math.min(availH, (box.w - pad * 2 - gap) * 0.46 * (FRAME_H / FRAME_W))
        : availH
    const phoneW = phoneH * (FRAME_W / FRAME_H)
    const scale = phoneW / FRAME_W
    const px = (v: number) => v * scale
    const codeW = Math.max(0, box.w - pad * 2 - gap - phoneW)

    const fontSize = codeW > 380 ? 12 : 11
    const lineH = Math.round(fontSize * 1.5)
    const gutterW = Math.round(fontSize * 2.1)

    return (
        <div
            ref={wrapRef}
            role="img"
            aria-label={
                alt ??
                "Code typing out on the left while the shoppable placement it describes assembles on an iPhone to the right."
            }
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                // The hero pane wraps its media in a link, and an anchor's
                // underline is inherited by text. Images never showed it; this
                // is the first hero made of type, so it has to be cleared.
                textDecoration: "none",
            }}
        >
            {box.w > 0 && (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap,
                        padding: pad,
                        boxSizing: "border-box",
                    }}
                >
                    {SIDE_BY_SIDE && (
                        <div
                            aria-hidden="true"
                            style={{
                                width: codeW,
                                // Window chrome, so it reads as an editor
                                // rather than loose coloured text on a page.
                                border: "1px solid #E2E8F0",
                                borderRadius: 10,
                                overflow: "hidden",
                                background: "#FFFFFF",
                                boxShadow:
                                    "0 10px 28px rgba(16,24,40,0.10), 0 2px 6px rgba(16,24,40,0.05)",
                                textDecoration: "none",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    height: 26,
                                    padding: "0 10px",
                                    background: "#F8FAFC",
                                    borderBottom: "1px solid #E2E8F0",
                                }}
                            >
                                {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                                    <span
                                        key={c}
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 999,
                                            background: c,
                                            flexShrink: 0,
                                        }}
                                    />
                                ))}
                                <span
                                    style={{
                                        marginLeft: 6,
                                        fontFamily: MONO,
                                        fontSize: 10,
                                        color: "#94A3B8",
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    Placement.tsx
                                </span>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    padding: "10px 0",
                                    fontFamily: MONO,
                                    fontSize,
                                    lineHeight: `${lineH}px`,
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                <div
                                    style={{
                                        width: gutterW,
                                        flexShrink: 0,
                                        textAlign: "right",
                                        paddingRight: 8,
                                        color: "#CBD5E1",
                                        userSelect: "none",
                                        borderRight: "1px solid #F1F5F9",
                                    }}
                                >
                                    {CODE.map((_, i) => (
                                        <div key={i} style={{ height: lineH }}>
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>
                                <div
                                    style={{
                                        flex: 1,
                                        paddingLeft: 10,
                                        whiteSpace: "pre",
                                        overflow: "hidden",
                                    }}
                                >
                                    {CODE.map((line, i) => {
                                        const start =
                                            i === 0 ? 0 : LINE_ENDS[i - 1]
                                        const full = lineText(line)
                                        const shown = Math.max(
                                            0,
                                            Math.min(full.length, caret - start)
                                        )
                                        const onCaretLine =
                                            caret >= start &&
                                            caret < start + full.length + 1
                                        return (
                                            <div
                                                key={i}
                                                style={{ height: lineH }}
                                            >
                                                {renderLine(line, shown)}
                                                {onCaretLine &&
                                                    caret < TOTAL_CHARS && (
                                                        <span
                                                            className="code-caret"
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                width: Math.round(
                                                                    fontSize *
                                                                        0.5
                                                                ),
                                                                height: Math.round(
                                                                    fontSize *
                                                                        1.15
                                                                ),
                                                                background:
                                                                    "#2563EB",
                                                                verticalAlign:
                                                                    "text-bottom",
                                                            }}
                                                        />
                                                    )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <ShoppablePhone width={phoneW} isDone={done} />
                </div>
            )}
        </div>
    )
}

/** Renders a line clipped to `shown` characters, keeping token colours. */
function renderLine(line: Line, shown: number) {
    const indent = INDENT.repeat(line.indent)
    const out: React.ReactNode[] = []
    let used = 0

    if (indent.length) {
        const take = Math.min(indent.length, shown)
        if (take > 0) out.push(indent.slice(0, take))
        used = take
    }
    if (used < shown) {
        line.tokens.forEach(([text, kind], i) => {
            const remaining = shown - used
            if (remaining <= 0) return
            const slice = text.slice(0, remaining)
            used += slice.length
            out.push(
                <span key={i} style={{ color: INK[kind] }}>
                    {slice}
                </span>
            )
        })
    }
    return out.length ? out : " "
}
