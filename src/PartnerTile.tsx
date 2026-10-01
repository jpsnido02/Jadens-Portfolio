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
 */

import { useEffect, useRef, useState } from "react"

const HOLD_MS = 2800
const SLIDE_MS = 700
/** Apple's presentation curve, as the hero uses. */
const SLIDE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"

export default function PartnerTile({
    tiles,
    size,
    radius,
    cornerShape,
    border,
}: {
    tiles: { src: string; alt: string }[]
    size: number
    radius: number
    cornerShape: string
    border: string
}) {
    const [current, setCurrent] = useState(0)
    const [outgoing, setOutgoing] = useState<number | null>(null)
    const [reduced, setReduced] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduced(mq.matches)
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])

    useEffect(() => {
        if (reduced || tiles.length < 2) return
        const id = window.setTimeout(() => {
            setOutgoing(current)
            setCurrent((c) => (c + 1) % tiles.length)
        }, HOLD_MS)
        return () => window.clearTimeout(id)
    }, [current, reduced, tiles.length])

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
            {tiles.map((t, i) => {
                const isCurrent = i === current
                const isOutgoing = i === outgoing
                return (
                    <img
                        key={t.src}
                        src={t.src}
                        alt={isCurrent ? t.alt : ""}
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
