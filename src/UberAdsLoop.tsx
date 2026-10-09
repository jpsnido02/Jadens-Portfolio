import UberOfferCard, { OFFERS } from "./UberOfferCard"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { cycleMs, type LoopReporter } from "./LoopProgress"

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
/**
 * How far the screen is carried past the frame's cut-out, in design pixels.
 *
 * The frame asset's inner edge is a hard one-pixel transition from black to
 * nothing, sitting at exactly the screen's own rect. Two separately
 * rasterised layers meeting on the same line means that at some rendered
 * sizes the boundary rounds to a sub-pixel sliver of whatever is behind —
 * which is where the hairline gaps along the screen's edge came from, white
 * where the screen's own ground showed and grey where the page behind did.
 *
 * So the screen is laid out a touch larger than the cut-out and filled with
 * the bezel's own black. The ring is entirely outside the cut-out, so the
 * frame covers all of it; all it does is make sure there is nothing pale for
 * a rounding error to find.
 */
const SEAM = 2

const CARD_X = 16
const CARD_W = 358
/* -------------------------------------------------------------------------
 * The order-tracking page, sliced out of the real app.
 *
 * Two captures stitch into one continuous page: the unscrolled one supplies
 * everything above the offer — the collapsing header, the map, the bundling
 * row — and the scrolled one supplies everything below it. The offer sits
 * between the halves rather than inside either, which is what lets the lower
 * half move down as the card changes height. The bar is fixed, as it is in
 * the app, so the page travels under it.
 * ---------------------------------------------------------------------- */
/**
 * The fixed bar, and where the scrolling page starts under it.
 *
 * These are not the same number. The bar is taller than the point the page
 * begins, so there is white between the Help button and whatever is scrolling
 * past — without it the content ran straight into the bar with nothing
 * between them.
 */
const BAR_H = 99
const PAGE_TOP = 99
/**
 * White under the bar. Constant, not tied to the scroll.
 *
 * It was 26 and only on once the page moved, which meant the header shifted
 * as you scrolled. Two units, always there, is what Jaden asked for: enough
 * to keep the content off the Help button and the same whether the page has
 * moved or not.
 */
const BAR_PAD = 6
/**
 * The loader's icons, measured off the capture and drawn separately so they
 * can move. A still row of icons reads as a screen that has hung.
 */
const LOAD_ICONS: [number, number, number, number][] = [
    [70, 440, 52, 70],
    [138, 440, 50, 70],
    [214, 440, 31, 70],
    [267, 440, 57, 70],
]
const LOAD_BOUNCE_MS = 1150
const PAGE_A_H = 736
const PAGE_B_H = 466
/** The offer's inset, matching the slot the cream container occupied. */
const SLOT_X = 16
/** Where the offer lands once the page has scrolled to it. */
const SLOT_Y = 203
const SCROLL_TO = PAGE_A_H - (SLOT_Y - PAGE_TOP)

/** Two levels up: these pages are served from /work/<slug>/. */
const BASE = "../../projects/uber"
// The frame itself is shared with the Shoppable hero, so it sits a level up.

/**
 * Button positions are read from each card's CTA frame in Figma. The rows sit
 * at different heights because the creatives above them differ, so these are
 * per-offer rather than shared.
 */

/**
 * The window is held at the tallest card rather than animating to each card's
 * height. Animating `height` is a layout property: it relaid out and
 * re-rasterised the whole subtree every frame, which resampled the artwork and
 * was one of two reasons the offers looked soft mid-transition. A shorter card
 * simply leaves transparent space below it, and the lower chrome paints over
 * that space because it comes later in the DOM — visually identical, no layout.
 */
/** Roughly how tall an offer runs, for aiming the camera at the slot. */
const NOMINAL_CARD_H = 250

/** The track carries a fifth card — a copy of the first — so the wrap forward
 *  slides in the same direction as every other advance instead of rewinding. */

