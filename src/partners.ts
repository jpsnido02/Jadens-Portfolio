/**
 * The partner rotation, shared by the Branded Layouts hero and the partner
 * tile on its card.
 *
 * Both used to keep their own index and their own timer, so the card could be
 * showing Gap's icon while the hero showed Best Buy's screen. One clock here
 * means they can never disagree: a single interval advances a single index, and
 * both components render whatever it points at.
 *
 * The order used to be reshuffled every pass, for variety. It runs in a fixed
 * order now, because the hero draws the rotation as a progress bar: a bar that
 * jumps about is not showing progress, and a viewer who sees the sweep reach
 * the end knows they have been shown every partner rather than wondering how
 * many more there were.
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
/**
 * The partner's full wordmark, as a transparent monochrome mark on a common
 * 840x300 canvas (twice the size it renders at, so a
 * high-density display downsamples it).
 *
 * Taken from the partner's own screen — the site header for the three that
 * show one, the placement header for the three that do not — rather than from
 * the app icon, which for half of them is a letter or a bird and not the name
 * at all. Scaled to equal ink area, so six logos of six very different
 * proportions carry the same optical weight in a row without six hand-tuned
 * sizes in the component. Used as a CSS mask, which is what lets one file be
 * white on the dark theme and near-black on the light one.
 */
export const MARK = (id: string) => `/projects/partners/${id}-mark.png`
/** That canvas, so a caller can give the box the right shape. */
export const MARK_W = 840
export const MARK_H = 300

/** How long each partner holds. The slide itself is each component's own. */
export const HOLD_MS = 3200

let index = 0
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
    index = (index + 1) % PARTNERS.length
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
    const wanted = listeners.size > 0 && onScreen.size > 0 && !reducedMotion()
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
 *
 * `onChange` hands the same answer back to the caller, so a viewer drawing the
 * hold as it elapses can stop drawing it when the clock stops. Without that
 * the hero's progress fill would run on off screen and be most of the way
 * across by the time anyone saw the partner it belongs to.
 */
export function watchVisibility(
    el: HTMLElement | null,
    onChange?: (visible: boolean) => void,
) {
    const token = {}
    onScreen.add(token)
    sync()
    onChange?.(true)

    let io: IntersectionObserver | undefined
    if (el && typeof IntersectionObserver !== "undefined") {
        io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) onScreen.add(token)
                else onScreen.delete(token)
                sync()
                onChange?.(entry.isIntersecting)
            },
            { threshold: 0.15 },
        )
        io.observe(el)
    }

    return () => {
        io?.disconnect()
        onScreen.delete(token)
        sync()
    }
}
