import { useLayoutEffect, useRef, type RefObject } from "react"

type Scheduler = {
    now: () => number
    schedule: (callback: () => void, ms: number) => number
    cancel: (id: number) => void
}
const browserScheduler: Scheduler = {
    now: () => performance.now(),
    schedule: (callback, ms) => window.setTimeout(callback, ms),
    cancel: id => window.clearTimeout(id),
}

/** One timer per logical entry. Pausing retains the unspent part of the beat. */
export class PausablePlaybackTimer {
    private key: string | number | undefined
    private remaining: number | null = null
    private startedAt: number | null = null
    private timer: number | null = null
    private completed = false
    constructor(private readonly complete: () => void, private readonly scheduler: Scheduler = browserScheduler) {}
    get remainingMs() {
        if (this.remaining === null) return null
        const elapsed = this.startedAt === null ? 0 : this.scheduler.now() - this.startedAt
        return Math.max(0, this.remaining - elapsed)
    }
    pause() {
        if (this.timer !== null) this.scheduler.cancel(this.timer)
        this.timer = null
        this.remaining = this.remainingMs
        this.startedAt = null
    }
    sync(key: string | number, duration: number | null, playing: boolean) {
        this.pause()
        if (this.key !== key) {
            this.key = key
            this.remaining = duration
            this.completed = false
        } else if (this.remaining === null && duration !== null) {
            this.remaining = duration
        }
        if (!playing || this.completed || this.remaining === null) return
        this.startedAt = this.scheduler.now()
        this.timer = this.scheduler.schedule(() => {
            this.timer = null
            this.startedAt = null
            this.remaining = 0
            this.completed = true
            this.complete()
        }, this.remaining)
    }
}

export default function usePausablePlaybackTimer({ entryKey, duration, playing, onElapsed }: {
    entryKey: string | number
    duration: number | null
    playing: boolean
    onElapsed: () => void
}) {
    const callback = useRef(onElapsed)
    const clock = useRef<PausablePlaybackTimer | null>(null)
    if (!clock.current) clock.current = new PausablePlaybackTimer(() => callback.current())
    useLayoutEffect(() => { callback.current = onElapsed })
    useLayoutEffect(() => {
        clock.current!.sync(entryKey, duration, playing)
        return () => clock.current!.pause()
    }, [entryKey, duration, playing])
    return clock.current as Pick<PausablePlaybackTimer, "remainingMs">
}

/** CSS animations AND transitions pause at the same point as the story clock. */
export function usePausableSubtreeAnimations<T extends HTMLElement>(root: RefObject<T | null>, playing: boolean, entryKey: string | number) {
    const held = useRef(new Set<Animation>())
    useLayoutEffect(() => {
        const el = root.current
        if (!el || typeof el.getAnimations !== "function") return
        const current = new Set(el.getAnimations({ subtree: true }))
        if (!playing) {
            for (const animation of current) {
                if (animation.playState === "finished" || animation.playState === "idle") continue
                animation.pause()
                held.current.add(animation)
            }
        } else {
            for (const animation of held.current) {
                if (current.has(animation) && animation.playState !== "finished" && animation.playState !== "idle") animation.play()
            }
            held.current.clear()
        }
    }, [root, playing, entryKey])
    useLayoutEffect(() => () => { held.current.clear() }, [])
}
