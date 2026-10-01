import { useEffect, useLayoutEffect, useRef, useState } from "react"

/**
 * The Uber Ads hero: the Rokt placement cycling through four offers, then the
 * Disney+ offer opening the App Store.
 *
 * Every pixel is a Figma export — the four offer cards, the shared chrome above
 * and below them, the App Store page and the iPhone frame itself. Nothing here
 * is redrawn in CSS, so the design cannot drift from the source file.
 *
 * Geometry below is measured from the Figma file, not estimated:
 *   - the frame artwork is 473x932, with its screen cut-out at (40, 40) 393x852
 *   - the screen's corner radius is 56, which is the real iPhone 15/16 Pro value
 *   - the offer card sits at (16, 494) in screen space, 358 wide
 *   - the card's own frame adds 16 below it, so the lower chrome starts at
 *     510 + cardHeight and shifts as the offers change height
 */

const FRAME_W = 473
const FRAME_H = 932
const SCREEN_X = 40
const SCREEN_Y = 40
const SCREEN_W = 393
const SCREEN_H = 852
const SCREEN_R = 56

const CARD_X = 16
const CARD_Y = 494
const CARD_W = 358
/** Padding below the card inside its own frame. */
const CARD_GAP = 16
const CHROME_TOP_H = 494
const CHROME_BOTTOM_H = 121

/** Two levels up: these pages are served from /work/<slug>/. */
const BASE = "../../projects/uber"
// The frame itself is shared with the Shoppable hero, so it sits a level up.

interface Offer {
    src: string
    height: number
    /** "Not now" in screen coordinates; the tap indicator lands here. */
    notNow: { x: number; y: number }
    /** The claim button, which is where the App Store transition originates. */
    claim: { x: number; y: number }
    label: string
}

const BTN_W = 120
const BTN_H = 40

/**
 * Button positions are read from each card's CTA frame in Figma. The rows sit
 * at different heights because the creatives above them differ, so these are
 * per-offer rather than shared.
 */
const OFFERS: Offer[] = [
    {
        src: `${BASE}/card-1.jpg`,
        height: 223,
        claim: { x: 32, y: 614 },
        notNow: { x: 160, y: 614 },
        label: "Spotify Premium",
    },
    {
        src: `${BASE}/card-2.jpg`,
        height: 238,
        claim: { x: 32, y: 629 },
        notNow: { x: 160, y: 629 },
        label: "The Farmer's Dog",
    },
    {
        src: `${BASE}/card-3.jpg`,
        height: 221,
        claim: { x: 32, y: 612 },
        notNow: { x: 160, y: 612 },
        label: "Starbucks",
    },
    {
        src: `${BASE}/card-4.jpg`,
        height: 282,
        claim: { x: 33, y: 672 },
        notNow: { x: 161, y: 672 },
        label: "Disney+",
    },
]

/**
 * The window is held at the tallest card rather than animating to each card's
 * height. Animating `height` is a layout property: it relaid out and
 * re-rasterised the whole subtree every frame, which resampled the artwork and
 * was one of two reasons the offers looked soft mid-transition. A shorter card
 * simply leaves transparent space below it, and the lower chrome paints over
 * that space because it comes later in the DOM — visually identical, no layout.
 */
const MAX_CARD_H = Math.max(...OFFERS.map((o) => o.height))

/** The track carries a fifth card — a copy of the first — so the wrap forward
 *  slides in the same direction as every other advance instead of rewinding. */
const TRACK = [...OFFERS, OFFERS[0]]

/**
 * Apple's presentation curve. This is the one iOS uses for app opens and sheet
 * presentations: a long, decelerating tail with no overshoot, which is what
 * makes the motion read as a system transition rather than a web animation.
 */
const APPLE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
const PAGE_EASE = "cubic-bezier(0.33, 1, 0.68, 1)"

const OPEN_MS = 620
const CLOSE_MS = 520
const PAGE_MS = 460

type Step =
    | { kind: "hold"; ms: number }
    | { kind: "tap"; on: "notNow" | "claim"; ms: number }
    | { kind: "advance"; ms: number }
    | { kind: "open"; ms: number }
    | { kind: "close"; ms: number }
    | { kind: "reset"; ms: number }

const SCRIPT: Step[] = [
    { kind: "hold", ms: 1500 },
    { kind: "tap", on: "notNow", ms: 300 },
    { kind: "advance", ms: PAGE_MS },
    { kind: "hold", ms: 1500 },
    { kind: "tap", on: "notNow", ms: 300 },
    { kind: "advance", ms: PAGE_MS },
    { kind: "hold", ms: 1500 },
    { kind: "tap", on: "notNow", ms: 300 },
    { kind: "advance", ms: PAGE_MS },
    // The Disney+ offer holds a beat longer, because its button is the one
    // that gets pressed.
    { kind: "hold", ms: 1900 },
    { kind: "tap", on: "claim", ms: 320 },
    { kind: "open", ms: OPEN_MS },
    { kind: "hold", ms: 2400 },
    { kind: "close", ms: CLOSE_MS },
    { kind: "hold", ms: 420 },
    { kind: "advance", ms: PAGE_MS },
    // Snap from the duplicate first card back to the real one. Same pixels, so
    // the cut is invisible.
    { kind: "reset", ms: 60 },
]

