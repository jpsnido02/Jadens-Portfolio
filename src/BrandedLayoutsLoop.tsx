/**
 * Branded Layouts hero: one placement, six partners, shuffled.
 *
 * The rotation itself lives in ./partners, shared with the partner tile on
 * this project's card, so the icon there and the screen here are always the
 * same brand.
 *
 * The placement inherits a partner's brand automatically, so what the hero has
 * to show is the same thing arriving again and again wearing someone else's
 * identity. It runs as a sideways carousel — a whole phone travels out to the
 * left while the next comes in from the right.
 *
 * Each screen is the partner's own confirmation page with the placement over
 * it, exported from the design file and cropped to the screen's 393x852. The
 * frame is PhoneShell, the same one the other two phone heroes use.
 *
 * Under the phone, every partner is named at once in a progress bar. The hero
 * used to name only the partner it was showing, which meant the list of brands
 * this has shipped against — the most persuasive thing on the card — was only
 * ever legible one sixth at a time, and only to someone who waited out three
 * minutes of rotation. Naming all six and filling each segment as its turn
 * elapses says who the partners are at a glance, and says how much is left.
 */

import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react"
import { FRAME_H, FRAME_W, PhoneShell } from "./ShoppablePhone"
import { FONT_FAMILY } from "./tokens"
import {
    currentPartner,
    HOLD_MS,
    MARK,
    MARK_H,
    MARK_W,
    PARTNERS,
    SCREEN,
    subscribe,
    watchVisibility,
} from "./partners"

/**
 * How long a phone takes to travel. Slower than the 980ms it started on: the
 * screen arriving is the only chance to see it move, and at that speed it was
 * across before the eye had followed it. Still well inside partners.ts's
 * HOLD_MS, so a slide always lands before the next one is asked for.
 */
const SLIDE_MS = 1280
/** Apple's presentation curve: decisive away, long settle in. */
const SLIDE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
/** Clearance past the edge, so a phone's shadow leaves with it. */
const SHADOW_ROOM = 60
/** The bar's track, and the gap between its segments. */
const TRACK_H = 3
const SEG_GAP = 8
/** Track to mark. */
const MARK_GAP = 10
/** Between the two rows, when there are two. */
const ROW_GAP = 10
/**
 * Below this the six names cannot be set large enough to read across a single
 * row, so the bar takes two rows of three instead. Six across a phone works
 * out at 47px a segment, which puts "FANATICS" at 7px — present, but not
 * legible enough to be worth the space it takes.
 */
const ONE_ROW_MIN_W = 420
/** The mark's width, between these, as the segment allows. */
const MARK_MIN = 44
const MARK_MAX = 84

