import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Cursor from "./Cursor"
import { RoktWordmark } from "./icons"
import ShoppablePhone, { FRAME_H, FRAME_W, type Stage } from "./ShoppablePhone"
import { cycleMs, type LoopReporter } from "./LoopProgress"

/**
 * The second hero variant: a cursor works the demo platform's configuration
 * panel — switching components on and filling in fields — while the placement
 * assembles beside it. Both variants drive the same ShoppablePhone, so the
 * phone's measured geometry is defined once.
 *
 * The panel follows the real tool's design language, with the palette sampled
 * from screenshots of it rather than guessed: a warm neutral ground, white
 * cards with hairline borders, an icon and title per section, a segmented
 * control, and labelled switches.
 */

/* Sampled from the product's own UI. */
const MAGENTA = "#B22473" // the action colour, on pills and switches
const WORDMARK = "#C53986" // the logo's lighter magenta
const PAGE = "#FCFCFB"
const CARD = "#FFFFFF"
const BORDER = "#E5E3DE"
const TRACK = "#F3F2EF"
/** 4.63:1 against white. The 12px label needs 4.5, so this is close to
 * as light as the green can go and still be readable. */
const SUCCESS = "#078650"
const INK = "#1C1B19"
const MUTED = "#5C5A55"

type Setting =
    | { kind: "section"; label: string }
    | { kind: "toggle"; title: string; desc: string; stages: Stage[] }
    | {
          kind: "field"
          title: string
          desc: string
          value: string
          stages: Stage[]
      }
type Control = Extract<Setting, { kind: "toggle" | "field" }>

/**
 * Five controls, not nine. Components that were only ever going to be switched
 * together now share one switch — the sheet never appears without the page
 * under it, the greeting never without the headline beside it, and the two
 * buttons are a pair. A control per layer was an inventory, not a tool.
 *
 * Each row states what it is and what it does, with its control on the right
 * and a rule between rows, so every row carries its own two levels.
 */
const SETTINGS: Setting[] = [
    { kind: "section", label: "Placement" },
    {
        kind: "toggle",
        title: "Offer placement",
        desc: "The retailer's page, with the sheet over it.",
        stages: ["background", "sheet"],
    },
    { kind: "section", label: "Content" },
    {
        kind: "field",
        title: "Headline",
        desc: "The greeting and the line they read first.",
        value: "30% off unlocked",
        stages: ["greeting", "headline"],
    },
    {
        kind: "toggle",
        title: "Product media",
        desc: "Shipping banner and the product gallery.",
        stages: ["accessory", "images"],
    },
    {
        kind: "field",
        title: "Product title",
        desc: "Shown beneath the gallery.",
        value: "Stagg EKG Kettle",
        stages: ["details"],
    },
    { kind: "section", label: "Actions" },
    {
        kind: "toggle",
        title: "Offer buttons",
        desc: "Claim and decline, as a pair.",
        stages: ["buttonPrimary", "buttonDecline"],
    },
]

/* Panel metrics, so the cursor can be aimed without measuring the DOM. */
const BAR_H = 46
const PAD_X = 16
const PAD_Y = 16
const SECTION_H = 22
const ROW_PAD = 9
const TITLE_H = 16
const DESC_H = 14
const INPUT_H = 30
const TOGGLE_H = ROW_PAD + TITLE_H + DESC_H + ROW_PAD
const FIELD_H = ROW_PAD + TITLE_H + DESC_H + 7 + INPUT_H + ROW_PAD
const BTN_H = 44
const FOOT_H = PAD_Y + BTN_H
const SWITCH_W = 38
const SWITCH_H = 22

/** One pass over the settings, producing an absolute y for every row. */
const { ROW_TOP, CONTROLS, PANEL_H } = (() => {
    const tops: number[] = []
    const controls: { c: Control; row: number; y: number }[] = []
    let y = BAR_H + PAD_Y
    SETTINGS.forEach((r, i) => {
        tops[i] = y
        if (r.kind === "section") y += SECTION_H
        else {
            controls.push({ c: r, row: i, y })
            y += r.kind === "toggle" ? TOGGLE_H : FIELD_H
        }
    })
    return { ROW_TOP: tops, CONTROLS: controls, PANEL_H: y + PAD_Y + FOOT_H }
})()

/**
 * Pointer travel is timed by distance, not by a constant. A hand crossing the
 * whole panel takes longer than one nudging to the next row, and giving every
 * move the same duration was most of what made the cursor read as a machine.
 */