/**
 * Apple's presentation curve. This is the one iOS uses for app opens and sheet
 * presentations: a long, decelerating tail with no overshoot, which is what
 * makes the motion read as a system transition rather than a web animation.
 */
/**
 * The home screen the app closes to. iOS does not cut from one app to
 * another: it shrinks the first into its icon, shows the home screen, then
 * grows the second out of its icon. Without that middle beat the App Store
 * appears to erupt from a button inside Uber Eats, which is not a thing the
 * system does.
 *
 * The screen is the design file's own, and the two icon rects were measured
 * off it rather than estimated — the Uber Eats icon by its green, the App
 * Store by the columns of strong blue across that icon's own rows, so the
 * label beneath and the wallpaper behind are excluded. Both come out ~59
 * square on one row, 91 apart.
 */
const ICON = 59
const ICON_R = 13
const UBER_SLOT = { x: 28.5, y: 577 }
const STORE_SLOT = { x: 119.5, y: 577 }

const APPLE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
/**
 * How far the home screen is pushed back while an app is over it.
 *
 * On iOS the home screen is not a backdrop the app happens to cover — it
 * moves. Opening an app zooms the home screen in and fades it out behind the
 * window growing out of the icon; closing one brings it back from slightly
 * over-size and settles it. That counter-motion is most of what makes the
 * transition read as depth rather than as a sprite being scaled, and holding
 * the home screen still was why this did not feel like the real thing.
 */
const HOME_ZOOM = 1.12
const PAGE_EASE = "cubic-bezier(0.33, 1, 0.68, 1)"

const OPEN_MS = 620
const CLOSE_MS = 520
/**
 * An offer giving way to the next. Slower than the 460ms it ran at: with the
 * camera in close the swap is the thing being watched, and at that speed it
 * was over before it registered.
 */
const PAGE_MS = 780
/**
 * The camera moving between the whole phone and the offer.
 *
 * The scale is a transform, which the rest of this component deliberately
 * avoids — a layer promoted under a scaled ancestor is rasterised once and
 * then resampled, which softens the artwork. It is safe here because it is
 * transient and settles: the wide state carries no transform at all, and the
 * cards are drawn at 716px against a 358px slot, so there is real detail for
 * the browser to re-rasterise from once the move ends.
 */
const ZOOM_MS = 900
/**
 * How far in the camera goes.
 *
 * Now that the whole phone scales, the limit is the hero pane rather than the
 * frame: the phone is fitted to the pane's height, so it has slack sideways
 * and none vertically. 1.3 keeps both bezels in view in a pane as wide as
 * these are while cropping the map above and the nav below, which is what
 * leaves the offer holding the frame.
 */
const ZOOM_SCALE = 1.3
/** The offer's own centre height, in frame units, so the push-in lands on it. */
const ZOOM_ORIGIN_Y = ((SCREEN_Y + SLOT_Y + NOMINAL_CARD_H / 2) / FRAME_H) * 100

/** Which of the three surfaces is forward. */
type Stage = "app" | "home" | "store"

type Step =
    | { kind: "hold"; ms: number }
    | { kind: "tap"; on: "notNow" | "claim"; ms: number }
    | { kind: "advance"; ms: number }
    | { kind: "stage"; to: Stage; ms: number }
    | { kind: "zoom"; to: "wide" | "offer"; ms: number }
    /** Which surface the app is showing. */
    | { kind: "screen"; to: "loading" | "track"; ms: number }
    /** How far down the tracking page we are. */
    | { kind: "scroll"; to: number; ms: number }
    /** To black, and hold there. */
    | { kind: "cut"; ms: number }
    | { kind: "reset"; ms: number }

const SCREEN_MS = 520
const SCROLL_MS = 1150

