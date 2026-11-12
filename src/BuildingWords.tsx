import { useEffect, useLayoutEffect, useRef, useState } from "react"

const words = ["agents", "systems", "advertisements", "products", "agents"]

export default function BuildingWords({ playing }: { playing: boolean }) {
    const track = useRef<HTMLSpanElement>(null)
    const [index, setIndex] = useState(0)
    const [widths, setWidths] = useState<number[]>([])
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)

    useLayoutEffect(() => {
        const elements = Array.from(track.current!.children) as HTMLElement[]
        const measure = () => {
            const next = elements.map(element => Math.ceil(element.getBoundingClientRect().width))
            setWidths(previous => previous.every((width, i) => width === next[i]) && previous.length === next.length ? previous : next)
        }
        measure()
        const observer = new ResizeObserver(measure)
        elements.forEach(element => observer.observe(element))
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const query = matchMedia("(prefers-reduced-motion: reduce)")
        const change = () => setReduced(query.matches)
        query.addEventListener("change", change)
        return () => query.removeEventListener("change", change)
    }, [])

    useEffect(() => {
        if (!playing || reduced) return
        const timer = window.setTimeout(() => setIndex(index === words.length - 1 ? 0 : index + 1), index === words.length - 1 ? 550 : 3000)
        return () => window.clearTimeout(timer)
    }, [index, playing, reduced])

    return <span className="building-words" aria-label="agents, systems, advertisements, and products" style={{ width: widths[index] ?? `${words[index].length}ch` }}>
        <span ref={track} className="building-words-track" aria-hidden="true" data-reset={index === 0} style={{ transform: `translateY(-${index * 1.5}em)` }}>
            {words.map((word, i) => <span key={i}>{word}</span>)}
        </span>
    </span>
}
