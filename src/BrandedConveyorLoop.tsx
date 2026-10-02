/**
 * Branded Layouts, second take: a conveyor instead of a carousel.
 *
 * The carousel version holds a partner, slides, holds the next. At the seam of
 * a shuffled pass that slide lands in the same frame the order behind it
 * changes, and the result reads as the animation restarting rather than
 * carrying on — most visibly going from Frontier to SeatGeek.
 *
 * This one never stops, so there is no seam for a reshuffle to land on. The
 * phones drift sideways at a constant speed and fade into the card's own
 * surface at each edge, which also buys the thing you are looking at a longer
 * run across the pane before it goes.
 *
 * The order is the list's own rather than shuffled: a conveyor is a ring, and
 * reordering a ring while it turns is the problem this version exists to
 * avoid.
 *
 * Each phone carries its partner's name, so the name cannot be over the wrong
 * phone no matter where the belt is.
 */

import { useLayoutEffect, useRef, useState } from "react"
import { FRAME_H, FRAME_W, PhoneShell } from "./ShoppablePhone"
import { FONT_FAMILY } from "./tokens"
import { PARTNERS, SCREEN } from "./partners"
import { CYCLE_MS, LOOP, useConveyorRun } from "./conveyor"

/** Space between phones, as a share of a phone's width. */
const GAP_RATIO = 0.16
/**
 * A phone's width, as a share of the pane.
 *
 * It has to fit inside what the fades leave clear, or a phone is never once
 * wholly in the open: at 0.74 of a pane with 0.3 fades either side, the clear
 * middle was narrower than the phone itself, so the thing you were meant to be
 * looking at was always partly dissolved or cut off at the edge. Kept under
 * 1 - 2 * EDGE_RATIO so a phone crossing the centre is fully in the clear.
 */
const PHONE_RATIO = 0.56
/** Room above a phone for its partner's name. */
const LABEL_ROOM = 26
/** How much of the pane each edge fades over. */
const EDGE_RATIO = 0.2

export default function BrandedConveyorLoop({ alt }: { alt?: string }) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 0, h: 0 })
    /** Read once on mount: seeking the animation on every render would
     *  restart it, and the point of the shared epoch is that it does not. */
    const { running, delay } = useConveyorRun(wrapRef)

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

    const pad = box.w < 480 ? 12 : 20
    const availH = Math.max(0, box.h - pad * 2 - LABEL_ROOM)
    // Deliberately narrower than the pane: a conveyor only reads as one if
    // the next thing along is already on its way in.
    const width = Math.max(
        0,
        Math.min(
            availH * (FRAME_W / FRAME_H),
            (box.w - pad * 2) * PHONE_RATIO,
            420
        ),
    )
    const gap = width * GAP_RATIO
    const slot = width + gap
    /** One copy of the list. Translating exactly this far wraps invisibly. */
    const shift = slot * PARTNERS.length

    return (
        <div
            ref={wrapRef}
            role="img"
            aria-label={
                alt ??
                `One placement rendered in six partners' brands, drifting past in turn: ${PARTNERS.map((p) => p.name).join(", ")}.`
            }
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {width > 0 && (
                <>
                    <div
                        className="conveyor-track"
                        style={{
                            position: "absolute",
                            // Started so the first phone is centred, not
                            // flush left. The tile on this project's card is
                            // a one-icon window, so its first icon is centred
                            // at phase zero by definition; the hero has to
                            // agree or the two sit a whole partner apart for
                            // the entire cycle.
                            left: (box.w - width) / 2,
                            // The belt sits where a phone is vertically
                            // centred, with the name's room left above it.
                            top:
                                (box.h -
                                    width * (FRAME_H / FRAME_W) +
                                    LABEL_ROOM) /
                                2,
                            gap,
                            ...({ "--conveyor-shift": `${shift}px` } as object),
                            animationDuration: `${CYCLE_MS}ms`,
                            animationDelay: delay,
                            animationPlayState: running ? "running" : "paused",
                        }}
                    >
                        {LOOP.map((p, i) => (
                            <div
                                key={`${p.id}-${i}`}
                                style={{ position: "relative", flexShrink: 0 }}
                            >
                                {/* The name rides its own phone. */}
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
                        ))}
                    </div>

                    {/* The ground each phone disappears into. */}
                    <div
                        className="conveyor-edge conveyor-edge--left"
                        style={{ width: box.w * EDGE_RATIO }}
                    />
                    <div
                        className="conveyor-edge conveyor-edge--right"
                        style={{ width: box.w * EDGE_RATIO }}
                    />
                </>
            )}
        </div>
    )
}
