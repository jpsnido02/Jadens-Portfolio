/**
 * The Macy's bag page hero: the Netlify prototype, running.
 *
 * The project was a prototype of Macy's bag page carrying a Rokt placement,
 * and the thing worth showing is not the page but what happens on it — an
 * exclusive discount sits greyed out until something from "Suggested for you"
 * goes in the bag, and then the whole card comes alive. A screenshot cannot
 * say that, so this replays it.
 *
 * The markup and the stylesheet are ported from that prototype rather than
 * reinterpreted, so the hero is the same page: same grid, same type scale,
 * same three states on the add-to-bag control, same timings. The page lays out
 * at its natural 1920px inside the laptop and the shell scales the rendered
 * result, which keeps every layout metric intact however small the hero gets.
 * Shrinking the font sizes instead would have rounded the layout to pieces.
 *
 * Prices are computed from the same product data the prototype used, so the
 * order summary adds up rather than being written down.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Cursor from "./Cursor"

/* -------------------------------------------------------------------------
 * The frame. A plain bordered rectangle rather than a device: the page is
 * dense, and a laptop's bezel, chin and base were taking roughly a third of
 * the pane away from the thing worth looking at. The viewport is kept just
 * wider than the page's own 1464px max-width for the same reason — wide
 * gutters only bought empty white.
 * ---------------------------------------------------------------------- */
const VIEW_W = 1500
/**
 * A screen's worth of page, at the proportions a laptop shows it in. The bag
 * grows past this as things go into it; the camera below is what deals with
 * that, rather than the frame stretching to hold the tallest state and
 * spending most of the loop looking at white.
 */
const VIEW_H = 1150
export const FRAME_W = VIEW_W
export const FRAME_H = VIEW_H
/** Breathing room above the page, inside the frame. Rendered pixels. */
const FRAME_PAD_TOP = 16

/* -------------------------------------------------------------------------
 * Products, from the prototype's own catalogue.
 * ---------------------------------------------------------------------- */
const BASE = "../../projects/macys"

type Product = {
    id: string
    brand: string
    name: string
    size?: string
    color?: string
    price: number
    was?: number
    off?: string
    image: string
}

const SHIPPING = 10.95

const SHIRT: Product = {
    id: "shirt-white",
    brand: "Tommy Hilfiger",
    name: "Men's Regular Fit Wrinkle Resistant Stretch Dress Shirt",
    size: "15.5 34/35",
    color: "White",
    price: 79.99,
    image: `${BASE}/shirt-white.webp`,
}

const EXCLUSIVE: Product = {
    id: "shirt-blue",
    brand: "Tommy Hilfiger",
    name: "Men's Regular Fit Wrinkle Resistant Stretch Dress Shirt",
    size: "15.5 34/35",
    color: "Blue",
    price: 39.99,
    was: 79.99,
    off: "(50% off)",
    image: `${BASE}/shirt-blue.webp`,
}

const PICKS: Product[] = [
    {
        id: "belt",
        brand: "Polo Ralph Lauren",
        name: "Men's Bear Print Leather-Trim Belt",
        price: 24.99,
        image: `${BASE}/belt.webp`,
    },
    {
        id: "tie",
        brand: "Perry Ellis",
        name: "Silk Modern Tie",
        price: 20.99,
        was: 24.69,
        off: "(15% off)",
        image: `${BASE}/tie.webp`,
    },
    {
        id: "cufflinks",
        brand: "Calvin Klein",
        name: "Men's Brushed Silver-Tone Cufflinks",
        price: 14.99,
        was: 18.74,
        off: "(20% off)",
        image: `${BASE}/cufflinks.webp`,
    },
    {
        id: "socks",
        brand: "Polo Ralph Lauren",
        name: "Men's 3-Pk. Over the Calf Mercerized Cotton Rib Dress Socks",
        price: 12.99,
        was: 15.99,
        off: "(19% off)",
        image: `${BASE}/socks.webp`,
    },
    {
        id: "pocket-square",
        brand: "Brooks Brothers",
        name: "Men's Silk Pocket Square",
        price: 18.99,
        was: 24.99,
        off: "(24% off)",
        image: `${BASE}/pocket-square.webp`,
    },
    {
        id: "tie-bar",
        brand: "Tommy Hilfiger",
        name: "Men's Brushed Tie Bar",
        price: 14.99,
        was: 19.99,
        off: "(25% off)",
        image: `${BASE}/tie-bar.webp`,
    },
]

