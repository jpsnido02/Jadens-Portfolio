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
/**
 * The viewers that are currently on screen.
 *
 * The clock used to start on the first subscription and run for the life of
 * the page, so the carousel was always mid-pass by the time anyone scrolled
 * to it — and it kept rotating off-screen for no one. It now runs only while
 * something that shows it is actually in view, which also means arriving at
 * the hero gives you a full hold before the first slide rather than catching
 * one half-done.
 *
 * It is a set of tokens rather than a count because the hero and the card
 * tile come and go independently, and a count cannot tell a second viewer
 * appearing from the same one reporting twice.
 */
const onScreen = new Set<object>()
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

/** Start or stop the clock to match whether anyone is watching. */
function sync() {
    const wanted =
        listeners.size > 0 && onScreen.size > 0 && !reducedMotion()
    if (wanted && timer === undefined) {
        timer = window.setInterval(advance, HOLD_MS)
    } else if (!wanted && timer !== undefined) {
        window.clearInterval(timer)
        timer = undefined
    }
}

/** Subscribe to the rotation. On its own this does not start the clock. */
export function subscribe(fn: () => void) {
    listeners.add(fn)
    sync()
    return () => {
        listeners.delete(fn)
        sync()
    }
}

export function currentPartner() {
    return index
}

/**
 * Report a viewer's visibility, so the clock can idle while the carousel is
 * off screen and begin a fresh hold when it comes back.
 *
 * The token is added before the observer has said anything, because a
 * suspended IntersectionObserver never reports and would otherwise leave the
 * carousel stopped for good. The observer's first callback arrives within a
 * frame or two, long inside the first hold, so nothing is seen moving that
 * should not be.
 */
export function watchVisibility(el: HTMLElement | null) {
    const token = {}
    onScreen.add(token)
    sync()

    let io: IntersectionObserver | undefined
    if (el && typeof IntersectionObserver !== "undefined") {
        io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) onScreen.add(token)
                else onScreen.delete(token)
                sync()
            },
            { threshold: 0.15 }
        )
        io.observe(el)
    }

    return () => {
        io?.disconnect()
        onScreen.delete(token)
        sync()
    }
}
