/**
 * The partner rotation, shared by the Branded Layouts hero and the partner
 * tile on its card.
 *
 * Both used to keep their own index and their own timer, so the card could be
 * showing Gap's icon while the hero showed Best Buy's screen. One clock here
 * means they can never disagree: a single interval advances a single index, and
 * both components render whatever it points at.
 *
 * Keeping the shuffle here rather than dropping it is what lets the two agree
 * and still arrive in a different order each pass — they are reading the same
 * shuffled queue, not two of their own.
 */

/** One entry per partner. The screen and the icon are named from the id. */
export const PARTNERS: { id: string; name: string }[] = [
    { id: "fanatics", name: "Fanatics" },
    { id: "gap", name: "Gap" },
    { id: "bestbuy", name: "Best Buy" },
    { id: "seatgeek", name: "SeatGeek" },
    { id: "depop", name: "Depop" },
    { id: "frontier", name: "Frontier" },
]

export const SCREEN = (id: string) => `../../projects/branded/${id}.jpg`
export const ICON = (id: string) => `/projects/partners/${id}-app.jpg`

/** How long each partner holds. The slide itself is each component's own. */
export const HOLD_MS = 3200

/**
 * A pass through every partner in random order, never opening on `avoid` so a
 * reshuffle cannot show the same partner twice across the seam.
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

let queue = shuffle()
let index = queue.shift() as number
const listeners = new Set<() => void>()
let timer: number | undefined

function advance() {
    if (queue.length === 0) queue = shuffle(index)
    index = queue.shift() as number
    listeners.forEach((fn) => fn())
}

function reducedMotion() {
    return (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
}

/** Subscribe to the rotation. The clock runs only while something is watching. */
export function subscribe(fn: () => void) {
    listeners.add(fn)
    if (timer === undefined && !reducedMotion()) {
        timer = window.setInterval(advance, HOLD_MS)
    }
    return () => {
        listeners.delete(fn)
        if (listeners.size === 0 && timer !== undefined) {
            window.clearInterval(timer)
            timer = undefined
        }
    }
}

export function currentPartner() {
    return index
}
