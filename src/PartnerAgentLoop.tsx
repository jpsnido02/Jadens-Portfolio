/**
 * Partner mock agent hero.
 *
 * Three elements: the file the agent writes, the composer it was asked from,
 * and the phone showing what that file renders as. The phone starts empty —
 * there is no partner yet — then the agent takes the job and the confirmation
 * page arrives.
 *
 * Each format is its own round trip. The first prompt names the partner; after
 * that the composer asks for "next format", the format on screen minimises
 * away, the agent appends to the file, and the new one builds up from nothing.
 * No two formats are ever on screen together, so nothing morphs between them.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { FRAME_H, FRAME_W, PhoneShell } from "./ShoppablePhone"
import { FONT_FAMILY } from "./tokens"

const BASE = "../../projects/partner-agent"

/* --------------------------------------------------------------- the file */

/**
 * Token kinds, coloured for a white ground — the same hot palette as the other
 * code hero rather than a muted editor theme.
 */
const INK: Record<string, string> = {
    p: "#94A3B8", // punctuation — deliberately the quietest thing here
    k: "#7C3AED", // keywords
    f: "#2563EB", // the generator's format functions
    a: "#D97706", // argument names
    s: "#059669", // strings
    n: "#DB2777", // numbers
    e: "#0891B2", // expressions
}

type Token = [string, keyof typeof INK]

const P = (s: string): Token => [s, "p"]
const K = (s: string): Token => [s, "k"]
const F = (s: string): Token => [s, "f"]
const A = (s: string): Token => [s, "a"]
const S = (s: string): Token => [s, "s"]
const N = (s: string): Token => [s, "n"]
const E = (s: string): Token => [s, "e"]

const PROMPT = "Design Home Depot, they're a net new client"
/**
 * What gets asked for each round after the first.
 *
 * "next format" said nothing about what was coming, so the file and the phone
 * filled with something the instruction had not named. Each round now asks for
 * the format by name, minus its P1/P2 placement prefix — that prefix is where
 * the format sits on a page, which is Rokt's vocabulary rather than anything a
 * reader of this needs.
 */
const nextPrompt = (label: string) => `Do ${label.replace(/^P\d\s+/, "")}`
/**
 * The designer's 20%.
 *
 * The rest of this hero is the 80% an agent does. It ended with the last
 * format on screen, which left the work looking fully automated — and the
 * project's point is the opposite: the skill gets it most of the way and a
 * designer signs it off. So the last instruction is a person approving the
 * set and asking for it packaged, and the file becomes a folder.
 */
const SIGNOFF = "Everything looks good, compile these into a folder to download"
const FOLDER_NAME = "home-depot-mocks"
const FILE_NAME = "home-depot.mocks.ts"

interface Line {
    indent: number
    tokens: Token[]
}

/**
 * One snippet per format, each written from the first line. The file is not a
 * growing list that gains an entry per format — the agent rewrites it for
 * whichever format it was asked for, so the reader sees a fresh file each
 * round rather than an append.
 */
const SNIPPETS: Line[][] = [
    // P1 TEXT
    [
        {
            indent: 0,
            tokens: [K("export default"), P(" "), F("p1Text"), P("({")],
        },
        {
            indent: 1,
            tokens: [
                A("headline"),
                P(": "),
                S('"Thank you for your purchase!"'),
                P(","),
            ],
        },
        {
            indent: 1,
            tokens: [A("body"), P(": "), S('"7-day Disney+ trial"'), P(",")],
        },
        { indent: 0, tokens: [P("})")] },
    ],
    // P1 TEXT + TAG
    [
        {
            indent: 0,
            tokens: [K("export default"), P(" "), F("p1Text"), P("({")],
        },
        {
            indent: 1,
            tokens: [
                A("headline"),
                P(": "),
                S('"Thank you for your purchase!"'),
                P(","),
            ],
        },
        {
            indent: 1,
            tokens: [
                A("tag"),
                P(": "),
                S('"Free Trial"'),
                P(", "),
                A("tone"),
                P(": "),
                S('"success"'),
                P(","),
            ],
        },
        { indent: 0, tokens: [P("})")] },
    ],
    // P2 TEXT LOGO 1.91:1
    [
        {
            indent: 0,
            tokens: [K("export default"), P(" "), F("p2TextLogo"), P("({")],
        },
        {
            indent: 1,
            tokens: [A("logo"), P(": "), E("offer.logo"), P(",")],
        },
        {
            indent: 1,
            tokens: [A("ratio"), P(": "), S('"1.91:1"'), P(",")],
        },
        { indent: 0, tokens: [P("})")] },
    ],
    // HERO
    [
        {
            indent: 0,
            tokens: [K("export default"), P(" "), F("hero"), P("({")],
        },
        {
            indent: 1,
            tokens: [A("image"), P(": "), E("offer.hero"), P(",")],
        },
        {
            indent: 1,
            tokens: [A("fit"), P(": "), S('"cover"'), P(",")],
        },
        { indent: 0, tokens: [P("})")] },
    ],
    // SHOPPER REWARDS STANDARD
    [
        {
            indent: 0,
            tokens: [K("export default"), P(" "), F("shopperRewards"), P("({")],
        },
        {
            indent: 1,
            tokens: [A("tier"), P(": "), S('"standard"'), P(",")],
        },
        {
            indent: 1,
            tokens: [A("points"), P(": "), N("250"), P(",")],
        },
        { indent: 0, tokens: [P("})")] },
    ],
]

