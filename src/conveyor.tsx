/**
 * The conveyor's clock.
 *
 * A second take on the Branded Layouts hero. The carousel version holds a
 * partner, slides, holds the next — and at the seam of a shuffled pass that
 * slide lands at the same moment the order behind it changes, which reads as
 * the animation restarting rather than continuing. A conveyor has no seam to
 * land on: it never stops, so there is no moment for anything to reset in.
 *
 * The belt itself is a CSS animation, so it costs nothing to run and cannot
 * drift from the compositor. This module owns the run it belongs to: when
 * nothing showing the conveyor is on screen the belt is paused, and when
 * something comes back into view a new run starts from the first partner —
 * the same rule every other hero here follows.
 *
 * Everything that has to agree with the belt is derived from that one run's
 * start time rather than from a timer of its own. That is what lets the logo
 * on the project's card know where the phones are without anything passing
 * between them.
 */

import { useEffect, useMemo, useReducer, useState } from "react"
import { PARTNERS } from "./partners"

/**
 * How long a partner takes to cross one slot. Slow on purpose: the whole
 * point of this version is to be able to look at a design before it goes.
 */
export const ITEM_MS = 5200

/** A full pass. The same for every conveyor, so they share a phase. */
export const CYCLE_MS = PARTNERS.length * ITEM_MS

/**
 * How far a brand has to be towards the centre before the card's logo becomes
 * that brand. Short of the centre on purpose — by the time a phone is most of
 * the way in it is the one being looked at, and waiting for it to land leaves
 * the logo trailing what the hero is showing.
 */
const SWAP_AT = 0.8

/** The track is the list twice over, so translating by one copy's width wraps
 *  it with nothing to see. */
export const LOOP = [...PARTNERS, ...PARTNERS]

/* ------------------------------------------------------------------ the run */

/** Viewers currently on screen. The belt runs only while one of them is. */
const onScreen = new Set<object>()
/** When the current run began. Reset each time the conveyor comes into view. */
let epoch = Date.now()
const listeners = new Set<() => void>()

function setOnScreen(token: object, on: boolean) {
    const had = onScreen.size > 0
    if (on) onScreen.add(token)
    else onScreen.delete(token)
    const has = onScreen.size > 0
    // Coming back into view starts a fresh run, so the belt opens on the
    // first partner rather than wherever it happened to be paused.
    if (!had && has) epoch = Date.now()
    if (had !== has) listeners.forEach((fn) => fn())
}

/**
 * Join the run, reporting this viewer's visibility, and re-render whenever the
 * run starts or stops.
 *
 * The token is added before the observer has said anything, because a
 * suspended IntersectionObserver never reports and would otherwise leave the
 * belt stopped for good.
 */
export function useConveyorRun(ref: React.RefObject<HTMLElement | null>) {
    const [, bump] = useReducer((c: number) => c + 1, 0)

    useEffect(() => {
        listeners.add(bump)
        return () => {
            listeners.delete(bump)
        }
    }, [bump])

    useEffect(() => {
        const el = ref.current
        const token = {}
        setOnScreen(token, true)
        let io: IntersectionObserver | undefined
        if (el && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                ([entry]) => setOnScreen(token, entry.isIntersecting),
                { threshold: 0.15 }
            )
            io.observe(el)
        }
        return () => {
            io?.disconnect()
            setOnScreen(token, false)
        }
    }, [ref])

    const running = onScreen.size > 0
    /**
     * A negative animation delay seeks a CSS animation rather than postponing
     * it, which is how a conveyor mounted late joins the run already in
     * progress. Tied to the epoch so it is stable for the length of a run —
     * recomputing it on every render would restart the belt each time.
     */
    const delay = useMemo(
        () => `-${(Date.now() - epoch) % CYCLE_MS}ms`,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [epoch, running]
    )
    return { running, delay }
}

/* ----------------------------------------------------------------- the logo */

/** Which brand the card's logo should be, for a given point in the run. */
function logoAt(elapsed: number) {
    const pos = (elapsed % CYCLE_MS) / ITEM_MS
    const k = Math.floor(pos)
    return (k + (pos - k >= SWAP_AT ? 1 : 0)) % PARTNERS.length
}

/** How long until that answer changes. One swap per slot, at SWAP_AT. */
function msToNextSwap(elapsed: number) {
    const pos = (elapsed % CYCLE_MS) / ITEM_MS
    const k = Math.floor(pos)
    const target = pos - k < SWAP_AT ? k + SWAP_AT : k + 1 + SWAP_AT
    return Math.max(16, (target - pos) * ITEM_MS)
}

/**
 * The brand to show on the card, swapping as each phone comes most of the way
 * to the hero's centre.
 *
 * Sliding the logos the way the phones slide was the obvious thing and it
 * looked wrong: a logo is a mark rather than a scene, and dragging one through
 * a tile the size of a thumbnail reads as a glitch. So it swaps instead, and
 * the only question is when — which is what SWAP_AT answers.
 *
 * Scheduled to the next swap rather than polled, so it wakes once a slot
 * instead of once a frame.
 */
export function useConveyorLogo(running: boolean) {
    const [index, setIndex] = useState(() => logoAt(Date.now() - epoch))

    useEffect(() => {
        if (!running) return
        let id = 0
        const tick = () => {
            const elapsed = Date.now() - epoch
            setIndex(logoAt(elapsed))
            id = window.setTimeout(tick, msToNextSwap(elapsed))
        }
        tick()
        return () => window.clearTimeout(id)
    }, [running])

    return index
}
