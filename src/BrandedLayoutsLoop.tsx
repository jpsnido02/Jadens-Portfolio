/**
 * Branded Layouts hero: one placement, six partners, shuffled.
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

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { FRAME_H, FRAME_W, PhoneShell } from "./ShoppablePhone"

const BASE = "../../projects/branded"

/** Partner, and the brand it reads as. Order here is only the initial pass. */
const PARTNERS: { id: string; name: string }[] = [
    { id: "fanatics", name: "Fanatics" },
    { id: "gap", name: "Gap" },
    { id: "bestbuy", name: "Best Buy" },
    { id: "frontier", name: "Frontier" },
    { id: "avis", name: "Avis" },
    { id: "depop", name: "Depop" },
]

const HOLD_MS = 3200
const SLIDE_MS = 980
/** Apple's presentation curve: decisive away, long settle in. */
const SLIDE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
/** Clearance past the edge, so a phone's shadow leaves with it. */
const SHADOW_ROOM = 60

/**
 * A pass through every partner in random order, never opening on `avoid` so a
 * reshuffle cannot show the same brand twice across the seam.
 */
function shuffle(avoid?: number): number[] {
    const order = PARTNERS.map((_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[order[i], order[j]] = [order[j], order[i]]
    }
    if (avoid !== undefined && order[0] === avoid) {
        ;[order[0], order[1]] = [order[1], order[0]]
    }
    return order
}

export default function BrandedLayoutsLoop({ alt }: { alt?: string }) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 0, h: 0 })
    const [visible, setVisible] = useState(true)
    const [reduced, setReduced] = useState(false)

    /**
     * The partner on screen, and the one travelling off it. The first pass is
     * drawn from the same shuffle as every later one — seeding `current` to a
     * fixed index instead would put it outside the shuffle, so it could come
     * back around two or three steps into the first pass.
     */
    const [order] = useState(shuffle)
    const [current, setCurrent] = useState(() => order[0])
    const [outgoing, setOutgoing] = useState<number | null>(null)
    const queue = useRef<number[]>(order.slice(1))

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

    useEffect(() => {
        if (!visible || reduced) return
        const advance = window.setTimeout(() => {
            if (queue.current.length === 0) queue.current = shuffle(current)
            const next = queue.current.shift() as number
            setOutgoing(current)
            setCurrent(next)
        }, HOLD_MS)
        return () => window.clearTimeout(advance)
    }, [current, visible, reduced])

    // The departed phone is released once it has left. It is already past the
    // clip by then, so sending it back round to the right is never seen.
    useEffect(() => {
        if (outgoing === null) return
        const clear = window.setTimeout(() => setOutgoing(null), SLIDE_MS + 60)
        return () => window.clearTimeout(clear)
    }, [outgoing])

    const pad = box.w < 480 ? 12 : 24
    const availW = Math.max(0, box.w - pad * 2)
    const availH = Math.max(0, box.h - pad * 2)
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
                                top: "50%",
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
                                        src={`${BASE}/${p.id}.jpg`}
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