const INDENT = "  "
const lineText = (l: Line) =>
    INDENT.repeat(l.indent) + l.tokens.map(([s]) => s).join("")

/** Per snippet: the character index at which each of its lines finishes. */
const ENDS = SNIPPETS.map((snippet) => {
    const ends: number[] = []
    let n = 0
    for (const l of snippet) {
        n += lineText(l).length + 1 // + the newline
        ends.push(n)
    }
    return ends
})
const SNIPPET_CHARS = ENDS.map((e) => e[e.length - 1])
/**
 * Line slots the window always holds, so its height never moves as snippets of
 * different lengths are written. The spare slots below the code are what an
 * editor shows for a short file, and they give the window enough presence to
 * sit beside a phone.
 */
const MAX_LINES = Math.max(...SNIPPETS.map((x) => x.length)) + 5

/**
 * Each format, with the height its sheet occupies inside the 852pt screen.
 * Heights are the exports' own pixels rather than the rounded figures in the
 * node metadata, so every sheet sits exactly where Figma puts it.
 */
const FORMATS: { label: string; src: string; h: number }[] = [
    { label: "P1 TEXT", src: "format-1.jpg", h: 358 },
    { label: "P1 TEXT + TAG", src: "format-2.jpg", h: 388 },
    { label: "P2 TEXT LOGO 1.91:1", src: "format-3.jpg", h: 434 },
    { label: "HERO", src: "format-4.jpg", h: 557.5 },
    { label: "SHOPPER REWARDS STANDARD", src: "format-5.jpg", h: 487 },
]

/**
 * Padding above every format, added by the container rather than baked into
 * the exports — the artwork stays exactly as Figma draws it. The sheet holds
 * each format at its own height anchored to the bottom, so the band the clip
 * leaves open above the artwork is this and nothing else.
 */
const SHEET_PAD_TOP = 16
const SHEET_H = FORMATS.map((f) => f.h + SHEET_PAD_TOP)
const MAX_SHEET_H = Math.max(...SHEET_H)
/** Measured off the export: the sheet's top corners are barely rounded. */
const SHEET_R = 8
const SCREEN_H = 852

/**
 * One knob for the whole loop's pace. Every duration below is written at its
 * base value and scaled through this, so the timing moves together from a
 * single number instead of eight being nudged one at a time.
 */
const PACE = 1.25
const pace = (v: number) => Math.round(v * PACE)

const PROMPT_CHAR_MS = pace(38)
const SEND_MS = pace(400)
/** Long enough to read the agent picking the job up before the file moves. */
/** Long enough that the page has finished arriving before the file
 *  starts being written underneath it. */
const AGENT_MS = pace(1500)
const CHAR_MS = pace(36)
/** The preview greying over and spinning while the format is rendered. */
const LOADING_MS = pace(1400)
/**
 * Time with a finished format on screen, before the next is asked for. It has
 * to outlast the sheet's own arrival with room to spare, or the slide lands
 * and is immediately interrupted by the next instruction.
 */
const DWELL_MS = pace(1450)
const HOLD_MS = pace(2600)
/** The grey lifting off a format that has finished rendering. */
const VEIL_MS = pace(300)
/**
 * The sheet presenting itself, the way a bottom sheet does. This has to stay
 * under LOADING_MS: the sheet leaves at the start of the grey and the format
 * swaps at the end of it, so a slide longer than the grey would still be on
 * its way out when the swap happened underneath, in full view. Both scale
 * through PACE together, so that relationship holds at any pace.
 */
