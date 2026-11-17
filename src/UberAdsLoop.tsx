import UberOfferCard, { OFFERS, UBER_DISPLAY, UBER_TEXT, swapDurations, type SwapPhase } from "./UberOfferCard"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import usePausablePlaybackTimer, { usePausableSubtreeAnimations } from "./usePausablePlaybackTimer"
import { cycleMs, type LoopReporter } from "./LoopProgress"

/**
 * The Uber Ads hero: the Rokt placement cycling through four offers, then the
 * Disney+ offer opening the App Store.
 *
 * The tracking page uses the original map and chrome. The order status and
 * offer cards are live text, so their animations stay sharp at each zoom level.
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
// The map and delivery details use original captures. The receipt and live offer
// travel together on the order sheet underneath the tracking map.
// The original status bar and a complete navigation row stay fixed above the page.
const PAGE_TOP = 106
const TRACKING_CAPTURE_H = 736
const TRACKING_MAP_H = 364
const SUMMARY_H = 280
const SHEET_TRAVEL = SCREEN_H - PAGE_TOP - TRACKING_MAP_H
const OFFER_GAP = 16
const DETAILS_CAPTURE_H = 466
const DETAILS_H = 376
/** The offer's inset, matching the slot the cream container occupied. */
const SLOT_X = 16
/** Where the offer lands once the page has scrolled to it. */
const SLOT_Y = 203
const SCROLL_TO = PAGE_TOP + TRACKING_MAP_H + SUMMARY_H + OFFER_GAP - SLOT_Y

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
const LOOP_BLACKOUT_MS = 520
const LOOP_REVEAL_MS = 700
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
    | { kind: "openSheet"; ms: number }
    | { kind: "scroll"; to: number; ms: number }
    /** To black, and hold there. */
    | { kind: "cut"; ms: number }
    | { kind: "rewind"; ms: number }
    | { kind: "reveal"; ms: number }
    | { kind: "reset"; ms: number }

const SCROLL_MS = 1150
const SHEET_ENTER_MS = 640

// Give the order one preparation cycle, then let viewers read the settled
// receipt before following the offer further down the same sheet.
const TRACKING_INTRO: Step[] = [
    { kind: "hold", ms: 1440 },
    { kind: "openSheet", ms: SHEET_ENTER_MS },
    { kind: "hold", ms: 1800 },
    { kind: "scroll", to: SCROLL_TO, ms: 680 },
    { kind: "zoom", to: "offer", ms: ZOOM_MS },
]

