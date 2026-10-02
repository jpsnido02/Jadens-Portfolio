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
    PARTNERS,
    SCREEN,
    subscribe,
    watchVisibility,
} from "./partners"

const SLIDE_MS = 980
/** Apple's presentation curve: decisive away, long settle in. */
const SLIDE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
/** Clearance past the edge, so a phone's shadow leaves with it. */
const SHADOW_ROOM = 60
/**
 * Height set aside above the phone for its partner's name, so the name is
 * never clipped by the pane when the phone is as tall as it can be.
 */
const LABEL_ROOM = 26

export default function BrandedLayoutsLoop({ alt }: { alt?: string }) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 0, h: 0 })

    /**
     * Which partner is on screen comes from the shared rotation, so the icon
     * on this project's card is always the same brand as the screen here.
     */
    const current = useSyncExternalStore(subscribe, currentPartner, () => 0)
    const [outgoing, setOutgoing] = useState<number | null>(null)
    const previous = useRef(current)

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
    useEffect(() => watchVisibility(wrapRef.current), [])

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
    const availH = Math.max(0, box.h - pad * 2 - LABEL_ROOM)
    const width = Math.max(
        0,
        Math.min(availW, availH * (FRAME_W / FRAME_H), 440)
    )
    /** Far enough that a phone is wholly outside the clip, shadow included. */
    const off = box.w / 2 + width / 2 + SHADOW_ROOM

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
                                top: `calc(50% + ${LABEL_ROOM / 2}px)`,
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
                            {/* The partner's name, on the phone it belongs
                                to rather than on the pane. Centred once for
                                the whole hero, it snapped to the incoming
                                partner while that phone was still most of a
                                screen away, so for the first half of every
                                slide the name sat over the phone leaving.
                                Riding its own phone, it cannot. The set of
                                logos here is not available as artwork — only
                                SeatGeek is in any icon library — and naming
                                them scales to however many partners there
                                are, where a row of marks does not. */}
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: -LABEL_ROOM,
                                    textAlign: "center",
                                    fontFamily: FONT_FAMILY,
                                    fontSize: 9.5,
                                    fontWeight: 600,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "#94A3B8",
                                }}
                            >
                                {p.name}
                            </div>

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
        </div>
    )
}