export default function BrandedLayoutsLoop({
    alt,
    ink = "#E2E8F0",
    muted = "#94A3B8",
    accent = "#53B1FD",
}: {
    alt?: string
    /** The mark of the partner being shown. */
    ink?: string
    /** The track, and the five marks that are not current. */
    muted?: string
    /** The elapsed part of the bar. */
    accent?: string
}) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 0, h: 0 })

    /**
     * Which partner is on screen comes from the shared rotation, so the icon
     * on this project's card is always the same brand as the screen here.
     */
    const current = useSyncExternalStore(subscribe, currentPartner, () => 0)
    const [outgoing, setOutgoing] = useState<number | null>(null)
    const previous = useRef(current)
    /** The fill runs on the rotation's clock, so it stops when that does. */
    const [watching, setWatching] = useState(true)

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

    // The rotation's clock runs only while something showing it is on screen,
    // so scrolling to the hero gives a full hold before the first slide.
    useEffect(() => watchVisibility(wrapRef.current, setWatching), [])

    // The phone leaving is whichever one the rotation just moved off.
    useEffect(() => {
        if (previous.current === current) return
        setOutgoing(previous.current)
        previous.current = current
    }, [current])

    // The departed phone is released once it has left. It is already past the
    // clip by then, so sending it back round to the right is never seen.
    useEffect(() => {
        if (outgoing === null) return
        const clear = window.setTimeout(() => setOutgoing(null), SLIDE_MS + 60)
        return () => window.clearTimeout(clear)
    }, [outgoing])

    const pad = box.w < 480 ? 12 : 24
    const availW = Math.max(0, box.w - pad * 2)
    const cols = box.w < ONE_ROW_MIN_W ? 3 : PARTNERS.length
    const rows = Math.ceil(PARTNERS.length / cols)
    const segW = (availW - SEG_GAP * (cols - 1)) / cols
    const markW = Math.round(Math.max(MARK_MIN, Math.min(MARK_MAX, segW * 0.8)))
    const markH = Math.round(markW * (MARK_H / MARK_W))
    const barRoom = (TRACK_H + MARK_GAP + markH) * rows + ROW_GAP * (rows - 1)
    const availH = Math.max(0, box.h - pad * 2 - barRoom)
    const width = Math.max(
        0,
        Math.min(availW, availH * (FRAME_W / FRAME_H), 440),
    )
    /** Far enough that a phone is wholly outside the clip, shadow included. */
    const off = box.w / 2 + width / 2 + SHADOW_ROOM
    /**
     * Six names across is what sets this, not taste: the segment is whatever
     * is left after the pane's inset and the gaps, and the longest name has to
     * sit inside it. Measured against "FANATICS", the widest of the six, which
     * needs about 6.2px of width per point of size at this tracking.
     */

    return (
        <div
            ref={wrapRef}
            role="img"
            aria-label={
                alt ??
                `One placement rendered in six partners' brands: ${PARTNERS.map((p) => p.name).join(", ")}.`
            }
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                // The carousel is clipped to the pane, so a phone on its way
                // out is cut off at the edge rather than drifting over the page.
                overflow: "hidden",
            }}
        >
            {width > 0 &&
                PARTNERS.map((p, i) => {
                    const isCurrent = i === current
                    const isOutgoing = i === outgoing
                    // Centre stage, gone to the left, or waiting on the right.
                    const x = isCurrent ? 0 : isOutgoing ? -off : off
                    return (
                        <div
                            key={p.id}
                            style={{
                                position: "absolute",
                                left: "50%",
                                // Nudged down by half the name's room, so the
                                // name and the phone together sit centred in
                                // the pane rather than the phone alone.
                                top: `calc(50% - ${barRoom / 2}px)`,
                                transform: `translate3d(calc(-50% + ${x}px), -50%, 0)`,
                                // Only the two phones in motion carry a
                                // transition, so returning the departed one to
                                // the right happens instantly, out of sight.
                                transition:
                                    isCurrent || isOutgoing
                                        ? `transform ${SLIDE_MS}ms ${SLIDE_EASE}`
                                        : "none",
                            }}
                        >
                            <PhoneShell width={width}>
                                {() => (
                                    <img
                                        src={SCREEN(p.id)}
                                        alt=""
                                        // All six stay mounted, so a phone
                                        // never slides in still decoding.
                                        loading="eager"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                            objectFit: "cover",
                                        }}
                                    />
                                )}
                            </PhoneShell>
                        </div>
                    )
                })}

            {/* Every partner at once, and how far through the current one is.
                Sits under the phone rather than over it, so it reads as a
                caption to the carousel and not as chrome on the device. */}
            {width > 0 && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: pad,
                        right: pad,
                        bottom: pad,
                        display: "grid",
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        rowGap: ROW_GAP,
                        columnGap: SEG_GAP,
                        fontFamily: FONT_FAMILY,
                    }}
                >
                    {PARTNERS.map((p, i) => {
                        const done = i < current
                        const active = i === current
                        return (
                            <div key={p.id}>
                                <div
                                    style={{
                                        height: TRACK_H,
                                        borderRadius: TRACK_H,
                                        overflow: "hidden",
                                        // The unelapsed track. At a quarter
                                        // alpha over two pixels this was
                                        // invisible against both grounds —
                                        // the bar looked like it had no
                                        // track at all and the fill like a
                                        // stray rule.
                                        backgroundColor: muted,
                                        opacity: 0.5,
                                    }}
                                >
                                    <div
                                        // Re-keyed on the partner, so the fill
                                        // starts over rather than carrying its
                                        // old progress into the new segment.
                                        key={active ? current : "idle"}
                                        style={{
                                            height: "100%",
                                            backgroundColor: accent,
                                            transformOrigin: "left center",
                                            transform: done
                                                ? "scaleX(1)"
                                                : "scaleX(0)",
                                            animation: active
                                                ? `brand-fill ${HOLD_MS}ms linear forwards`
                                                : "none",
                                            animationPlayState: watching
                                                ? "running"
                                                : "paused",
                                        }}
                                    />
                                </div>
                                {/* The mark, not the name. These are the
                                    brands the work shipped against, and a
                                    logo is recognised where eight uppercase
                                    characters at 10px are only read — if
                                    they are read at all.

                                    Drawn as a mask rather than placed as an
                                    image, so one file is white on the dark
                                    theme and near-black on the light one.
                                    Their own colours would have put six
                                    competing grounds in a row underneath a
                                    phone already wearing one of them. */}
                                <div
                                    style={{
                                        width: markW,
                                        height: markH,
                                        margin: `${MARK_GAP}px auto 0`,
                                        backgroundColor: active ? ink : muted,
                                        opacity: active ? 1 : 0.55,
                                        maskImage: `url(${MARK(p.id)})`,
                                        WebkitMaskImage: `url(${MARK(p.id)})`,
                                        maskSize: "contain",
                                        WebkitMaskSize: "contain",
                                        maskRepeat: "no-repeat",
                                        WebkitMaskRepeat: "no-repeat",
                                        maskPosition: "center",
                                        WebkitMaskPosition: "center",
                                        transition:
                                            "background-color 320ms linear, opacity 320ms linear",
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