const SHEET_MS = pace(1050)
/** The folder assembling itself once the set is approved. */
const PACKAGE_MS = pace(900)
/** Time on the finished folder before the loop goes round. */
const FOLDER_MS = pace(2400)
/**
 * The partner's page arriving. It paints down from the top and resolves out of
 * blur rather than cross-fading, so it reads as a page loading rather than a
 * picture appearing — see .agent-page-in. The fade is only the fallback for
 * browsers without masks, so it is the shorter of the two.
 */
const PAGE_IN_MS = pace(1350)
const PAGE_FADE_MS = pace(560)

/**
 * Every step carries the round it belongs to, so what the file holds can be
 * derived from the script position rather than tracked alongside it.
 */
type Step =
    | { kind: "prompt"; seg: number; text: string; ms: number }
    | { kind: "send"; seg: number; ms: number }
    | { kind: "agent"; seg: number; ms: number }
    | { kind: "code"; seg: number; ms: number }
    | { kind: "loading"; seg: number; ms: number }
    | { kind: "dwell"; seg: number; ms: number }
    /** The approved set compiling into a folder. */
    | { kind: "package"; seg: number; ms: number }
    | { kind: "hold"; seg: number; ms: number }
    | { kind: "reset"; ms: number }

/**
 * One round per format: ask, send, write the code, then the preview greys over
 * and spins while it renders. The format itself swaps while the grey is up, so
 * it is only ever seen already finished — no two formats share the screen and
 * nothing morphs between them. The first round differs only in that it names
 * the partner and waits for the agent to resolve the brand.
 */
const SCRIPT: Step[] = (() => {
    const steps: Step[] = []
    SNIPPETS.forEach((_, seg) => {
        steps.push({
            kind: "prompt",
            seg,
            text: seg === 0 ? PROMPT : nextPrompt(FORMATS[seg].label),
            ms:
                (seg === 0 ? PROMPT : nextPrompt(FORMATS[seg].label)).length *
                PROMPT_CHAR_MS,
        })
        steps.push({ kind: "send", seg, ms: SEND_MS })
        if (seg === 0) steps.push({ kind: "agent", seg, ms: AGENT_MS })
        steps.push({ kind: "code", seg, ms: SNIPPET_CHARS[seg] * CHAR_MS })
        steps.push({ kind: "loading", seg, ms: LOADING_MS })
        steps.push({ kind: "dwell", seg, ms: DWELL_MS })
    })
    steps.push({ kind: "hold", seg: SNIPPETS.length - 1, ms: HOLD_MS })
    // The designer's 20%: proof the set, approve it, take the folder away.
    // `seg` is one past the last snippet so the file keeps showing the final
    // format's code while this is typed, rather than stepping back one.
    steps.push({
        kind: "prompt",
        seg: SNIPPETS.length,
        text: SIGNOFF,
        ms: SIGNOFF.length * PROMPT_CHAR_MS,
    })
    steps.push({ kind: "send", seg: SNIPPETS.length, ms: SEND_MS })
    steps.push({ kind: "package", seg: SNIPPETS.length - 1, ms: PACKAGE_MS })
    steps.push({ kind: "hold", seg: SNIPPETS.length - 1, ms: FOLDER_MS })
    steps.push({ kind: "reset", ms: 80 })
    return steps
})()

const AGENT_STEP = SCRIPT.findIndex((s) => s.kind === "agent")
const PACKAGE_STEP = SCRIPT.findIndex((s) => s.kind === "package")
const LOAD_STEPS = SCRIPT.reduce<number[]>(
    (acc, s, i) => (s.kind === "loading" ? [...acc, i] : acc),
    [],
)
/** How many formats have finished rendering by the time we reach `step`. */
const builtAt = (step: number) => LOAD_STEPS.filter((i) => i < step).length

/**
 * The two windows keep a chat's shape — a code block and a composer below it —
 * but on a neutral scale rather than any product's brand colours. The code
 * keeps its hot syntax palette; the chrome stays out of its way.
 */
const SURFACE = "#FAFAFA"
const HEADER = "#F4F4F5"
const LINE = "#E4E4E7"
const RULE = "#F1F1F3"
const TEXT = "#27272A"
const MUTED = "#71717A"
const ACCENT = "#3F3F46"

const MONO =
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const EASE = "cubic-bezier(0.33, 1, 0.68, 1)"
/** Apple's presentation curve, for a sheet arriving from off-screen. */
const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"