interface UberAdsLoopProps {
    alt?: string
    /**
     * "width" caps the phone near life size for an inline figure. "contain"
     * fits it to the parent's height and centres it, for the home page's hero
     * pane where the parent is a tall box.
     */
    fit?: "width" | "contain"
}

export default function UberAdsLoop({ alt, fit = "width" }: UberAdsLoopProps) {
    const wrapRef = useRef<HTMLDivElement>(null)
    // Starts at 1 rather than 0: the first measurement happens synchronously
    // below, and if it ever fails the component still renders at full size
    // instead of collapsing to an empty box.
    const [scale, setScale] = useState(1)
    // Starts visible so a suspended IntersectionObserver cannot leave the
    // loop permanently stopped; the observer only ever pauses it.
    const [visible, setVisible] = useState(true)
    const [reduced, setReduced] = useState(false)

    const [step, setStep] = useState(0)
    const [index, setIndex] = useState(0)
    const [appOpen, setAppOpen] = useState(false)
    const [tap, setTap] = useState<null | "notNow" | "claim">(null)
    const [tapKey, setTapKey] = useState(0)
    const [animate, setAnimate] = useState(true)

    // Scale the whole thing from its true 473x932 size. Doing it with one
    // transform keeps every measured offset in exact Figma units rather than
    // forcing each one through a percentage conversion.
    useLayoutEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const measure = () => {
            const w = el.getBoundingClientRect().width
            if (w > 0) setScale(w / FRAME_W)
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

    // Off-screen the loop stops entirely rather than burning frames behind the
    // viewport.
    useEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const io = new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.2 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    useEffect(() => {
        if (!visible || reduced) return
        const current = SCRIPT[step]
        switch (current.kind) {
            case "tap":
                setTap(current.on)
                setTapKey((k) => k + 1)
                break
            case "advance":
                setTap(null)
                setIndex((i) => i + 1)
                break
            case "open":
                setTap(null)
                setAppOpen(true)
                break
            case "close":
                setAppOpen(false)
                break
            case "reset":
                setAnimate(false)
                setIndex(0)
                break
            case "hold":
                setTap(null)
                break
        }
        const id = window.setTimeout(() => {
            if (current.kind === "reset") setAnimate(true)
            setStep((s) => (s + 1) % SCRIPT.length)
        }, current.ms)
        return () => window.clearTimeout(id)
    }, [step, visible, reduced])

    const offer = TRACK[index] ?? TRACK[0]
    const cardH = offer.height
    const tapTarget = tap === "claim" ? offer.claim : offer.notNow
    const origin = OFFERS[3].claim

    /** Every measured Figma unit goes through this to reach its real size. */
    const px = (v: number) => v * scale

    const pageTransition = animate
        ? `transform ${PAGE_MS}ms ${PAGE_EASE}`
        : "none"

    return (
        <div
            ref={wrapRef}
            role="img"
            aria-label={
                alt ??
                "An Uber Eats order screen cycling through four Rokt offers, ending with the Disney+ offer opening the App Store."
            }
            style={{
                ...(fit === "contain"
                    ? {
                          // Fit the parent's height and centre; max-width keeps
                          // it inside a pane narrower than the aspect wants.
                          height: "100%",
                          maxWidth: "100%",
                          margin: "0 auto",
                      }
                    : {
                          // Roughly life size. Full-column width would render
                          // the phone at 960px, which reads as a billboard
                          // rather than a device.
                          width: "min(100%, 380px)",
                      }),
                aspectRatio: `${FRAME_W} / ${FRAME_H}`,
                overflow: "hidden",
            }}
        >
            {
                <div
                    style={{
                        // No ancestor transform.
                        //
                        // This was a 473x932 box under `transform: scale()`.
                        // Any layer promoted beneath a scaled ancestor is
                        // rasterised once and then GPU-resampled through that
                        // scale, which softened the artwork — only during the
                        // slide at first, then permanently once will-change
                        // pinned the promotion.
                        //
                        // Laying every dimension out at its already-scaled
                        // pixel size removes the resample: images rasterise at
                        // their true on-screen size, and the track's transform
                        // composites against an unscaled parent.
                        width: "100%",
                        height: "100%",
                        position: "relative",
                    }}
                >
                    {/* The screen, clipped to the frame's real cut-out. */}
                    <div
                        style={{
                            position: "absolute",
                            left: px(SCREEN_X),
                            top: px(SCREEN_Y),
                            width: px(SCREEN_W),
                            height: px(SCREEN_H),
                            borderRadius: px(SCREEN_R),
                            overflow: "hidden",
                            backgroundColor: "#ffffff",
                        }}
                    >
                        {/* Uber Eats, which recedes and dims while the App
                            Store comes forward — the same thing iOS does to
                            the app you are leaving. */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                transform: appOpen ? "scale(0.96)" : "none",
                                filter: appOpen
                                    ? "brightness(0.72)"
                                    : "brightness(1)",
                                transition: `transform ${appOpen ? OPEN_MS : CLOSE_MS}ms ${APPLE_EASE}, filter ${appOpen ? OPEN_MS : CLOSE_MS}ms ${APPLE_EASE}`,
                            }}
                        >
                            <img
                                src={`${BASE}/chrome-top.jpg`}
                                alt=""
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: px(SCREEN_W),
                                    height: px(CHROME_TOP_H),
                                    display: "block",
                                }}
                            />

                            {/* The offer window, held at the tallest card so
                                its height never animates. */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: px(CARD_X),
                                    top: px(CARD_Y),
                                    width: px(CARD_W),
                                    height: px(MAX_CARD_H),
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        width: px(CARD_W * TRACK.length),
                                        transform: `translate3d(${px(-index * CARD_W)}px, 0, 0)`,
                                        transition: pageTransition,
                                    }}
                                >
                                    {TRACK.map((card, i) => (
                                        <img
                                            key={i}
                                            src={card.src}
                                            alt=""
                                            loading={i > 1 ? "lazy" : "eager"}
                                            style={{
                                                width: px(CARD_W),
                                                height: px(card.height),
                                                flexShrink: 0,
                                                display: "block",
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <img
                                src={`${BASE}/chrome-bottom.jpg`}
                                alt=""
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    // Anchored once and moved by transform.
                                    // Animating `top` is a layout property and
                                    // relaid out the subtree every frame.
                                    top: px(CARD_Y + CARD_GAP),
                                    width: px(SCREEN_W),
                                    height: px(CHROME_BOTTOM_H),
                                    display: "block",
                                    transform: `translate3d(0, ${px(cardH)}px, 0)`,
                                    transition: animate
                                        ? `transform ${PAGE_MS}ms ${PAGE_EASE}`
                                        : "none",
                                }}
                            />

                            {tap && (
                                <span
                                    key={tapKey}
                                    className="uber-tap"
                                    style={{
                                        left: px(tapTarget.x + BTN_W / 2),
                                        top: px(tapTarget.y + BTN_H / 2),
                                        width: px(44),
                                        height: px(44),
                                        marginLeft: px(-22),
                                        marginTop: px(-22),
                                    }}
                                />
                            )}
                        </div>

                        {/*
                         * The App Store open.
                         *
                         * The window morphs from the claim button's rect to the
                         * full screen while its corner radius grows from the
                         * button's 8 to the screen's 56, and the page inside
                         * scales up in step so the artwork never distorts.
                         * That pairing — a rect morphing while its contents
                         * scale — is what iOS does when an app launches.
                         */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: appOpen ? 0 : px(origin.x),
                                top: appOpen ? 0 : px(origin.y),
                                width: px(appOpen ? SCREEN_W : BTN_W),
                                height: px(appOpen ? SCREEN_H : BTN_H),
                                borderRadius: px(appOpen ? SCREEN_R : 8),
                                overflow: "hidden",
                                opacity: appOpen ? 1 : 0,
                                pointerEvents: "none",
                                boxShadow: appOpen
                                    ? "none"
                                    : "0 8px 24px rgba(0,0,0,0.28)",
                                transition: [
                                    `left ${appOpen ? OPEN_MS : CLOSE_MS}ms ${APPLE_EASE}`,
                                    `top ${appOpen ? OPEN_MS : CLOSE_MS}ms ${APPLE_EASE}`,
                                    `width ${appOpen ? OPEN_MS : CLOSE_MS}ms ${APPLE_EASE}`,
                                    `height ${appOpen ? OPEN_MS : CLOSE_MS}ms ${APPLE_EASE}`,
                                    `border-radius ${appOpen ? OPEN_MS : CLOSE_MS}ms ${APPLE_EASE}`,
                                    // Opacity resolves early on the way in and
                                    // late on the way out, so the morph is
                                    // never visible as an empty rectangle.
                                    `opacity ${Math.round((appOpen ? OPEN_MS : CLOSE_MS) * 0.45)}ms linear`,
                                ].join(", "),
                            }}
                        >
                            <img
                                src={`${BASE}/appstore.jpg`}
                                alt=""
                                loading="lazy"
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    width: px(SCREEN_W),
                                    height: px(SCREEN_H),
                                    display: "block",
                                    transform: `translate(-50%, -50%) scale(${appOpen ? 1 : BTN_W / SCREEN_W})`,
                                    transition: `transform ${appOpen ? OPEN_MS : CLOSE_MS}ms ${APPLE_EASE}`,
                                }}
                            />
                        </div>
                    </div>

                    {/* The frame last, so it sits over the screen. This is the
                        Figma asset, not a recreation. */}
                    <img
                        src="../../projects/iphone-frame.png"
                        alt=""
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: "100%",
                            height: "100%",
                            display: "block",
                            pointerEvents: "none",
                        }}
                    />
                </div>
            }
        </div>
    )
}
