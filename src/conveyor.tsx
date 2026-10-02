/**
 * The conveyor's clock.
 *
 * A second take on the Branded Layouts hero. The carousel version holds a
 * partner, slides, holds the next — and at the seam of a shuffled pass that
 * slide lands at the same moment the order behind it changes, which reads as
 * the animation restarting rather than continuing. A conveyor has no seam to
 * land on: it never stops, so there is no moment for anything to reset in.
 *
 * It also gives a design longer in the eye. A phone drifts in, crosses, and
 * drifts out, so the thing you are looking at is leaving slowly rather than
 * being replaced.
 *
 * The motion is a CSS animation rather than a timer, so it costs nothing to
 * run and cannot drift from the compositor. What needs managing is that the
 * hero and the tile on its card are two separate animations: started at
 * different moments they would show different brands. Both are given the same
 * duration — one slot per ITEM_MS, whatever their pixel widths — and seeked
 * to the same point in it from a shared epoch, which keeps them on the same
 * partner without a timer between them.
 */

import { useEffect, useState } from "react"
import { PARTNERS } from "./partners"

/**
 * How long a partner takes to advance one slot. Slow on purpose: the whole
 * point of this version is to be able to look at a design before it goes.
 */
export const ITEM_MS = 5200

/** A full pass. The same for every conveyor, so they share a phase. */
export const CYCLE_MS = PARTNERS.length * ITEM_MS

/** Fixed for the life of the page, so a remount does not shift the phase. */
const EPOCH = Date.now()

/**
 * A negative animation delay, which seeks a CSS animation rather than
 * postponing it. Two conveyors mounted seconds apart both land here.
 */
export function phaseDelay() {
    return `-${(Date.now() - EPOCH) % CYCLE_MS}ms`
}

/** The track is the list twice over, so translating by one copy's width wraps
 *  it with nothing to see. */
export const LOOP = [...PARTNERS, ...PARTNERS]

/**
 * Whether a conveyor should be running, by the same rule as every other hero
 * here: nothing animates off screen.
 *
 * A conveyor has no first beat to miss, so coming back resumes rather than
 * restarting. The hero and its card's tile sit on the same card and so come
 * into view together, which is what keeps them on the same partner across a
 * pause.
 *
 * Starts true, because a suspended IntersectionObserver never reports and
 * would otherwise leave the belt stopped for good.
 */
export function useConveyorRunning(ref: React.RefObject<HTMLElement | null>) {
    const [running, setRunning] = useState(true)
    useEffect(() => {
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            ([entry]) => setRunning(entry.isIntersecting),
            { threshold: 0.15 },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [ref])
    return running
}