const money = (n: number) => `$${n.toFixed(2)}`
const savingsOf = (p: Product) => (p.was && p.was > p.price ? p.was - p.price : 0)

/* -------------------------------------------------------------------------
 * Timing. The prototype's own durations where it has them — 800ms on the
 * add-to-bag spinner, 320ms on the bag badge — so the hero runs at the speed
 * the thing actually ran at.
 * ---------------------------------------------------------------------- */
/**
 * Timing. The prototype's own durations where it has them — 800ms on the
 * add-to-bag spinner, 320ms on the bag badge — stretched by PACE, because a
 * hero is watched rather than used and the real speeds read as a flicker.
 */
const PACE = 1.45
const ms = (v: number) => Math.round(v * PACE)

const LOADING_MS = ms(800)
const PULSE_MS = ms(320)
const PRESS_MS = ms(300)
const DWELL_MS = ms(320)
const UNLOCK_MS = ms(420)
const CAROUSEL_MS = ms(280)
/** How long a new line takes to open out in the bag. */
const ROW_IN_MS = ms(1100)

/**
 * Pointer travel is timed by distance, so a long reach across the page takes
 * longer than a nudge to the next control. The camera is given this same
 * number whenever the two move together, which is what keeps it feeling like
 * the view is following the hand rather than cutting to wherever it landed.
 */
const MOVE_MIN = ms(620)
const MOVE_MAX = ms(1500)
const MS_PER_PX = 1.25

/* -------------------------------------------------------------------------
 * The camera.
 *
 * A whole retail page shrunk into a hero pane is legible as a shape and not
 * much else, so rather than show all of it all the time the frame moves: it
 * opens on the full page, goes in on the suggestion being added, crosses to
 * the bag to watch the line arrive, then to the discount as it unlocks, and
 * pulls back at the end for the totals.
 *
 * Every move is tied to a pointer move and runs for exactly as long, so the
 * two travel together. Each shot is measured off the laid-out page rather
 * than written down, so it stays right as the bag grows and everything below
 * it shifts down.
 * ---------------------------------------------------------------------- */
const SHOTS = {
    page: null,
    suggest: ".quick-picks",
    bag: ".bag-items",
    unlock: ".exclusive-discount",
} as const
type ShotName = keyof typeof SHOTS

/** Room left around a shot's subject, in page pixels. */
const SHOT_PAD = 70

type Camera = { x: number; y: number; w: number }
const WIDE: Camera = { x: 0, y: 0, w: VIEW_W }

/** Where the pointer can go. Found in the page, not written down. */
const TARGETS = {
    next: ".quick-picks__nav--next",
    pick: ".quick-picks__track > :nth-child(2) .add-to-bag",
    exclusive: ".exclusive-card .add-to-bag",
    bag: ".bag-items",
    totals: ".order-summary__totals",
} as const
type Target = keyof typeof TARGETS

type Step =
    /**
     * A pointer move, and the camera move that goes with it. `ms` is filled
     * in at runtime from how far the pointer has to travel, and the camera
     * borrows it.
     */
    | { kind: "move"; to: Target; shot: ShotName; ms: number }
    | { kind: "press"; to: Target; ms: number }
    | { kind: "load"; who: "pick" | "exclusive"; ms: number }
    /** The control settles green, before anything else moves. */
    | { kind: "cta"; who: "pick" | "exclusive"; ms: number }
    /** The line opens out in the bag, and the totals follow it. */
    | { kind: "add"; who: "pick" | "exclusive"; ms: number }
    | { kind: "unlock"; ms: number }
    | { kind: "hold"; ms: number }
    | { kind: "reset"; ms: number }