const SCRIPT: Step[] = [
    // The order goes in.
    { kind: "hold", ms: 1500 },
    // The tracking page takes over.
    { kind: "screen", to: "track", ms: SCREEN_MS },
    { kind: "hold", ms: 1600 },
    // Down the page to the offer, the way you would reach it.
    { kind: "scroll", to: SCROLL_TO, ms: SCROLL_MS },
    { kind: "hold", ms: 520 },
    // In on the offer, and stay there for the whole rotation.
    { kind: "zoom", to: "offer", ms: ZOOM_MS },
    { kind: "hold", ms: 1100 },
    { kind: "tap", on: "notNow", ms: 320 },
    { kind: "advance", ms: PAGE_MS },
    { kind: "hold", ms: 1700 },
    { kind: "tap", on: "notNow", ms: 320 },
    { kind: "advance", ms: PAGE_MS },
    { kind: "hold", ms: 1700 },
    { kind: "tap", on: "notNow", ms: 320 },
    { kind: "advance", ms: PAGE_MS },
    // The Disney+ offer holds a beat longer, because its button is the one
    // that gets pressed.
    { kind: "hold", ms: 2000 },
    { kind: "tap", on: "claim", ms: 320 },
    // Back out to the whole phone before it leaves, or the window would
    // shrink into an icon that is off screen.
    { kind: "zoom", to: "wide", ms: ZOOM_MS },
    // Uber Eats closes to the home screen, the home screen is held long
    // enough to be read as a place, then the App Store opens out of its icon.
    { kind: "stage", to: "home", ms: CLOSE_MS },
    { kind: "hold", ms: 560 },
    { kind: "stage", to: "store", ms: OPEN_MS },
    // And it ends there. Going back home and reopening Uber Eats was a tail
    // on a story that had already finished: the point is the offer getting
    // someone to the App Store, so that is the last thing shown.
    { kind: "hold", ms: 2800 },
    // Then out, on a cut rather than on the App Store shrinking back into
    // its icon. The window going away was the loop tidying up after itself
    // in full view; black is just the end.
    { kind: "cut", ms: 900 },
    // Everything is put back behind the black, so none of it is seen.
    { kind: "reset", ms: 60 },
]

/** How long one pass of the script takes. */
const CYCLE = cycleMs(SCRIPT.map((s) => s.ms))

interface UberAdsLoopProps {
    alt?: string
    /** Reports where the script is, for the hero's loop indicator. */
    onProgress?: LoopReporter
    /**
     * "width" caps the phone near life size for an inline figure. "contain"
     * fits it to the parent's height and centres it, for the home page's hero
     * pane where the parent is a tall box.
     */
    fit?: "width" | "contain"
}