const MOVE_MIN = 560
const MOVE_MAX = 1500
/**
 * 2.5ms per pixel. At the 1.15 this started on, every hop between controls —
 * they sit roughly 300-360px apart — came out under the floor, so the clamp
 * flattened all of them to the same minimum and the distance never mattered.
 */
const MS_PER_PX = 2.5
/** A beat after arriving, before the click. Nobody lands and clicks at once. */
const DWELL_MS = 260
const PRESS_MS = 300
const CHAR_MS = 68
const SETTLE_MS = 380
const COPY_MS = 520
const HOLD_MS = 3200

type Step =
    /** `ms` is filled in at runtime from how far the pointer has to travel. */
    | { kind: "move"; c: number; ms: number }
    | { kind: "aim"; ms: number }
    | { kind: "press"; c: number; ms: number }
    | { kind: "type"; c: number; ms: number }
    | { kind: "copy"; ms: number }
    | { kind: "hold"; ms: number }
    | { kind: "reset"; ms: number }

const SCRIPT: Step[] = (() => {
    const steps: Step[] = []
    CONTROLS.forEach(({ c }, i) => {
        steps.push({ kind: "move", c: i, ms: 0 })
        steps.push({ kind: "hold", ms: DWELL_MS })
        steps.push({ kind: "press", c: i, ms: PRESS_MS })
        if (c.kind === "field") {
            steps.push({ kind: "type", c: i, ms: c.value.length * CHAR_MS })
        }
        steps.push({ kind: "hold", ms: SETTLE_MS })
    })
    // The share button is reached the same way as everything else: travel,
    // settle, press, and only then does it report back.
    steps.push({ kind: "aim", ms: 0 })
    steps.push({ kind: "hold", ms: DWELL_MS })
    steps.push({ kind: "press", c: -1, ms: PRESS_MS })
    steps.push({ kind: "copy", ms: COPY_MS })
    steps.push({ kind: "hold", ms: HOLD_MS })
    steps.push({ kind: "reset", ms: 60 })
    return steps
})()

/** How long one pass of the script takes. */
const CYCLE = cycleMs(SCRIPT.map((s) => s.ms))

/** Where the pointer sits for a control, or for the share button at -1. */
function cursorTarget(ci: number, panelW: number) {
    if (ci < 0) return { x: panelW / 2, y: PANEL_H - PAD_Y - BTN_H / 2 }
    const { c, y } = CONTROLS[ci]
    return c.kind === "toggle"
        ? {
              x: panelW - PAD_X - SWITCH_W / 2,
              y: y + ROW_PAD + (TITLE_H + DESC_H) / 2,
          }
        : {
              x: PAD_X + 36,
              y: y + ROW_PAD + TITLE_H + DESC_H + 7 + INPUT_H / 2,
          }
}

const EASE = "cubic-bezier(0.33, 1, 0.68, 1)"

/**
 * The pointer's two axes are driven separately, on curves that disagree: one
 * axis covers most of its distance early while the other lags and catches up.
 * A single transform transition interpolates between two points in a straight
 * line by definition, which is what made the movement look mechanical no
 * matter how it was timed. Out of step, the two axes trace an arc.
 *
 * The pairing alternates on every move, so consecutive travels bow opposite
 * ways rather than repeating one signature curve.
 */
const LEAD = "cubic-bezier(0.18, 0.72, 0.28, 1)"
const LAG = "cubic-bezier(0.68, 0.02, 0.42, 1)"
const ARCS = [
    { x: LEAD, y: LAG },
    { x: LAG, y: LEAD },
]
/** The press dip is its own beat, not part of the travel. */
const PRESS_EASE = "cubic-bezier(0.33, 1, 0.68, 1)"

