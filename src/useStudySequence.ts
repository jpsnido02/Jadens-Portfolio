import { useEffect, useState } from "react"
export default function useStudySequence(durations: number[], playing: boolean, poster = 0) {
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
    const [phase, setPhase] = useState(() => reduced ? poster : 0)
    useEffect(() => {
        const mq = matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => { setReduced(mq.matches); if (mq.matches) setPhase(poster) }
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [poster])
    useEffect(() => {
        if (!playing || reduced) return
        const timer = window.setTimeout(() => setPhase(value => (value + 1) % durations.length), durations[phase])
        return () => window.clearTimeout(timer)
    }, [phase, playing, durations, reduced])
    // A pause during a short hidden reset must never strand an empty tile.
    return !playing && durations[phase] <= 600 ? poster : phase
}