/* ----------------------------------------------------------------- render */

export default function PartnerAgentLoop({ alt }: { alt?: string }) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 0, h: 0 })
    const [visible, setVisible] = useState(true)
    const [reduced, setReduced] = useState(false)

    const [step, setStep] = useState(0)
    const [promptChars, setPromptChars] = useState(0)
    const [typed, setTyped] = useState(0)

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
            { threshold: 0.15 },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    /**
     * Scrolled past and come back to, a hero starts again rather than picking
     * up wherever it was paused. Jumping to the script's last step — its own
     * reset — is what clears the state, and the step after it is the first.
     *
     * `visible` starts true so a suspended IntersectionObserver cannot leave
     * the hero frozen, which means this does nothing on mount beyond a reset
     * of state that is already clear.
     */
    useEffect(() => {
        if (visible) setStep(SCRIPT.length - 1)
    }, [visible])

    useEffect(() => {
        if (!visible || reduced) return
        const cur = SCRIPT[step]
        let ticker: number | undefined

        switch (cur.kind) {
            case "prompt": {
                setPromptChars(0)
                const start = performance.now()
                ticker = window.setInterval(() => {
                    setPromptChars(
                        Math.min(
                            cur.text.length,
                            Math.floor(
                                (performance.now() - start) / PROMPT_CHAR_MS,
                            ),
                        ),
                    )
                }, 33)
                break
            }
            case "code": {
                const total = SNIPPET_CHARS[cur.seg]
                const start = performance.now()
                ticker = window.setInterval(() => {
                    setTyped(
                        Math.min(
                            total,
                            Math.floor((performance.now() - start) / CHAR_MS),
                        ),
                    )
                }, 33)
                break
            }
            case "send":
                // Cleared here rather than when typing starts, so there is a
                // beat of empty file: the rewrite reads as a rewrite.
                setTyped(0)
                break
            case "reset":
                setPromptChars(0)
                setTyped(0)
                break
        }

        const id = window.setTimeout(() => {
            // Settled here rather than inside the interval: a step whose length
            // equals its own typing duration races its final tick, which is how
            // the last reveal of an earlier hero went missing entirely.
            if (cur.kind === "prompt") setPromptChars(cur.text.length)
            if (cur.kind === "code") setTyped(SNIPPET_CHARS[cur.seg])
            setStep((s) => (s + 1) % SCRIPT.length)
        }, cur.ms)

        return () => {
            window.clearTimeout(id)
            if (ticker) window.clearInterval(ticker)
        }
    }, [step, visible, reduced])

    const cur = SCRIPT[step]
    /**
     * While the next instruction is still being typed the file keeps the
     * snippet it already holds; from the moment that instruction is sent it
     * holds the new one, empty, and fills from the first line.
     */
    const fileSeg = reduced
        ? SNIPPETS.length - 1
        : cur.kind === "reset"
          ? -1
          : // The sign-off steps sit one past the last snippet, so that the
            // file keeps the final format's code while the approval is typed
            // rather than stepping back a format. Clamped, because there is
            // no snippet at that index to look up.
            cur.kind === "prompt"
            ? Math.min(cur.seg - 1, SNIPPETS.length - 1)
            : Math.min(cur.seg, SNIPPETS.length - 1)
    const snippet = fileSeg < 0 ? [] : SNIPPETS[fileSeg]
    const ends = fileSeg < 0 ? [] : ENDS[fileSeg]
    const shown =
        fileSeg < 0
            ? 0
            : reduced || cur.kind === "prompt"
              ? SNIPPET_CHARS[fileSeg]
              : typed

    /**
     * Everything the phone shows is derived from where the script is, rather
     * than tracked beside it — the one reveal bug that has bitten this
     * codebase twice came from keeping a second copy of this state.
     */
    const built = reduced ? FORMATS.length : builtAt(step)
    const loading = !reduced && cur.kind === "loading"
    /**
     * Which format the sheet holds changes only while the grey is up, so one
     * is never seen becoming another. The sheet itself is off the bottom edge
     * for the whole of that, and presents from there once the format behind
     * the grey is the finished one.
     */
    const sheetH = built === 0 ? 0 : SHEET_H[built - 1]
    const sheetOut = loading || sheetH === 0
    /** The partner's page arrives once the agent has taken the job. */
    const pageOn = reduced || (step >= AGENT_STEP && cur.kind !== "reset")
    const working =
        cur.kind === "agent" || cur.kind === "loading" || cur.kind === "code"
    /** The folder is up from the moment it compiles until the loop resets. */
    const packaged = !reduced && step >= PACKAGE_STEP && cur.kind !== "reset"
    const promptText = reduced
        ? PROMPT
        : ((): string => {
              for (let i = step; i >= 0; i--) {
                  const s = SCRIPT[i]
                  if (s.kind === "prompt") return s.text
              }
              return PROMPT
          })()
    const sent = reduced || promptChars >= promptText.length
    /** The field is live while it is being typed into or about to be sent. */
    const composing = !reduced && (cur.kind === "prompt" || cur.kind === "send")

    // The phone is height-led; the file and composer take what is left. Below
    // this they stop fitting beside it and are dropped rather than squeezed
    // into illegibility.
    const SIDE_BY_SIDE = box.w >= 640
    const pad = box.w < 480 ? 16 : 28
    const gap = 24
    const LABEL_H = 24
    const availH = Math.max(0, box.h - pad * 2 - LABEL_H)
    const phoneH = SIDE_BY_SIDE
        ? Math.min(availH, (box.w - pad * 2 - gap) * 0.46 * (FRAME_H / FRAME_W))
        : availH
    const phoneW = phoneH * (FRAME_W / FRAME_H)
    const colW = Math.max(0, box.w - pad * 2 - gap - phoneW)

    const fontSize = colW > 380 ? 12 : 11
    const lineH = Math.round(fontSize * 1.55)
    const gutterW = Math.round(fontSize * 2.2)

    const caretStyle = {
        display: "inline-block",
        width: 1.5,
        height: fontSize * 1.1,
        background: TEXT,
        marginLeft: 1,
        verticalAlign: "text-bottom",
    } as const

    const card = {
        border: `1px solid ${LINE}`,
        overflow: "hidden",
        background: "#FFFFFF",
        boxShadow:
            "0 8px 24px rgba(43,42,39,0.07), 0 1px 3px rgba(43,42,39,0.05)",
        textDecoration: "none",
    } as const

    return (
        <div
            ref={wrapRef}
            role="img"
            aria-label={
                alt ??
                "A prompt asks an agent to build mocks for a brand-new partner, Home Depot. An empty iPhone fills in with the partner's confirmation page, and then, one request at a time, the agent appends each ad format to a file and the phone builds it."
            }
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                // The hero pane wraps its media in a link, and an anchor's
                // underline is inherited by text.
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
                                width: colW,
                                display: "flex",
                                flexDirection: "column",
                                gap: 14,
                            }}
                        >
                            {/* 1 — the file the agent writes, as a code block
                                in the conversation. */}
                            <div
                                style={{
                                    ...card,
                                    borderRadius: 12,
                                    position: "relative",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "9px 12px",
                                        background: HEADER,
                                        borderBottom: `1px solid ${LINE}`,
                                    }}
                                >
                                    <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        style={{ display: "block" }}
                                    >
                                        <path
                                            d="M6 4.5L2.5 8 6 11.5M10 4.5L13.5 8 10 11.5"
                                            stroke={MUTED}
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <span
                                        style={{
                                            flex: 1,
                                            fontFamily: MONO,
                                            fontSize: fontSize - 1,
                                            letterSpacing: "0.01em",
                                            color: MUTED,
                                        }}
                                    >
                                        {FILE_NAME}
                                    </span>
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        style={{ display: "block" }}
                                    >
                                        <rect
                                            x="5.4"
                                            y="5.4"
                                            width="8.2"
                                            height="8.2"
                                            rx="2"
                                            stroke={MUTED}
                                            strokeWidth="1.4"
                                        />
                                        <path
                                            d="M10.6 3.2A1.8 1.8 0 0 0 9 2.4H4.2A1.8 1.8 0 0 0 2.4 4.2V9c0 .7.4 1.3 1 1.6"
                                            stroke={MUTED}
                                            strokeWidth="1.4"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        padding: "10px 0 14px",
                                        fontFamily: MONO,
                                        fontSize,
                                        lineHeight: `${lineH}px`,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: gutterW,
                                            flexShrink: 0,
                                            textAlign: "right",
                                            paddingRight: 8,
                                            marginRight: 10,
                                            borderRight: `1px solid ${RULE}`,
                                            color: "#C9C4BC",
                                        }}
                                    >
                                        {Array.from(
                                            { length: MAX_LINES },
                                            (_, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        height: lineH,
                                                        opacity:
                                                            i < snippet.length
                                                                ? 1
                                                                : 0,
                                                    }}
                                                >
                                                    {i + 1}
                                                </div>
                                            ),
                                        )}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {Array.from(
                                            { length: MAX_LINES },
                                            (_, i) => i,
                                        ).map((i) => {
                                            const line = snippet[i]
                                            if (!line)
                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            height: lineH,
                                                        }}
                                                    />
                                                )
                                            const start =
                                                i === 0 ? 0 : ends[i - 1]
                                            const avail = shown - start
                                            if (avail <= 0)
                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            height: lineH,
                                                        }}
                                                    />
                                                )
                                            let left =
                                                avail -
                                                INDENT.length * line.indent
                                            const typingHere =
                                                !reduced &&
                                                cur.kind === "code" &&
                                                shown < ends[i]
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        height: lineH,
                                                        whiteSpace: "pre",
                                                        overflow: "hidden",
                                                        // The line being
                                                        // written is marked,
                                                        // so the eye connects
                                                        // the field above to
                                                        // what it is producing.
                                                        background: typingHere
                                                            ? "rgba(39,39,42,0.05)"
                                                            : "transparent",
                                                    }}
                                                >
                                                    {INDENT.repeat(line.indent)}
                                                    {line.tokens.map(
                                                        ([text, kind], j) => {
                                                            if (left <= 0)
                                                                return null
                                                            const slice =
                                                                text.slice(
                                                                    0,
                                                                    left,
                                                                )
                                                            left -= text.length
                                                            return (
                                                                <span
                                                                    key={j}
                                                                    style={{
                                                                        color: INK[
                                                                            kind
                                                                        ],
                                                                        fontWeight:
                                                                            kind ===
                                                                                "k" ||
                                                                            kind ===
                                                                                "f"
                                                                                ? 600
                                                                                : 400,
                                                                    }}
                                                                >
                                                                    {slice}
                                                                </span>
                                                            )
                                                        },
                                                    )}
                                                    {!reduced &&
                                                        cur.kind === "code" &&
                                                        shown < ends[i] && (
                                                            <span
                                                                className="code-caret"
                                                                style={
                                                                    caretStyle
                                                                }
                                                            />
                                                        )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* The folder, over the file it was compiled
                                    from. Laid over rather than swapped in so
                                    the code stays mounted underneath and the
                                    pane cannot change height as it arrives. */}
                                {packaged && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: "#FFFFFF",
                                            display: "flex",
                                            flexDirection: "column",
                                            animation: `agent-folder-in ${Math.round(PACKAGE_MS * 0.8)}ms ${EASE} both`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                padding: "9px 12px",
                                                background: HEADER,
                                                borderBottom: `1px solid ${LINE}`,
                                            }}
                                        >
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                                style={{ display: "block" }}
                                            >
                                                <path
                                                    d="M1.8 4.2a1.4 1.4 0 0 1 1.4-1.4h2.6l1.3 1.6h4.9a1.4 1.4 0 0 1 1.4 1.4v6a1.4 1.4 0 0 1-1.4 1.4H3.2a1.4 1.4 0 0 1-1.4-1.4z"
                                                    fill={ACCENT}
                                                />
                                            </svg>
                                            <span
                                                style={{
                                                    flex: 1,
                                                    fontFamily: MONO,
                                                    fontSize: fontSize - 1,
                                                    letterSpacing: "0.01em",
                                                    color: TEXT,
                                                }}
                                            >
                                                {FOLDER_NAME}/
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: FONT_FAMILY,
                                                    fontSize: fontSize - 1.5,
                                                    fontWeight: 600,
                                                    color: "#3F7A54",
                                                }}
                                            >
                                                Download
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                padding: "8px 12px",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                gap: 1,
                                            }}
                                        >
                                            {FORMATS.map((f, i) => (
                                                <div
                                                    key={f.src}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 7,
                                                        fontFamily: MONO,
                                                        fontSize: fontSize - 1,
                                                        lineHeight: `${lineH}px`,
                                                        color: MUTED,
                                                        // Each file lands in
                                                        // turn, so the folder
                                                        // fills rather than
                                                        // appears full.
                                                        animation: `agent-folder-in ${Math.round(PACKAGE_MS * 0.5)}ms ${EASE} ${Math.round(i * PACKAGE_MS * 0.11)}ms both`,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color: "#3F7A54",
                                                        }}
                                                    >
                                                        ✓
                                                    </span>
                                                    <span>
                                                        {f.label
                                                            .toLowerCase()
                                                            .replace(
                                                                /[^a-z0-9]+/g,
                                                                "-",
                                                            )}
                                                        .png
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 2 — the composer. It is the thing driving the
                                other two, so it is built to look like a field
                                being typed into: named, outlined, ringed while
                                active, and set larger than the code it
                                produces. */}
                            <div style={{ ...card, borderRadius: 16 }}>
                                <div
                                    style={{
                                        padding: "12px 15px 0",
                                        fontFamily: FONT_FAMILY,
                                        fontSize: 9.5,
                                        fontWeight: 600,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        color: MUTED,
                                    }}
                                >
                                    Ask the agent
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-end",
                                        gap: 10,
                                        margin: "9px 12px 12px",
                                        padding: "11px 11px 11px 14px",
                                        borderRadius: 12,
                                        background: "#FFFFFF",
                                        border: `1.5px solid ${composing ? TEXT : LINE}`,
                                        boxShadow: composing
                                            ? "0 0 0 3px rgba(39,39,42,0.09)"
                                            : "none",
                                        transition: `border-color 220ms ${EASE}, box-shadow 220ms ${EASE}`,
                                    }}
                                >
                                    <span
                                        style={{
                                            flex: 1,
                                            // Two lines are always reserved.
                                            // Letting the field grow with the
                                            // text moved the whole column,
                                            // since it is vertically centred.
                                            height: (lineH + 5) * 2,
                                            fontFamily: FONT_FAMILY,
                                            fontSize: fontSize + 4,
                                            fontWeight: 500,
                                            lineHeight: `${lineH + 5}px`,
                                            letterSpacing: "-0.01em",
                                            color: TEXT,
                                            minWidth: 0,
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {promptText.slice(
                                            0,
                                            reduced
                                                ? promptText.length
                                                : promptChars,
                                        )}
                                        {!reduced && composing && (
                                            <span
                                                className="code-caret"
                                                style={{
                                                    ...caretStyle,
                                                    width: 2,
                                                    height: fontSize + 5,
                                                }}
                                            />
                                        )}
                                    </span>
                                    {/* Send. Struck once the prompt is done. */}
                                    <span
                                        style={{
                                            flexShrink: 0,
                                            width: 32,
                                            height: 32,
                                            borderRadius: 999,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: sent ? ACCENT : HEADER,
                                            color: sent ? "#FFFFFF" : "#B5B0A8",
                                            transform:
                                                cur.kind === "send"
                                                    ? "scale(0.86)"
                                                    : "scale(1)",
                                            transition: `background 200ms ${EASE}, color 200ms ${EASE}, transform 180ms ${EASE}`,
                                        }}
                                    >
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                        >
                                            <path
                                                d="M8 13V3.5M8 3.5L4 7.5M8 3.5l4 4"
                                                stroke="currentColor"
                                                strokeWidth="1.9"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </div>

                                {/* What the agent is doing, or how far it got. */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 7,
                                        height: lineH + 16,
                                        padding: "0 13px",
                                        borderTop: `1px solid ${RULE}`,
                                        background: SURFACE,
                                        fontFamily: FONT_FAMILY,
                                        fontSize: fontSize - 0.5,
                                        color: working ? MUTED : "#3F7A54",
                                        opacity: working || built > 0 ? 1 : 0,
                                        transition: `opacity 240ms ${EASE}, color 240ms ${EASE}`,
                                    }}
                                >
                                    {working ? (
                                        <>
                                            <span
                                                className="agent-spin"
                                                style={{
                                                    width: 11,
                                                    height: 11,
                                                    borderRadius: 999,
                                                    border: `1.6px solid ${LINE}`,
                                                    borderTopColor: ACCENT,
                                                    display: "block",
                                                }}
                                            />
                                            <span>
                                                Running full build as agent
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span>✓</span>
                                            <span>
                                                {packaged
                                                    ? `Approved — ${FORMATS.length} files ready`
                                                    : `${built} of ${FORMATS.length} formats built`}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3 — the phone. */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6,
                            flexShrink: 0,
                        }}
                    >
                        <div
                            aria-hidden="true"
                            style={{
                                height: LABEL_H - 6,
                                display: "flex",
                                alignItems: "center",
                                fontSize: 9.5,
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                color: "#94A3B8",
                                opacity: sheetH === 0 ? 0 : 1,
                                transition: `opacity 260ms ${EASE}`,
                            }}
                        >
                            {FORMATS[Math.max(0, built - 1)].label}
                        </div>

                        <PhoneShell width={phoneW}>
                            {(px) => (
                                <>
                                    {/* The partner's page. Nothing is inside
                                        the phone until the agent has taken the
                                        job. */}
                                    <img
                                        src={`${BASE}/page.jpg`}
                                        alt=""
                                        loading="eager"
                                        // The class is what carries the
                                        // arrival, and it is only on while the
                                        // page is. Taking it off at the reset
                                        // is what lets it play again next loop.
                                        className={
                                            pageOn ? "agent-page-in" : undefined
                                        }
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                            objectFit: "cover",
                                            opacity: pageOn ? 1 : 0,
                                            transition: `opacity ${PAGE_FADE_MS}ms ${EASE}`,
                                            animationDuration: `${PAGE_IN_MS}ms`,
                                        }}
                                    />

                                    {/* The design's own scrim: black at 40%,
                                        read off the overlay layer's export. It
                                        rises and falls with the sheet. */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: "rgba(0,0,0,0.4)",
                                            opacity: sheetOut ? 0 : 1,
                                            transition: `opacity ${SHEET_MS}ms ${SHEET_EASE}`,
                                        }}
                                    />

                                    {/* The sheet's shadow. It cannot live on
                                        the sheet itself, because the sheet is
                                        clipped to its current height and a
                                        box-shadow is clipped away with it. */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: px(SCREEN_H - MAX_SHEET_H),
                                            width: "100%",
                                            height: px(MAX_SHEET_H),
                                            borderTopLeftRadius: px(SHEET_R),
                                            borderTopRightRadius: px(SHEET_R),
                                            boxShadow: `0 ${-px(3)}px ${px(20)}px rgba(16,24,40,0.18)`,
                                            transform: `translate3d(0, ${px(MAX_SHEET_H - sheetH) + (sheetOut ? px(MAX_SHEET_H) : 0)}px, 0)`,
                                            transition: `transform ${SHEET_MS}ms ${SHEET_EASE}`,
                                            opacity: sheetH === 0 ? 0 : 1,
                                        }}
                                    />

                                    {/* The sheet. The clip picks out the
                                        current format's height and never
                                        animates — inset()'s own `round` keeps
                                        the corners on that edge — so the only
                                        thing that moves is the slide up from
                                        off-screen. White, so the padding above
                                        each format is the sheet's own ground. */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: px(SCREEN_H - MAX_SHEET_H),
                                            width: "100%",
                                            height: px(MAX_SHEET_H),
                                            background: "#FFFFFF",
                                            clipPath: `inset(${px(MAX_SHEET_H - sheetH)}px 0px 0px 0px round ${px(SHEET_R)}px ${px(SHEET_R)}px 0px 0px)`,
                                            transform: `translate3d(0, ${sheetOut ? px(MAX_SHEET_H) : 0}px, 0)`,
                                            transition: `transform ${SHEET_MS}ms ${SHEET_EASE}`,
                                        }}
                                    >
                                        {/* Only the format being shown is
                                            mounted as visible. One leaves
                                            entirely before the next arrives,
                                            so there is nothing to blend. */}
                                        {FORMATS.map((f, i) => (
                                            <img
                                                key={f.src}
                                                src={`${BASE}/${f.src}`}
                                                alt=""
                                                loading="eager"
                                                style={{
                                                    position: "absolute",
                                                    left: 0,
                                                    bottom: 0,
                                                    width: "100%",
                                                    height: px(f.h),
                                                    display: "block",
                                                    opacity:
                                                        i === built - 1 ? 1 : 0,
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* The preview re-rendering: the inside of
                                        the phone greys over and spins, the
                                        format swaps underneath, and the grey
                                        lifts off something already finished. */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background:
                                                "rgba(244,244,245,0.88)",
                                            opacity: loading ? 1 : 0,
                                            pointerEvents: "none",
                                            transition: `opacity ${VEIL_MS}ms ${EASE}`,
                                        }}
                                    >
                                        <span
                                            className="agent-spin"
                                            style={{
                                                width: px(46),
                                                height: px(46),
                                                borderRadius: 999,
                                                border: `${px(5)}px solid rgba(39,39,42,0.18)`,
                                                borderTopColor: ACCENT,
                                                display: "block",
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </PhoneShell>
                    </div>
                </div>
            )}
        </div>
    )
}