export default function ShoppableConfigLoop({
    alt,
    onProgress,
}: {
    alt?: string
    onProgress?: LoopReporter
}) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 0, h: 0 })
    const [step, setStep] = useState(0)
    const [visible, setVisible] = useState(true)
    const [reduced, setReduced] = useState(false)
    const [on, setOn] = useState<Stage[]>([])
    const [typed, setTyped] = useState<Record<number, number>>({})
    const [cursorAt, setCursorAt] = useState(0)
    const [pressing, setPressing] = useState(false)
    const [atFooter, setAtFooter] = useState(false)
    const [copied, setCopied] = useState(false)
    const [moveMs, setMoveMs] = useState(MOVE_MIN)
    const [arc, setArc] = useState(0)
    /** Last render's panel width, for timing travel inside the step effect. */
    const panelWRef = useRef(0)
    const cursorPos = useRef({ x: 0, y: 0 })

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

    /**
     * The loop indicator's readout. One call a pass, carrying how long the
     * pass takes and which pass it is, so the bar sweeps once over the whole
     * cycle rather than stepping along with the script.
     */
    const passes = useRef(0)
    useEffect(() => {
        if (step !== 0) return
        passes.current += 1
        onProgress?.(CYCLE, passes.current)
    }, [step, onProgress])

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
        const current = SCRIPT[step]
        let typer: number | undefined
        // A control and the components it drives change in the same frame. An
        // earlier version staggered the second component of a pair by 170ms,
        // which read as one switch causing two separate events — the phone
        // lagging the panel. The pieces still arrive in order, because their
        // own transitions differ in length: the page fades over 320ms while
        // the sheet rises over 560ms.
        const turnOn = (stages: Stage[]) =>
            setOn((prev) => [
                ...prev,
                ...stages.filter((s) => !prev.includes(s)),
            ])

        // A move's duration comes from the distance it covers, so the pointer
        // keeps a roughly even speed instead of teleporting short hops and
        // crawling long ones.
        let ms = current.ms
        const travelTo = (ci: number) => {
            const to = cursorTarget(ci, panelWRef.current)
            const from = cursorPos.current
            const dist = Math.hypot(to.x - from.x, to.y - from.y)
            cursorPos.current = to
            const dur = Math.min(
                MOVE_MAX,
                Math.max(MOVE_MIN, Math.round(dist * MS_PER_PX)),
            )
            setMoveMs(dur)
            setArc((a) => 1 - a)
            setPressing(false)
            return dur
        }

        switch (current.kind) {
            case "move":
                ms = travelTo(current.c)
                setCursorAt(current.c)
                break
            case "aim":
                ms = travelTo(-1)
                setAtFooter(true)
                break
            case "press": {
                setPressing(true)
                if (current.c < 0) break
                const { c } = CONTROLS[current.c]
                if (c.kind === "toggle") turnOn(c.stages)
                break
            }
            case "type": {
                setPressing(false)
                const { c } = CONTROLS[current.c]
                if (c.kind !== "field") break
                const start = performance.now()
                typer = window.setInterval(() => {
                    setTyped((prev) => ({
                        ...prev,
                        [current.c]: Math.min(
                            c.value.length,
                            Math.floor((performance.now() - start) / CHAR_MS),
                        ),
                    }))
                }, 33)
                break
            }
            case "copy":
                setPressing(false)
                setCopied(true)
                break
            case "reset":
                setOn([])
                setTyped({})
                setCursorAt(0)
                setPressing(false)
                setAtFooter(false)
                setCopied(false)
                cursorPos.current = cursorTarget(0, panelWRef.current)
                break
            case "hold":
                setPressing(false)
                break
        }

        const id = window.setTimeout(() => {
            // Completion is settled here, not inside the typing interval: the
            // step's duration is exactly the typing duration, so clearing the
            // interval raced its final tick and the two field-driven
            // components never switched on at all.
            if (current.kind === "type") {
                const { c } = CONTROLS[current.c]
                if (c.kind === "field") {
                    setTyped((prev) => ({
                        ...prev,
                        [current.c]: c.value.length,
                    }))
                    turnOn(c.stages)
                }
            }
            setStep((s) => (s + 1) % SCRIPT.length)
        }, ms)

        return () => {
            window.clearTimeout(id)
            if (typer) window.clearInterval(typer)
        }
    }, [step, visible, reduced])

    const isDone = (stage: Stage) => reduced || on.includes(stage)
    const TOTAL_STAGES = CONTROLS.reduce((n, c) => n + c.c.stages.length, 0)
    const complete = reduced || on.length === TOTAL_STAGES

    // The panel is a fixed height, so a short pane would clip its footer.
    // Below either threshold it drops out and the phone stands alone.
    const SIDE_BY_SIDE = box.w >= 640 && box.h >= PANEL_H + 48
    const pad = box.w < 480 ? 16 : 24
    const gap = 20
    const availH = Math.max(0, box.h - pad * 2)
    const phoneH = SIDE_BY_SIDE
        ? Math.min(availH, (box.w - pad * 2 - gap) * 0.46 * (FRAME_H / FRAME_W))
        : availH
    const phoneW = phoneH * (FRAME_W / FRAME_H)
    const panelW = Math.max(0, box.w - pad * 2 - gap - phoneW)
    panelWRef.current = panelW

    const activeRow = atFooter ? -1 : CONTROLS[cursorAt].row
    const { x: cursorX, y: cursorY } = cursorTarget(
        atFooter ? -1 : cursorAt,
        panelW,
    )

    return (
        <div
            ref={wrapRef}
            role="img"
            aria-label={
                alt ??
                "The Rokt demo platform on the left, where a cursor switches components on and fills in fields, while the shoppable placement assembles on an iPhone to the right."
            }
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
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
                                width: panelW,
                                height: PANEL_H,
                                position: "relative",
                                border: `1px solid ${BORDER}`,
                                borderRadius: 14,
                                background: CARD,
                                boxShadow:
                                    "0 10px 28px rgba(28,27,25,0.10), 0 2px 6px rgba(28,27,25,0.05)",
                                flexShrink: 0,
                            }}
                        >
                            {/* The product's own lock-up: wordmark over a
                                letterspaced descriptor, as on the real tool. */}
                            <div
                                style={{
                                    height: BAR_H,
                                    display: "flex",
                                    alignItems: "center",
                                    padding: `0 ${PAD_X}px`,
                                    borderBottom: `1px solid ${BORDER}`,
                                }}
                            >
                                <div style={{ color: WORDMARK }}>
                                    <RoktWordmark height={13} />
                                    <span
                                        style={{
                                            display: "block",
                                            marginTop: 3,
                                            fontSize: 8,
                                            fontWeight: 600,
                                            letterSpacing: "0.16em",
                                            color: MUTED,
                                        }}
                                    >
                                        DEMO PLATFORM
                                    </span>
                                </div>
                                <span
                                    style={{
                                        marginLeft: "auto",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 5,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: complete ? MAGENTA : MUTED,
                                        transition: `color 240ms ${EASE}`,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: 999,
                                            background: complete
                                                ? MAGENTA
                                                : "#C9C6C0",
                                            transition: `background 240ms ${EASE}`,
                                        }}
                                    />
                                    {complete ? "Ready" : "Draft"}
                                </span>
                            </div>

                            {SETTINGS.map((r, i) => {
                                const top = ROW_TOP[i]
                                if (r.kind === "section") {
                                    return (
                                        <div
                                            key={`s${i}`}
                                            style={{
                                                position: "absolute",
                                                left: PAD_X,
                                                top,
                                                width: panelW - PAD_X * 2,
                                                height: SECTION_H,
                                                display: "flex",
                                                alignItems: "flex-end",
                                                paddingBottom: 5,
                                                fontSize: 9.5,
                                                fontWeight: 600,
                                                letterSpacing: "0.09em",
                                                textTransform: "uppercase",
                                                color: MUTED,
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            {r.label}
                                        </div>
                                    )
                                }

                                const ci = CONTROLS.findIndex(
                                    (c) => c.row === i,
                                )
                                const isOn = on.includes(r.stages[0])
                                const focused =
                                    cursorAt === ci && !isOn && !atFooter
                                // A rule between rows, not above the first in
                                // a section — the section label already breaks
                                // there.
                                const prev = SETTINGS[i - 1]
                                const ruled = prev && prev.kind !== "section"

                                return (
                                    <div
                                        key={r.title}
                                        style={{
                                            position: "absolute",
                                            left: PAD_X,
                                            top,
                                            width: panelW - PAD_X * 2,
                                            height:
                                                r.kind === "toggle"
                                                    ? TOGGLE_H
                                                    : FIELD_H,
                                            borderTop: ruled
                                                ? `1px solid ${BORDER}`
                                                : "none",
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 12,
                                                paddingTop: ROW_PAD,
                                            }}
                                        >
                                            <div
                                                style={{ flex: 1, minWidth: 0 }}
                                            >
                                                <div
                                                    style={{
                                                        height: TITLE_H,
                                                        fontSize: 12.5,
                                                        fontWeight: 650,
                                                        letterSpacing:
                                                            "-0.012em",
                                                        color: isOn
                                                            ? INK
                                                            : "#3C3B37",
                                                        transition: `color 220ms ${EASE}`,
                                                    }}
                                                >
                                                    {r.title}
                                                </div>
                                                <div
                                                    style={{
                                                        height: DESC_H,
                                                        fontSize: 10.5,
                                                        lineHeight: `${DESC_H}px`,
                                                        color: MUTED,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {r.desc}
                                                </div>
                                            </div>

                                            {r.kind === "toggle" && (
                                                <span
                                                    style={{
                                                        width: SWITCH_W,
                                                        height: SWITCH_H,
                                                        borderRadius: 999,
                                                        background: isOn
                                                            ? MAGENTA
                                                            : "#DEDBD5",
                                                        position: "relative",
                                                        flexShrink: 0,
                                                        marginTop: 3,
                                                        transition: `background 240ms ${EASE}`,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            top: 2,
                                                            left: isOn
                                                                ? SWITCH_W -
                                                                  SWITCH_H +
                                                                  2
                                                                : 2,
                                                            width: SWITCH_H - 4,
                                                            height:
                                                                SWITCH_H - 4,
                                                            borderRadius: 999,
                                                            background:
                                                                "#FFFFFF",
                                                            boxShadow:
                                                                "0 1px 3px rgba(28,27,25,0.3)",
                                                            transition: `left 240ms ${EASE}`,
                                                        }}
                                                    />
                                                </span>
                                            )}
                                        </div>

                                        {r.kind === "field" && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    marginTop: 7,
                                                    height: INPUT_H,
                                                    padding: "0 10px",
                                                    background: CARD,
                                                    border: `1px solid ${focused ? MAGENTA : "#DEDBD5"}`,
                                                    boxShadow: focused
                                                        ? "0 0 0 3px rgba(178,36,115,0.12)"
                                                        : "none",
                                                    borderRadius: 9,
                                                    fontSize: 12,
                                                    color: INK,
                                                    boxSizing: "border-box",
                                                    transition: `border-color 200ms ${EASE}, box-shadow 200ms ${EASE}`,
                                                }}
                                            >
                                                {r.value.slice(
                                                    0,
                                                    typed[ci] ?? 0,
                                                )}
                                                {cursorAt === ci &&
                                                    (typed[ci] ?? 0) <
                                                        r.value.length && (
                                                        <span
                                                            className="code-caret"
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                width: 1.5,
                                                                height: 14,
                                                                background: INK,
                                                                marginLeft: 1,
                                                            }}
                                                        />
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {/* The action the panel exists to reach, in its three states:
                        unavailable until the demo is built, then the action
                        itself, then a success state once the link is on the
                        clipboard. */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: PAD_X,
                                    right: PAD_X,
                                    bottom: PAD_Y,
                                    height: BTN_H,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 7,
                                    borderRadius: 9,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: complete ? "#FFFFFF" : "#A8A49C",
                                    background: copied
                                        ? SUCCESS
                                        : complete
                                          ? MAGENTA
                                          : TRACK,
                                    border: `1px solid ${copied ? SUCCESS : complete ? MAGENTA : BORDER}`,
                                    boxSizing: "border-box",
                                    transition: `background 300ms ${EASE}, color 300ms ${EASE}, border-color 300ms ${EASE}`,
                                }}
                            >
                                {copied && (
                                    <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        aria-hidden="true"
                                        style={{ display: "block" }}
                                    >
                                        <circle
                                            cx="8"
                                            cy="8"
                                            r="7"
                                            fill="rgba(255,255,255,0.22)"
                                        />
                                        <path
                                            d="M4.9 8.2l2.1 2.1 4.1-4.4"
                                            stroke="#FFFFFF"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                                {copied ? "Link copied" : "Share demo"}
                            </div>

                            {/* The cursor. Horizontal travel, vertical travel
                                and the press dip are three nested elements, so
                                each can run on its own curve — the two travel
                                axes deliberately out of step to bend the
                                path. */}
                            <span
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    transform: `translate3d(${cursorX}px, 0, 0)`,
                                    transition: `transform ${moveMs}ms ${ARCS[arc].x}`,
                                    pointerEvents: "none",
                                    zIndex: 3,
                                }}
                            >
                                <span
                                    style={{
                                        display: "block",
                                        transform: `translate3d(0, ${cursorY}px, 0)`,
                                        transition: `transform ${moveMs}ms ${ARCS[arc].y}`,
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "block",
                                            transform: `scale(${pressing ? 0.86 : 1})`,
                                            // The shared cursor puts its tip
                                            // at the origin, so the press
                                            // pivots on the tip.
                                            transformOrigin: "0 0",
                                            transition: `transform ${PRESS_MS / 2}ms ${PRESS_EASE}`,
                                        }}
                                    >
                                        <Cursor size={22} />
                                        {pressing && (
                                            <span
                                                className="uber-tap"
                                                style={{
                                                    left: 0,
                                                    top: 0,
                                                    width: 26,
                                                    height: 26,
                                                    marginLeft: -13,
                                                    marginTop: -13,
                                                }}
                                            />
                                        )}
                                    </span>
                                </span>
                            </span>
                        </div>
                    )}

                    <ShoppablePhone width={phoneW} isDone={isDone} />
                </div>
            )}
        </div>
    )
}
