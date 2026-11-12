import { useEffect, useState } from "react"

export default function useStudySequence(durations: number[], playing: boolean, poster = 0) {
    const [phase, setPhase] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches ? poster : 0)
    useEffect(() => {
        if (!playing || matchMedia("(prefers-reduced-motion: reduce)").matches) return
        const timer = window.setTimeout(() => setPhase(value => (value + 1) % durations.length), durations[phase])
        return () => window.clearTimeout(timer)
    }, [phase, playing, durations])
    return phase
}
