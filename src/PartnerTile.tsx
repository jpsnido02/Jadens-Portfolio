/**
 * One thumbnail slot that carousels through partner logos.
 *
 * The project it serves covered many brands, and a row of five tiles said so
 * but was tiring to look at — five small busy marks competing inside a card
 * that otherwise holds one. A single slot cycling through them says the same
 * thing over time, keeps the card's rhythm identical to every other card, and
 * gives each mark the full tile instead of a fifth of it.
 *
 * The motion is the hero carousel's: one mark leaves to the left as the next
 * arrives from the right, and nothing is ever mid-blend with anything else.
 *
 * Which partner shows comes from ./partners, the same rotation the hero reads,
 * so this tile and the phone beside it are never two different brands.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { currentPartner, ICON, PARTNERS, subscribe } from "./partners"

/** Shorter than the hero's slide: the tile is small, so it settles sooner. */
const SLIDE_MS = 700
/** Apple's presentation curve, as the hero uses. */
const SLIDE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"

export default function PartnerTile({
    size,
    radius,
    cornerShape,
    border,
}: {
    size: number
    radius: number
    cornerShape: string
    border: string
}) {
    const current = useSyncExternalStore(subscribe, currentPartner, () => 0)
    const [outgoing, setOutgoing] = useState<number | null>(null)
    const previous = useRef(current)
    const wrapRef = useRef<HTMLDivElement>(null)

    // The icon leaving is whichever one the rotation just moved off.
    useEffect(() => {
        if (previous.current === current) return
        setOutgoing(previous.current)
        previous.current = current
    }, [current])

    // Released once it has left. It is past the clip by then, so sending it
    // back round to the right is never seen.
    useEffect(() => {
        if (outgoing === null) return
        const id = window.setTimeout(() => setOutgoing(null), SLIDE_MS + 60)
        return () => window.clearTimeout(id)
    }, [outgoing])

    return (
        <div
            ref={wrapRef}
            style={{
                width: size,
                height: size,
                borderRadius: radius,
                ...({ cornerShape } as object),
                overflow: "hidden",
                border: `1px solid ${border}`,
                boxSizing: "border-box",
                flexShrink: 0,
                position: "relative",
            }}
        >
            {PARTNERS.map((p, i) => {
                const isCurrent = i === current
                const isOutgoing = i === outgoing
                return (
                    <img
                        key={p.id}
                        src={ICON(p.id)}
                        alt={isCurrent ? p.name : ""}
                        loading="eager"
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            // Centre stage, gone to the left, or waiting on
                            // the right. Only the two in motion carry a
                            // transition, so returning the departed one to the
                            // right happens instantly, out of sight.
                            transform: isCurrent
                                ? "translate3d(0, 0, 0)"
                                : isOutgoing
                                  ? "translate3d(-100%, 0, 0)"
                                  : "translate3d(100%, 0, 0)",
                            transition:
                                isCurrent || isOutgoing
                                    ? `transform ${SLIDE_MS}ms ${SLIDE_EASE}`
                                    : "none",
                        }}
                    />
                )
            })}
        </div>
    )
}