export default function UberAdsLoop({
    alt,
    fit = "width",
    onProgress,
}: UberAdsLoopProps) {
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
    const [stage, setStage] = useState<Stage>("app")
    const [zoom, setZoom] = useState<"wide" | "offer">("wide")
    const [screen, setScreen] = useState<"loading" | "track">("loading")
    const [scrollY, setScrollY] = useState(0)
    const [cut, setCut] = useState(false)
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
            // offsetWidth, not getBoundingClientRect: this element carries the
            // camera transform, and a measured rect comes back multiplied by
            // it. Reading the rect meant pushing the camera in inflated the
            // scale, which laid the whole phone out larger on top of the
            // transform already enlarging it — so the screen's contents grew
            // past a clip that had not grown with them.
            const w = el.offsetWidth
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

    // Off-screen the loop stops entirely rather than burning frames behind the
    // viewport.
    useEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const io = new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.2 },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    /**
     * Scrolled past and come back to, the hero starts again rather than picking
     * up wherever it was paused. Jumping to the script's last step — its own
     * reset — is what clears the state, and the step after it is the first.
     *
     * `visible` starts true so a suspended IntersectionObserver cannot leave the
     * hero frozen, which means this does nothing on mount beyond a reset of
     * state that is already clear.
     */
    useEffect(() => {
        if (visible) setStep(SCRIPT.length - 1)
    }, [visible])

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
            case "stage":
                setTap(null)
                setStage(current.to)
                break
            case "zoom":
                setTap(null)
                setZoom(current.to)
                break
            case "screen":
                setTap(null)
                setScreen(current.to)
                break
            case "scroll":
                setTap(null)
                setScrollY(current.to)
                break
            case "cut":
                setTap(null)
                setCut(true)
                break
            case "reset":
                setAnimate(false)
                setCut(false)
                setIndex(0)
                setStage("app")
                setZoom("wide")
                setScreen("loading")
                setScrollY(0)
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

    const offer = OFFERS[index % OFFERS.length]
    // Each surface morphs to and from its own icon on the home screen, not
    // from the button that was pressed.
    const appAway = stage !== "app"
    /** The home screen is only at rest when nothing is over it. */
    const atHome = stage === "home"
    const storeOpen = stage === "store"
    // Opening an app and closing one are not the same length on iOS, and the
    // stage being entered is what says which this is: anything but the home
    // screen is a window growing out of an icon.
    const MORPH_MS = atHome ? CLOSE_MS : OPEN_MS

    /** Every measured Figma unit goes through this to reach its real size. */
    const px = (v: number) => v * scale

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
                // The camera, on the phone rather than inside it.
                //
                // Scaling the box *within* this one got clipped by this one,
                // so the phone appeared to crop rather than approach — the
                // bezel stayed put while the screen grew past it. Scaling this
                // element scales its own clip with it, so the whole device
                // grows and the hero pane is what trims the overflow.
                //
                // Horizontally centred so the phone does not slide sideways on
                // the way in; vertically anchored on the offer so the offer is
                // what the move frames.
                transformOrigin: `50% ${ZOOM_ORIGIN_Y}%`,
                transform: zoom === "offer" ? `scale(${ZOOM_SCALE})` : "none",
                transition: animate
                    ? `transform ${ZOOM_MS}ms ${APPLE_EASE}`
                    : "none",
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
                    {/* The seam filler, then the screen inside it at its
                        real rect. See SEAM. */}
                    <div
                        style={{
                            position: "absolute",
                            left: px(SCREEN_X - SEAM),
                            top: px(SCREEN_Y - SEAM),
                            width: px(SCREEN_W + SEAM * 2),
                            height: px(SCREEN_H + SEAM * 2),
                            borderRadius: px(SCREEN_R + SEAM),
                            overflow: "hidden",
                            backgroundColor: "#000000",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: px(SEAM),
                                top: px(SEAM),
                                width: px(SCREEN_W),
                                height: px(SCREEN_H),
                                borderRadius: px(SCREEN_R),
                                overflow: "hidden",
                                // Black, not white. Every stage of this hero fills
                                // the screen edge to edge, so nothing needs a pale
                                // ground — and a pale one is what let the App
                                // Store's dark artwork show a light fringe where
                                // its rounded corner met the clip.
                                backgroundColor: "#000000",
                            }}
                        >
                            {/* The home screen, behind both apps. It is only
                            ever seen through the gap one app leaves on its
                            way out and the next fills on its way in. */}
                            <img
                                aria-hidden="true"
                                src={`${BASE}/homescreen-941.webp`}
                                alt=""
                                loading="lazy"
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: px(SCREEN_W),
                                    height: px(SCREEN_H),
                                    display: "block",
                                    // Pushed back and faded while an app is over
                                    // it, settling to rest when the app leaves.
                                    // Zoomed from the centre, as the icons spread
                                    // from the centre on the real thing.
                                    transformOrigin: "50% 50%",
                                    transform: atHome
                                        ? "scale(1)"
                                        : `scale(${HOME_ZOOM})`,
                                    opacity: atHome ? 1 : 0,
                                    transition: animate
                                        ? [
                                              `transform ${MORPH_MS}ms ${APPLE_EASE}`,
                                              `opacity ${Math.round(MORPH_MS * 0.6)}ms linear`,
                                          ].join(", ")
                                        : "none",
                                }}
                            />

                            {/* Uber Eats, which shrinks into its own icon while
                            the App Store grows out of its — the same thing
                            iOS does when you leave one app for another. */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    // Opaque, or the home screen now behind it
                                    // shows through: the offer card is 358 wide
                                    // in a 393 screen, so the strips either side
                                    // of it were never covered by anything.
                                    backgroundColor: "#FFFFFF",
                                    // Scaled into its own icon rather than
                                    // merely dimmed: this is the app closing, so
                                    // it has to go somewhere, and the place it
                                    // goes is the slot the App Store will not
                                    // open from.
                                    transformOrigin: "top left",
                                    transform: appAway
                                        ? `translate3d(${px(UBER_SLOT.x)}px, ${px(UBER_SLOT.y)}px, 0) scale(${ICON / SCREEN_W})`
                                        : "translate3d(0, 0, 0) scale(1)",
                                    // The display's own radius at rest, morphing
                                    // to the icon's. Pre-divided by the scale it
                                    // is about to be given, so what lands is
                                    // ICON_R and not a thirteenth of it. Starting
                                    // from 0 left the window square-cornered for
                                    // the first part of the shrink, which the real
                                    // one never is.
                                    borderRadius: appAway
                                        ? px(ICON_R / (ICON / SCREEN_W))
                                        : px(SCREEN_R),
                                    overflow: "hidden",
                                    opacity: appAway ? 0 : 1,
                                    transition: [
                                        `transform ${MORPH_MS}ms ${APPLE_EASE}`,
                                        `border-radius ${MORPH_MS}ms ${APPLE_EASE}`,
                                        // Held opaque until it is nearly the size
                                        // of the icon, so it never dissolves in
                                        // mid-air.
                                        `opacity ${Math.round(MORPH_MS * 0.3)}ms linear ${Math.round(MORPH_MS * 0.7)}ms`,
                                    ].join(", "),
                                }}
                            >
                                {/* The screen the order is placed on. */}
                                <img
                                    src={`${BASE}/flow-loading.webp`}
                                    alt=""
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        width: px(SCREEN_W),
                                        height: px(SCREEN_H),
                                        display: "block",
                                        opacity: screen === "loading" ? 1 : 0,
                                        transition: animate
                                            ? `opacity ${SCREEN_MS}ms ${PAGE_EASE}`
                                            : "none",
                                    }}
                                />

                                {/* The loader's icons, rising in turn. */}
                                {LOAD_ICONS.map(([x, y, w, h], i) => (
                                    <img
                                        key={i}
                                        src={`${BASE}/load-icon-${i + 1}.webp`}
                                        alt=""
                                        style={{
                                            position: "absolute",
                                            left: px(x),
                                            top: px(y),
                                            width: px(w),
                                            height: px(h),
                                            display: "block",
                                            opacity:
                                                screen === "loading" ? 1 : 0,
                                            animation: animate
                                                ? `uber-load-bounce ${LOAD_BOUNCE_MS}ms ease-in-out ${i * 130}ms infinite`
                                                : "none",
                                            transition: animate
                                                ? `opacity ${SCREEN_MS}ms ${PAGE_EASE}`
                                                : "none",
                                        }}
                                    />
                                ))}

                                {/* The tracking page, travelling under a bar
                                    that stays where it is. */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        opacity: screen === "track" ? 1 : 0,
                                        transition: animate
                                            ? `opacity ${SCREEN_MS}ms ${PAGE_EASE}`
                                            : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: px(PAGE_TOP),
                                            width: px(SCREEN_W),
                                            height: px(SCREEN_H - PAGE_TOP),
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                width: px(SCREEN_W),
                                                transform: `translate3d(0, ${px(-scrollY)}px, 0)`,
                                                transition: animate
                                                    ? `transform ${SCROLL_MS}ms ${PAGE_EASE}`
                                                    : "none",
                                            }}
                                        >
                                            <img
                                                src={`${BASE}/flow-page-a2.webp`}
                                                alt=""
                                                style={{
                                                    width: px(SCREEN_W),
                                                    height: px(PAGE_A_H),
                                                    display: "block",
                                                }}
                                            />

                                            {/* The offer, in the slot the
                                                page left for it. In flow, so
                                                the half below follows its
                                                height without anything having
                                                to be told what that is. */}
                                            <div
                                                style={{
                                                    marginLeft: px(SLOT_X),
                                                    width: px(CARD_W),
                                                }}
                                            >
                                                <UberOfferCard
                                                    offer={offer}
                                                    index={
                                                        index % OFFERS.length
                                                    }
                                                    px={px}
                                                    swapMs={PAGE_MS}
                                                    animate={animate}
                                                    tap={tap}
                                                    tapKey={tapKey}
                                                />
                                            </div>

                                            <img
                                                src={`${BASE}/flow-page-b2.webp`}
                                                alt=""
                                                style={{
                                                    width: px(SCREEN_W),
                                                    height: px(PAGE_B_H),
                                                    display: "block",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* The bar's own ground, so the page
                                        scrolls under it rather than up to
                                        it. The same depth at every scroll
                                        position. */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: px(BAR_H),
                                            width: px(SCREEN_W),
                                            height: px(BAR_PAD),
                                            background: "#FFFFFF",
                                            opacity: 1,
                                        }}
                                    />

                                    <img
                                        src={`${BASE}/flow-bar.webp`}
                                        alt=""
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            width: px(SCREEN_W),
                                            height: px(BAR_H),
                                            display: "block",
                                        }}
                                    />
                                </div>
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
                                    left: storeOpen ? 0 : px(STORE_SLOT.x),
                                    top: storeOpen ? 0 : px(STORE_SLOT.y),
                                    width: px(storeOpen ? SCREEN_W : ICON),
                                    height: px(storeOpen ? SCREEN_H : ICON),
                                    borderRadius: px(
                                        storeOpen ? SCREEN_R : ICON_R,
                                    ),
                                    overflow: "hidden",
                                    opacity: storeOpen ? 1 : 0,
                                    pointerEvents: "none",
                                    boxShadow: "none",
                                    transition: animate
                                        ? [
                                              `left ${MORPH_MS}ms ${APPLE_EASE}`,
                                              `top ${MORPH_MS}ms ${APPLE_EASE}`,
                                              `width ${MORPH_MS}ms ${APPLE_EASE}`,
                                              `height ${MORPH_MS}ms ${APPLE_EASE}`,
                                              `border-radius ${MORPH_MS}ms ${APPLE_EASE}`,
                                              // Opacity resolves early on the
                                              // way in and late on the way
                                              // out, so the morph is never
                                              // visible as an empty rectangle.
                                              `opacity ${Math.round(MORPH_MS * 0.45)}ms linear`,
                                          ].join(", ")
                                        : "none",
                                }}
                            >
                                <img
                                    src={`${BASE}/appstore-941.webp`}
                                    alt=""
                                    loading="lazy"
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        width: px(SCREEN_W),
                                        height: px(SCREEN_H),
                                        display: "block",
                                        transform: `translate(-50%, -50%) scale(${storeOpen ? 1 : ICON / SCREEN_W})`,
                                        transition: animate
                                            ? `transform ${MORPH_MS}ms ${APPLE_EASE}`
                                            : "none",
                                    }}
                                />
                            </div>

                            {/* The end. Over every surface and under the
                                frame, and with no transition on it, because
                                this is a cut: the phone is still there, the
                                screen is simply done. */}
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "#000000",
                                    opacity: cut ? 1 : 0,
                                    pointerEvents: "none",
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