const SCRIPT: Step[] = [
    // Open wide, on the page as a whole — but only briefly. Long enough to
    // read the page as a page, short enough that nobody scrolls past a still
    // image waiting for it to do something.
    { kind: "hold", ms: ms(850) },
    // In on the suggestions, pointer first.
    { kind: "move", to: "next", shot: "suggest", ms: 0 },
    { kind: "hold", ms: DWELL_MS },
    { kind: "press", to: "next", ms: PRESS_MS },
    { kind: "hold", ms: CAROUSEL_MS + ms(520) },
    { kind: "move", to: "pick", shot: "suggest", ms: 0 },
    { kind: "hold", ms: DWELL_MS },
    { kind: "press", to: "pick", ms: PRESS_MS },
    { kind: "load", who: "pick", ms: LOADING_MS },
    { kind: "cta", who: "pick", ms: ms(780) },
    // Up to the bag, and only then does the line arrive — the point of going
    // there is to watch it happen, not to find it already there.
    { kind: "move", to: "bag", shot: "bag", ms: 0 },
    { kind: "hold", ms: ms(260) },
    { kind: "add", who: "pick", ms: ROW_IN_MS },
    { kind: "hold", ms: ms(1200) },
    // Down to the discount, which comes up out of grey once we are on it.
    { kind: "move", to: "exclusive", shot: "unlock", ms: 0 },
    { kind: "hold", ms: DWELL_MS },
    { kind: "unlock", ms: UNLOCK_MS + ms(620) },
    { kind: "press", to: "exclusive", ms: PRESS_MS },
    { kind: "load", who: "exclusive", ms: LOADING_MS },
    { kind: "cta", who: "exclusive", ms: ms(700) },
    { kind: "add", who: "exclusive", ms: ms(160) },
    // Pull back for the result: three lines in the bag and the totals.
    { kind: "move", to: "totals", shot: "page", ms: 0 },
    { kind: "hold", ms: ms(3000) },
    { kind: "reset", ms: 60 },
]

/**
 * The pointer's two axes run on curves that disagree, so the path bows instead
 * of running straight between controls. Same technique as the other heroes
 * here; a single transform transition is a straight line by definition.
 */
const LEAD = "cubic-bezier(0.18, 0.72, 0.28, 1)"
const LAG = "cubic-bezier(0.68, 0.02, 0.42, 1)"
const ARCS = [
    { x: LEAD, y: LAG },
    { x: LAG, y: LEAD },
]
const PRESS_EASE = "cubic-bezier(0.33, 1, 0.68, 1)"

function Spinner() {
    return (
        <svg
            className="add-to-bag__spinner"
            width="18"
            height="18"
            viewBox="0 0 22 22"
            aria-hidden="true"
        >
            {Array.from({ length: 8 }, (_, i) => (
                <rect
                    key={i}
                    x="10"
                    y="1.5"
                    width="2"
                    height="5"
                    rx="1"
                    transform={`rotate(${i * 45} 11 11)`}
                    fill="currentColor"
                    opacity={0.25 + (i / 8) * 0.75}
                />
            ))}
        </svg>
    )
}

function Check() {
    return (
        <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
            <circle
                cx="9"
                cy="9"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M5.5 9.2 7.8 11.5 12.5 6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function Lock() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
                d="M3.5 5.5V3.5a2.5 2.5 0 0 1 5 0v2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
            />
            <rect x="2.4" y="5.4" width="7.2" height="5.6" rx="1" fill="currentColor" />
        </svg>
    )
}