const SCRIPT: Step[] = [
    ...TRACKING_INTRO,
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

/** Both presentations start on the same order-tracking page. */
const GALLERY_SCRIPT: Step[] = [
    ...TRACKING_INTRO,
    { kind: "hold", ms: 2100 },
    { kind: "tap", on: "notNow", ms: 320 },
    { kind: "advance", ms: PAGE_MS },
    { kind: "hold", ms: 2100 },
    { kind: "tap", on: "notNow", ms: 320 },
    { kind: "advance", ms: PAGE_MS },
    { kind: "hold", ms: 2100 },
    { kind: "tap", on: "notNow", ms: 320 },
    { kind: "advance", ms: PAGE_MS },
    { kind: "hold", ms: 2600 },
    { kind: "tap", on: "claim", ms: 320 },
    { kind: "zoom", to: "wide", ms: ZOOM_MS },
    { kind: "stage", to: "home", ms: CLOSE_MS },
    { kind: "hold", ms: 560 },
    { kind: "stage", to: "store", ms: OPEN_MS },
    { kind: "hold", ms: 3200 },
    // Rewind to the order behind the curtain before the next pass.
    { kind: "cut", ms: LOOP_BLACKOUT_MS },
    { kind: "rewind", ms: 60 },
    { kind: "reveal", ms: LOOP_REVEAL_MS },
    { kind: "reset", ms: 60 },
]

type PhoneState = {
    index: number
    pagerIndex: number
    phase: SwapPhase
    stage: Stage
    zoom: "wide" | "offer"
    sheetOpen: boolean
    scrollY: number
    cut: boolean
    tap: "notNow" | "claim" | null
    animate: boolean
}

function openingState(): PhoneState {
    return {
        index: 0, pagerIndex: 0, phase: "idle", stage: "app",
        zoom: "wide", sheetOpen: false,
        scrollY: 0, cut: false, tap: null, animate: false,
    }
}

/** One clock controls every change, including the three parts of an offer swap. */
function makeTimeline(script: Step[]) {
    let state = openingState()
    const frames: (PhoneState & { kind: Step["kind"]; ms: number })[] = []
    for (const step of script) {
        state = { ...state, animate: true, tap: null, phase: "idle" }
        switch (step.kind) {
            case "advance": {
                const { exitMs, resizeMs, enterMs } = swapDurations(step.ms)
                frames.push({ ...state, phase: "out", kind: step.kind, ms: exitMs })
                state.index += 1
                frames.push({ ...state, phase: "resize", kind: step.kind, ms: resizeMs })
                state.pagerIndex = state.index
                frames.push({ ...state, phase: "in", kind: step.kind, ms: enterMs })
                continue
            }
            case "tap": state.tap = step.on; break
            case "stage": state.stage = step.to; break
            case "zoom": state.zoom = step.to; break
            case "openSheet": state.sheetOpen = true; break
            case "scroll": state.scrollY = step.to; break
            case "cut": state.cut = true; break
            case "rewind": state = { ...openingState(), cut: true }; break
            case "reveal": state.cut = false; break
            case "reset": state = openingState(); break
        }
        frames.push({ ...state, kind: step.kind, ms: step.ms })
    }
    return frames
}

const GALLERY_TIMELINE = makeTimeline(GALLERY_SCRIPT)
const FULL_TIMELINE = makeTimeline(SCRIPT)
const TRACKING_POSTER: PhoneState = { ...openingState(), zoom: "offer", scrollY: SCROLL_TO, sheetOpen: true }

interface UberAdsLoopProps {
    gallery?: boolean
    paused?: boolean
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
    paused = false,
    gallery = false,
    fit = "width",
    onProgress,
}: UberAdsLoopProps) {
    const timeline = gallery ? GALLERY_TIMELINE : FULL_TIMELINE
    const wrapRef = useRef<HTMLDivElement>(null)
    // Starts at 1 rather than 0: the first measurement happens synchronously
    // below, and if it ever fails the component still renders at full size
    // instead of collapsing to an empty box.
    const [scale, setScale] = useState(1)
    // Starts visible so a suspended IntersectionObserver cannot leave the
    // loop permanently stopped; the observer only ever pauses it.
    const [visible, setVisible] = useState(true)
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)

    const [step, setStep] = useState(0)
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
        onProgress?.(cycleMs(timeline.map(frame => frame.ms)), passes.current)
    }, [step, timeline, onProgress])

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

    // Returning from offscreen intentionally starts a new pass. A manual
    // pause retains the exact frame and its unspent time.
    useEffect(() => {
        if (visible) setStep(timeline.length - 1)
    }, [visible, timeline])

    const frame = timeline[step] ?? timeline[0]
    const playing = !paused && visible && !reduced
    usePausablePlaybackTimer({
        entryKey: step,
        duration: frame.ms,
        playing,
        onElapsed: () => setStep(current => (current + 1) % timeline.length),
    })
    usePausableSubtreeAnimations(wrapRef, playing, step)
    const { index, stage, zoom, sheetOpen, scrollY, cut, tap, animate, phase, pagerIndex } = reduced ? TRACKING_POSTER : frame
    const offer = OFFERS[index]
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
            className="uber-demo"
            data-reduced-motion={reduced}
            data-loop-phase={reduced ? "poster" : frame.kind}
            data-loop-stage={stage}
            data-loop-camera={zoom}
            data-loop-black={cut}
            role="img"
            aria-label={
                reduced ? "Lenwich received your breakfast order and is preparing it. The tracking page offers Spotify Premium to listen to while you wait." : alt ??
                "Lenwich is preparing a breakfast order. The Uber Eats tracking page scrolls to four offers, ending with Disney+ opening the App Store."
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
                transform: zoom === "offer" ? `scale(${gallery ? 2.25 : ZOOM_SCALE})` : "none",
                transition: animate
                    ? `transform ${ZOOM_MS}ms ${APPLE_EASE}`
                    : "none",
            }}
        >
            {
                <div
                    key={reduced ? "poster" : "playback"}
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
                                {/* The page travels underneath the fixed navigation bar. */}
                                <div style={{ position: "absolute", inset: 0 }}>
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: px(PAGE_TOP),
                                            width: px(SCREEN_W),
                                            height: px(SCREEN_H - PAGE_TOP),
                                            background: "#f2f2f2",
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
                                            <div style={{ position: "relative", height: px(TRACKING_MAP_H), overflow: "hidden" }}>
                                                <img src={`${BASE}/flow-page-a2.webp`} alt=""
                                                    style={{ width: px(SCREEN_W), height: px(TRACKING_CAPTURE_H), display: "block" }} />
                                                <div className="uber-order-status" style={{
                                                    position: "absolute", inset: "0 0 auto", height: px(54),
                                                    padding: `${px(21)}px ${px(16)}px 0`, boxSizing: "border-box",
                                                    background: "linear-gradient(#fff, #f3f3f3)", color: "#080808",
                                                    fontFamily: UBER_DISPLAY, fontSize: px(24), lineHeight: 1.15, fontWeight: 700,
                                                }}>
                                                    Preparing order<span aria-hidden="true" className="uber-preparing-dots"
                                                        style={{ animationPlayState: playing && scrollY === 0 && !cut ? "running" : "paused" }}>...</span>
                                                </div>
                                            </div>
                                            <div className="uber-order-sheet" style={{
                                                font: `500 ${px(16)}px/1.25 ${UBER_TEXT}`,
                                                transform: `translate3d(0, ${px(sheetOpen ? 0 : SHEET_TRAVEL)}px, 0)`,
                                                transition: animate ? `transform ${SHEET_ENTER_MS}ms ${PAGE_EASE}` : "none",
                                            }}>
                                                <div className="uber-order-summary" style={{ height: px(SUMMARY_H), marginBottom: px(OFFER_GAP) }}>
                                                    <div className="uber-sheet-grip" aria-hidden="true" />
                                                    <div className="uber-summary-heading"><strong>Order summary</strong><span>View receipt</span></div>
                                                    <div className="uber-summary-merchant">Lenwich</div>
                                                    <div className="uber-summary-item">
                                                        <span className="uber-summary-quantity">1</span>
                                                        <div>
                                                            Egg and cheese sandwich
                                                            <div className="uber-summary-choices">Kaiser roll · American cheese</div>
                                                        </div>
                                                    </div>
                                                    <dl className="uber-summary-charges">
                                                        <div><dt>Subtotal</dt><dd>$8.50</dd></div>
                                                        <div><dt>Service fee</dt><dd>$0.45</dd></div>
                                                        <div><dt>Tax</dt><dd>$0.76</dd></div>
                                                        <div className="uber-summary-total"><dt>Total</dt><dd>$9.71</dd></div>
                                                    </dl>
                                                </div>
                                                <div
                                                    style={{
                                                        marginLeft: px(SLOT_X),
                                                        width: px(CARD_W),
                                                    }}
                                                >
                                                    <UberOfferCard
                                                        offer={offer}
                                                        index={index}
                                                        phase={phase}
                                                        pagerIndex={pagerIndex}
                                                        px={px}
                                                        swapMs={PAGE_MS}
                                                        animate={animate}
                                                        tap={tap}
                                                        tapKey={step}
                                                    />
                                                </div>

                                                <div style={{ height: px(DETAILS_H), overflow: "hidden" }}>
                                                    <img src={`${BASE}/flow-page-b2.webp`} alt=""
                                                        style={{ width: px(SCREEN_W), height: px(DETAILS_CAPTURE_H), display: "block" }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ position: "absolute", inset: "0 0 auto", height: px(PAGE_TOP), background: "#fff" }}>
                                        <div style={{ height: px(60), overflow: "hidden" }}>
                                            <img src={`${BASE}/flow-bar.webp`} alt="" style={{ width: "100%", display: "block" }} />
                                        </div>
                                        <div className="uber-tracking-nav" style={{ fontSize: px(16), fontFamily: UBER_TEXT }}>
                                            <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" aria-hidden="true">
                                                <path d="M20 12H4m7-8-7 8 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                            </svg>
                                            <span>Help</span>
                                        </div>
                                    </div>
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

                            {/* Black stays inside the real phone frame. The
                                gallery returns to the tracking page under this layer. */}
                            <div
                                data-loop-curtain
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "#000000",
                                    opacity: cut ? 1 : 0,
                                    transition: gallery && animate
                                        ? `opacity ${cut ? LOOP_BLACKOUT_MS : LOOP_REVEAL_MS}ms ease-in-out`
                                        : "none",
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