function Chevron({ dir }: { dir: "left" | "right" }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
                d={dir === "right" ? "M10 7l5 5-5 5" : "M14 7l-5 5 5 5"}
                fill="none"
                stroke="#000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * One line in the bag. The shirt starts here and everything added joins it,
 * which is what the prototype does — the totals moving on their own was the
 * tell that nothing had really gone in.
 */
function BagRow({ product }: { product: Product }) {
    const onSale = product.was !== undefined && product.was > product.price
    return (
        <article className="bag-item">
            <div className="bag-item__main">
                <img className="bag-item__image" src={product.image} alt="" />
                <div>
                    <p className="bag-item__brand">{product.brand}</p>
                    <p className="bag-item__name">{product.name}</p>
                    {(product.size || product.color) && (
                        <div className="bag-item__meta">
                            {product.size && <p>Size: {product.size}</p>}
                            {product.color && <p>Color: {product.color}</p>}
                        </div>
                    )}
                    <div className="bag-item__pricing">
                        {onSale ? (
                            <>
                                <p className="bag-item__price bag-item__price--sale">
                                    {money(product.price)}{" "}
                                    <span>{product.off}</span>
                                </p>
                                <p className="bag-item__original">
                                    {money(product.was!)}
                                </p>
                            </>
                        ) : (
                            <p className="bag-item__price">
                                {money(product.price)}
                            </p>
                        )}
                    </div>
                    <p className="bag-item__qty">Qty 1</p>
                    <div className="bag-item__links">
                        <span className="text-link">Save for later</span>
                        <span className="text-link">Remove</span>
                    </div>
                </div>
            </div>
            {/* Only the line that opened the bag carries the fulfilment
                column, as in the prototype. */}
            {product.id === SHIRT.id && (
                <div className="bag-item__fulfillment">
                    <div className="fulfillment-option fulfillment-option--on">
                        <i />
                        <span>
                            Deliver to <span className="text-link">10001</span>
                        </span>
                    </div>
                    <p className="fulfillment-detail fulfillment-detail--success">
                        Arrives by Thu, Jun. 25
                    </p>
                    <p className="fulfillment-badge">
                        Eligible for Next-Day Delivery
                    </p>
                    <div className="fulfillment-option fulfillment-option--spaced">
                        <i />
                        <span>
                            Free pickup today at{" "}
                            <span className="text-link">
                                Macy&apos;s Herald Square
                            </span>
                        </span>
                    </div>
                    <p className="fulfillment-detail">Order by 4pm.</p>
                </div>
            )}
        </article>
    )
}

type CtaPhase = "idle" | "loading" | "added"

function AddToBag({
    phase,
    locked,
    label = "Add to bag",
    className = "",
}: {
    phase: CtaPhase
    locked?: boolean
    label?: string
    className?: string
}) {
    const state =
        phase === "loading"
            ? "add-to-bag--loading"
            : phase === "added"
              ? "add-to-bag--added"
              : locked
                ? "add-to-bag--locked"
                : ""
    return (
        <button
            type="button"
            tabIndex={-1}
            className={`add-to-bag ${state} ${className}`.trim()}
        >
            {phase === "loading" && <Spinner />}
            {phase === "added" && (
                <>
                    <Check />
                    <span>Added</span>
                </>
            )}
            {phase === "idle" && <span>{label}</span>}
        </button>
    )
}

export default function MacysBagLoop({ alt }: { alt?: string }) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const pageRef = useRef<HTMLDivElement>(null)

    const [box, setBox] = useState({ w: 0, h: 0 })
    const [step, setStep] = useState(0)
    const [visible, setVisible] = useState(true)
    const [reduced, setReduced] = useState(false)

    /** How far the carousel has been advanced. */
    const [rotation, setRotation] = useState(0)
    const [added, setAdded] = useState<Product[]>([])
    const [pickPhase, setPickPhase] = useState<CtaPhase>("idle")
    const [exclusivePhase, setExclusivePhase] = useState<CtaPhase>("idle")
    const [pulsing, setPulsing] = useState(false)
    const [pressing, setPressing] = useState(false)
    const [moveMs, setMoveMs] = useState(MOVE_MIN)
    const [arc, setArc] = useState(0)
    const [cursor, setCursor] = useState({ x: VIEW_W * 0.62, y: VIEW_H * 0.78 })
    const cursorRef = useRef(cursor)
    /** The slice of the page the frame is looking at, in page pixels. */
    const [camera, setCamera] = useState<Camera>(WIDE)
    const [shotMs, setShotMs] = useState(MOVE_MIN)
    /** Explicit rather than derived from the bag: the discount is shown
     *  coming alive once the camera is on it, not while it is elsewhere. */
    const [unlocked, setUnlocked] = useState(false)

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

    /**
     * A shot, measured off the laid-out page and widened to the frame's own
     * proportions so the subject sits inside it with room to spare. Clamped
     * to the page, so the camera never runs off the edge.
     */
    const measureShot = (name: ShotName): Camera => {
        const page = pageRef.current
        const sel = SHOTS[name]
        if (!page || !sel) return WIDE
        const el = page.querySelector(sel)
        if (!el) return WIDE
        const pr = page.getBoundingClientRect()
        const k = pr.width / VIEW_W || 1
        const pageH = Math.max(VIEW_H, page.scrollHeight)
        const r = el.getBoundingClientRect()
        const left = (r.left - pr.left) / k - SHOT_PAD
        const top = (r.top - pr.top) / k - SHOT_PAD
        const w0 = r.width / k + SHOT_PAD * 2
        const h0 = r.height / k + SHOT_PAD * 2
        const aspect = VIEW_W / VIEW_H
        const w = Math.min(VIEW_W, Math.max(w0, h0 * aspect))
        const h = w / aspect
        const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi, v))
        return {
            x: clamp(left + w0 / 2 - w / 2, VIEW_W - w),
            y: clamp(top + h0 / 2 - h / 2, Math.max(0, pageH - h)),
            w,
        }
    }

    /**
     * Where a control sits, read off the laid-out page rather than written
     * down. The page is inside a scaled container, so the measured offset is
     * divided back out to the page's own coordinates — the ones the cursor
     * moves in.
     */
    const locate = (target: Target) => {
        const page = pageRef.current
        const el = page?.querySelector(TARGETS[target])
        if (!page || !el) return cursorRef.current
        const pr = page.getBoundingClientRect()
        const r = el.getBoundingClientRect()
        const k = pr.width / VIEW_W || 1
        return {
            x: (r.left + r.width / 2 - pr.left) / k,
            y: (r.top + r.height / 2 - pr.top) / k,
        }
    }

    useEffect(() => {
        if (!visible || reduced || box.w === 0) return
        const current = SCRIPT[step]
        let dur = current.ms

        switch (current.kind) {
            case "move": {
                const to = locate(current.to)
                const from = cursorRef.current
                const dist = Math.hypot(to.x - from.x, to.y - from.y)
                cursorRef.current = to
                setCursor(to)
                dur = Math.min(
                    MOVE_MAX,
                    Math.max(MOVE_MIN, Math.round(dist * MS_PER_PX))
                )
                setMoveMs(dur)
                setArc((a) => 1 - a)
                // The camera leaves with the pointer and arrives with it.
                setShotMs(dur)
                setCamera(measureShot(current.shot))
                setPressing(false)
                break
            }
            case "press":
                setPressing(true)
                if (current.to === "next") setRotation((r) => r + 1)
                if (current.to === "pick") setPickPhase("loading")
                if (current.to === "exclusive") setExclusivePhase("loading")
                break
            case "load":
                setPressing(false)
                break
            case "cta":
                setPressing(false)
                if (current.who === "pick") setPickPhase("added")
                else setExclusivePhase("added")
                break
            case "unlock":
                setUnlocked(true)
                break
            case "add":
                // The line opens out in the bag, and the badge and the order
                // summary move with it — one event, as it was.
                setAdded((a) => [
                    ...a,
                    current.who === "pick"
                        ? PICKS[(rotation + 1) % PICKS.length]
                        : EXCLUSIVE,
                ])
                setPulsing(true)
                break
            case "reset":
                setRotation(0)
                setAdded([])
                setUnlocked(false)
                setCamera(WIDE)
                setPickPhase("idle")
                setExclusivePhase("idle")
                setPulsing(false)
                setPressing(false)
                cursorRef.current = { x: VIEW_W * 0.62, y: VIEW_H * 0.78 }
                setCursor(cursorRef.current)
                break
            case "hold":
                setPressing(false)
                break
        }

        const id = window.setTimeout(() => {
            if (current.kind === "add") setPulsing(false)
            setStep((s) => (s + 1) % SCRIPT.length)
        }, Math.max(60, dur))
        return () => window.clearTimeout(id)
        // `rotation` is read when a pick is added, so the step this depends on
        // has to re-run if it changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, visible, reduced, box.w])

    /* ---- layout ---------------------------------------------------------- */
    const pad = box.w < 480 ? 8 : 16
    const availW = Math.max(0, box.w - pad * 2)
    const availH = Math.max(0, box.h - pad * 2 - FRAME_PAD_TOP)
    const width = Math.max(0, Math.min(availW, availH * (FRAME_W / FRAME_H)))
    /** The camera's slice of the page, filling the frame. */
    const scale = width / camera.w
    /** How far in we are, for anything that should not grow with the zoom. */
    const zoom = camera.w / VIEW_W
    // Half the hero pane's own corner, by the same rule it uses, so the frame
    // nests inside it rather than echoing it.
    const frameRadius =
        (box.w < 640 ? 13 : Math.min(26, Math.max(17, box.w * 0.09))) / 2

    /* ---- derived page state ---------------------------------------------- */
    const bagCount = 1 + added.length
    const items = [SHIRT, ...added]
    const subtotal = items.reduce((t, p) => t + p.price, 0)
    const savings = items.reduce((t, p) => t + savingsOf(p), 0)
    const total = subtotal + SHIPPING

    // The carousel is a ring: the order rotates, and only the window is shown.
    const ordered = PICKS.map((_, i) => PICKS[(i + rotation) % PICKS.length])

    return (
        <div
            ref={wrapRef}
            role="img"
            aria-label={
                alt ??
                "The Macy's bag page prototype: adding a suggested item unlocks an exclusive 50% discount, which comes up out of grey as the order summary updates."
            }
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {width > 0 && (
                <div
                    style={{
                        width,
                        height: width * (FRAME_H / FRAME_W) + FRAME_PAD_TOP,
                        position: "relative",
                        flexShrink: 0,
                    }}
                >
                    {/* One bordered, clipped box. The border and the
                        radius are in rendered pixels rather than page ones,
                        so the edge stays a hairline at any hero size instead
                        of scaling down into nothing. */}
                    <div
                        className="macys-frame"
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                            background: "#FFFFFF",
                            borderRadius: frameRadius,
                            paddingTop: FRAME_PAD_TOP,
                        }}
                    >
                        {/* The page at its own size, the result scaled. */}
                        <div
                            ref={pageRef}
                            className="macys-page"
                            style={{
                                width: VIEW_W,
                                // Translate first in page pixels, then scale,
                                // so the camera's x/y stay in the page's own
                                // coordinates whatever the zoom.
                                transform: `scale(${scale}) translate(${-camera.x}px, ${-camera.y}px)`,
                                transformOrigin: "top left",
                                transition: reduced
                                    ? "none"
                                    : `transform ${shotMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                                position: "relative",
                            }}
                        >
                            <header className="site-header">
                                <div className="site-header__top">
                                    <span className="site-header__brand">
                                        <img
                                            className="site-header__logo"
                                            src={`${BASE}/macys-wordmark.webp`}
                                            alt=""
                                        />
                                    </span>
                                    <div className="site-header__search">
                                        <input
                                            readOnly
                                            tabIndex={-1}
                                            placeholder="What are you looking for?"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            className="site-header__ask"
                                        >
                                            Ask Macy&apos;s
                                        </button>
                                    </div>
                                    <div className="site-header__utilities">
                                        <span>Sign In</span>
                                        <span>Your store</span>
                                        <span>Gift Registry</span>
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            className={`site-header__bag${pulsing ? " site-header__bag--receiving" : ""}`}
                                        >
                                            Bag<span>{bagCount}</span>
                                        </button>
                                    </div>
                                </div>
                                <nav className="site-nav">
                                    {[
                                        "Shop All",
                                        "Women",
                                        "Men",
                                        "Beauty",
                                        "Shoes",
                                        "Home",
                                        "Jewelry",
                                        "Handbags",
                                        "Furniture & Mattresses",
                                        "Kids & Baby",
                                        "Gifts",
                                        "New & Trending",
                                        "Sale",
                                    ].map((label) => (
                                        <button
                                            key={label}
                                            type="button"
                                            tabIndex={-1}
                                            className={
                                                label === "Sale"
                                                    ? "site-nav__sale"
                                                    : undefined
                                            }
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </nav>
                            </header>

                            <main className="bag-page">
                                <section className="bag-page__main">
                                    <h1>Bag</h1>

                                    <div className="bag-items">
                                        {items.map((product, i) => (
                                            <div
                                                key={`${product.id}-${i}`}
                                                // Everything after the first
                                                // line arrived during the
                                                // loop, so it opens out
                                                // rather than appearing.
                                                className={
                                                    i === 0
                                                        ? undefined
                                                        : "bag-item-enter"
                                                }
                                            >
                                                <div>
                                                    <BagRow product={product} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <section className="quick-picks">
                                        <div className="quick-picks__header">
                                            <h2>Suggested for you</h2>
                                            <p>
                                                Add any of these items to{" "}
                                                <span className="quick-picks__unlock">
                                                    unlock your exclusive
                                                    discount
                                                </span>
                                            </p>
                                        </div>
                                        <div className="quick-picks__carousel">
                                            <div className="quick-picks__viewport">
                                                <div className="quick-picks__track">
                                                    {ordered.map((p, i) => {
                                                        const isTarget = i === 1
                                                        const inBag =
                                                            added.some(
                                                                (a) =>
                                                                    a.id ===
                                                                    p.id
                                                            )
                                                        return (
                                                            <article
                                                                key={p.id}
                                                                className="quick-pick-card"
                                                            >
                                                                <div className="quick-pick-card__image-wrap">
                                                                    <img
                                                                        src={
                                                                            p.image
                                                                        }
                                                                        alt=""
                                                                    />
                                                                </div>
                                                                <div className="quick-pick-card__content">
                                                                    <div>
                                                                        <p className="quick-pick-card__brand">
                                                                            {
                                                                                p.brand
                                                                            }
                                                                        </p>
                                                                        <p className="quick-pick-card__name">
                                                                            {
                                                                                p.name
                                                                            }
                                                                        </p>
                                                                        <p className="quick-pick-card__sale">
                                                                            {money(
                                                                                p.price
                                                                            )}{" "}
                                                                            <span>
                                                                                {
                                                                                    p.off
                                                                                }
                                                                            </span>
                                                                        </p>
                                                                        {p.was && (
                                                                            <p className="quick-pick-card__original">
                                                                                {money(
                                                                                    p.was
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <AddToBag
                                                                        className="quick-pick-card__cta"
                                                                        phase={
                                                                            isTarget
                                                                                ? pickPhase
                                                                                : inBag
                                                                                  ? "added"
                                                                                  : "idle"
                                                                        }
                                                                    />
                                                                </div>
                                                            </article>
                                                        )
                                                    })}
                                                </div>
                                                <div
                                                    className="quick-picks__fade quick-picks__fade--left"
                                                    aria-hidden="true"
                                                />
                                                <div
                                                    className="quick-picks__fade quick-picks__fade--right"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                className="quick-picks__nav quick-picks__nav--prev"
                                            >
                                                <Chevron dir="left" />
                                            </button>
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                className="quick-picks__nav quick-picks__nav--next"
                                            >
                                                <Chevron dir="right" />
                                            </button>
                                        </div>
                                    </section>

                                    <section className="exclusive-discount">
                                        <h2>Your exclusive discount</h2>
                                        <div
                                            className={`exclusive-card${unlocked ? " exclusive-card--unlocked" : ""}`}
                                        >
                                            <div className="exclusive-card__image-wrap">
                                                <img
                                                    src={EXCLUSIVE.image}
                                                    alt=""
                                                />
                                                <div className="exclusive-card__badge">
                                                    <Lock />
                                                    <span>50% OFF</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="exclusive-card__brand">
                                                    {EXCLUSIVE.brand}
                                                </p>
                                                <p className="exclusive-card__name">
                                                    {EXCLUSIVE.name}
                                                </p>
                                                <div className="exclusive-card__meta">
                                                    <p>Size: 15.5 34/35</p>
                                                    <p>Color: Blue</p>
                                                </div>
                                                <div className="exclusive-card__pricing">
                                                    <p className="exclusive-card__sale">
                                                        {money(
                                                            EXCLUSIVE.price
                                                        )}{" "}
                                                        <span>
                                                            {EXCLUSIVE.off}
                                                        </span>
                                                    </p>
                                                    <p className="exclusive-card__original">
                                                        {money(EXCLUSIVE.was!)}
                                                    </p>
                                                </div>
                                            </div>
                                            <AddToBag
                                                phase={exclusivePhase}
                                                locked={!unlocked}
                                                label="Add to Bag"
                                            />
                                        </div>
                                    </section>

                                    <section className="rewards-strip">
                                        <div className="rewards-strip__progress">
                                            <span />
                                            <span />
                                            <span />
                                            <span />
                                        </div>
                                        <div className="rewards-strip__content">
                                            <p className="rewards-strip__title">
                                                ★ STAR REWARDS
                                            </p>
                                            <p>
                                                Want free shipping?{" "}
                                                <span className="text-link">
                                                    Join Star Rewards
                                                </span>{" "}
                                                or{" "}
                                                <span className="text-link">
                                                    Sign in
                                                </span>{" "}
                                                to get free shipping at $39+.
                                            </p>
                                        </div>
                                    </section>
                                </section>

                                <aside className="order-summary">
                                    <section className="order-summary__promo">
                                        <div className="order-summary__promo-heading">
                                            <h2>Enter promo code</h2>
                                            <span>Limit 1 offer per order</span>
                                        </div>
                                        <div className="promo-input">
                                            <input
                                                readOnly
                                                tabIndex={-1}
                                                placeholder="Enter promo code"
                                            />
                                            <button type="button" tabIndex={-1}>
                                                Apply
                                            </button>
                                        </div>
                                        <span className="text-link order-summary__sign-in">
                                            Sign in to see if you have other
                                            offers.
                                        </span>
                                    </section>

                                    <section className="order-summary__totals">
                                        <div className="total-row">
                                            <span>subtotal</span>
                                            <span>{money(subtotal)}</span>
                                        </div>
                                        {savings > 0 && (
                                            <div className="total-row">
                                                <span>discounts</span>
                                                <span className="total-row__discount">
                                                    -{money(savings)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="total-row">
                                            <span>shipping</span>
                                            <span>{money(SHIPPING)}</span>
                                        </div>
                                        <div className="total-row total-row--emphasis">
                                            <span>pre-tax order total</span>
                                            <span>{money(total)}</span>
                                        </div>
                                    </section>

                                    <section className="order-summary__checkout">
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            className="checkout-button"
                                        >
                                            Proceed to checkout
                                        </button>
                                        <div className="alt-payments">
                                            <button type="button" tabIndex={-1} className="alt-payment">
                                                PayPal
                                            </button>
                                            <button type="button" tabIndex={-1} className="alt-payment">
                                                Klarna
                                            </button>
                                        </div>
                                        <span className="text-link order-summary__continue">
                                            Continue shopping
                                        </span>
                                    </section>

                                    <section className="order-summary__card-offer">
                                        <div>
                                            <p className="card-offer__headline">
                                                Open a card &amp; get 30% off
                                                macys.com today.
                                            </p>
                                            <p className="card-offer__fine-print">
                                                Store discount varies. Save up
                                                to $100. Subject to credit
                                                approval. Exclusions &amp;
                                                details
                                            </p>
                                        </div>
                                        <div className="card-offer__cta">
                                            <div
                                                className="card-offer__cards"
                                                aria-hidden="true"
                                            >
                                                <span />
                                                <span />
                                            </div>
                                            <span className="text-link">
                                                See if I prequalify
                                            </span>
                                            <p>No impact to credit score.</p>
                                        </div>
                                    </section>
                                </aside>
                            </main>

                            {/* The pointer. Horizontal travel, vertical travel
                                and the press dip are three nested elements, so
                                each runs on its own curve. */}
                            {!reduced && (
                                <span
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        transform: `translate3d(${cursor.x}px, 0, 0)`,
                                        transition: `transform ${moveMs}ms ${ARCS[arc].x}`,
                                        pointerEvents: "none",
                                        zIndex: 5,
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "block",
                                            transform: `translate3d(0, ${cursor.y}px, 0)`,
                                            transition: `transform ${moveMs}ms ${ARCS[arc].y}`,
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "block",
                                                transform: `scale(${pressing ? 0.86 : 1})`,
                                                // The shared cursor puts its
                                                // tip at the origin, so the
                                                // press pivots on the tip.
                                                transformOrigin: "0 0",
                                                transition: `transform ${PRESS_MS / 2}ms ${PRESS_EASE}`,
                                            }}
                                        >
                                            {/* Counter-scaled, so the
                                                pointer stays one size on
                                                screen instead of swelling
                                                every time the camera goes
                                                in. */}
                                            <span
                                                style={{
                                                    display: "block",
                                                    transform: `scale(${zoom})`,
                                                    transformOrigin: "0 0",
                                                    transition: reduced
                                                        ? "none"
                                                        : `transform ${shotMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                                                }}
                                            >
                                                <Cursor size={38} />
                                            </span>
                                        </span>
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
