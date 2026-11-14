import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react"
import UberAdsLoop from "./UberAdsLoop"
import Cursor from "./Cursor"
import MockupAgentPreview from "./MockupAgentPreview"
import { currentPartner, subscribe, PARTNERS } from "./partners"
import BrandedLayoutsLoop from "./BrandedLayoutsLoop"

/** Short gallery edits; the full prototypes remain in the case-study reader. */
function useCycle(length: number, interval: number, playing: boolean) {
    const [step, setStep] = useState(0)
    useEffect(() => {
        if (!playing) return
        const timer = window.setInterval(() => setStep(value => (value + 1) % length), interval)
        return () => window.clearInterval(timer)
    }, [length, interval, playing])
    return step
}
function Scene({ children, width = 460, height = 340, style }: { children: ReactNode; width?: number; height?: number; style?: CSSProperties }) {
    const ref = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setScale(Math.min((entry.contentRect.width - 32) / width, (entry.contentRect.height - 32) / height)))
        observer.observe(ref.current!)
        return () => observer.disconnect()
    }, [width, height])
    return <div className="focus-scene" ref={ref} style={style}><div className="focus-canvas" style={{ width, height, transform: `translate(-50%, -50%) scale(${Math.max(0, scale)})` }}>{children}</div></div>
}
export function UberPreview({ playing }: { playing: boolean }) {
    return <Scene width={700} height={520}><UberAdsLoop fit="contain" gallery paused={!playing} /></Scene>
}
const MACYS_BEATS = [
    { name: "cue", ms: 1100 },
    { name: "approach-upper", ms: 1050 },
    { name: "aim-upper", ms: 300 },
    { name: "press-upper", ms: 360 },
    { name: "confirm-upper", ms: 1150 },
    { name: "unlock", ms: 900 },
    { name: "read-offer", ms: 2800 },
    { name: "approach-lower", ms: 1100 },
    { name: "aim-lower", ms: 350 },
    { name: "press-lower", ms: 360 },
    { name: "result", ms: 3400 },
    { name: "leave", ms: 900 },
] as const

/** Each beat finishes before attention moves to the next part of the card. */
function useMacysBeat(playing: boolean) {
    const [beat, setBeat] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches ? 10 : 0)
    useEffect(() => {
        const mq = matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setBeat(mq.matches ? 10 : 0)
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])
    useEffect(() => {
        if (!playing) return
        const timer = window.setTimeout(() => setBeat(value => (value + 1) % MACYS_BEATS.length), MACYS_BEATS[beat].ms)
        return () => window.clearTimeout(timer)
    }, [beat, playing])
    return beat
}

type CursorPoint = { x: number; y: number }
type MacysAnchors = { upper: CursorPoint; lower: CursorPoint; read: CursorPoint; width: number; height: number }
const point = (p: CursorPoint) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`
const curve = (from: CursorPoint, a: CursorPoint, b: CursorPoint, to: CursorPoint) => `path("M ${point(from)} C ${point(a)} ${point(b)} ${point(to)}")`

export function MacysPreview({ playing }: { playing: boolean }) {
    const beat = useMacysBeat(playing)
    const phase = MACYS_BEATS[beat]
    const root = useRef<HTMLDivElement>(null)
    const [anchors, setAnchors] = useState<MacysAnchors | null>(null)
    const secondAdded = beat >= 4
    const unlocked = beat >= 6
    const thirdAdded = beat >= 10
    const attention = beat < 4 ? "upper" : beat === 4 ? "handoff" : "lower"

    // Measure the real CTAs in unscaled scene coordinates. Re-read the lower
    // target after its lock disappears and the offer finishes lifting.
    useLayoutEffect(() => {
        if (beat !== 1 && beat !== 6) return
        const el = root.current
        if (!el) return
        const frame = el.getBoundingClientRect()
        const scale = frame.width / el.offsetWidth || 1
        const target = (selector: string): CursorPoint => {
            const rect = el.querySelector(selector)!.getBoundingClientRect()
            return { x: (rect.left + rect.width * .57 - frame.left) / scale, y: (rect.top + rect.height * .5 - frame.top) / scale }
        }
        const upper = target(".mock-button")
        const lower = target(".discount-add")
        const read = target(".discount-price")
        setAnchors(previous => ({ upper: beat === 6 && previous ? previous.upper : upper, lower, read, width: el.offsetWidth, height: el.offsetHeight }))
    }, [beat])

    let flight: { path: string; ms: number; moving: boolean } | null = null
    if (anchors) {
        const { upper: u, lower: l, read: r, width, height } = anchors
        const start = { x: width * .18, y: height * .46 }
        const retreat = { x: u.x + 23, y: u.y + 19 }
        const reading = { x: r.x + 19, y: r.y - 10 }
        const after = { x: l.x + 46, y: l.y + 17 }
        const approach = `path("M ${point(start)} C ${point({x:width*.34,y:start.y+18})} ${point({x:u.x-85,y:u.y-28})} ${point({x:u.x+4,y:u.y-2})} Q ${point({x:u.x+7,y:u.y+3})} ${point(u)}")`
        const approachLower = `path("M ${point(reading)} C ${point({x:reading.x-23,y:reading.y+24})} ${point({x:l.x+38,y:l.y-17})} ${point({x:l.x-3,y:l.y+2})} Q ${point({x:l.x-5,y:l.y+4})} ${point(l)}")`
        flight = { path: approach, ms: 1050, moving: beat === 1 }
        if (beat === 4) flight = { path: curve(u,{x:u.x+9,y:u.y+14},{x:retreat.x+6,y:retreat.y+3},retreat), ms: 420, moving: true }
        if (beat === 5) flight = { path: curve(retreat,{x:retreat.x+20,y:r.y-42},{x:r.x+67,y:r.y-24},r), ms: 900, moving: true }
        if (beat === 6) flight = { path: curve(r,{x:r.x+4,y:r.y-12},{x:reading.x-5,y:reading.y-4},reading), ms: 1200, moving: true }
        if (beat >= 7 && beat <= 9) flight = { path: approachLower, ms: 1100, moving: beat === 7 }
        if (beat === 10) flight = { path: curve(l,{x:l.x+8,y:l.y+17},{x:after.x+9,y:after.y+9},after), ms: 650, moving: true }
        if (beat === 11) flight = { path: curve(after,{x:after.x+58,y:after.y-7},{x:width-20,y:height+8},{x:width+18,y:height+22}), ms: 900, moving: true }
    }

    return <Scene width={520} height={340}><div ref={root} className={`macys-focus ${unlocked ? "is-unlocked" : ""} ${thirdAdded ? "is-complete" : ""}`} data-attention={attention} data-beat={beat} data-phase={phase.name}>
        <div className="mock-heading"><strong>Unlock 50% off a third shirt.</strong><span>{thirdAdded ? "3 items in bag" : secondAdded ? "2 items in bag" : "1 item in bag"}</span></div>
        <div className="bag-product"><img src="/projects/macys/shirt-white.webp" alt="" /><div><strong>Add one more for a deal.</strong><span>Tommy Hilfiger stretch dress shirt</span><b>$79.99</b></div><span className="mock-button" data-cued={beat === 0} data-pressed={beat === 3}>{secondAdded ? "✓ Added" : "Add to bag"}</span></div>
        <div className="discount-card discount-card--original">
            <div className="discount-product-photo"><img src="/projects/macys/shirt-blue.webp" alt="" /><span className="discount-offer-badge"><svg width="12" height="14" viewBox="0 0 20 22" fill="none" aria-hidden="true"><rect x="4" y="9" width="12" height="10" rx="2" fill="currentColor" /><path d={unlocked ? "M6 9V6a4 4 0 0 1 7.5-2" : "M6 9V6a4 4 0 0 1 8 0v3"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>50% OFF</span></div>
            <div className="discount-product-copy"><strong>Tommy Hilfiger</strong><span className="discount-product-name">Men’s slim-fit stretch dress shirt</span><span className="discount-price"><b>$39.99</b><span> (50% off)</span><s>$79.99</s></span></div>
            <span className={`discount-add ${unlocked ? "is-enabled" : ""}`} data-pressed={beat === 9}>{thirdAdded ? "✓ Added" : "Add to Bag"}</span>
        </div>
        {flight && beat > 0 && <div className="macys-cursor-layer" aria-hidden="true"><div key={phase.name} className={`macys-cursor-track ${flight.moving ? "is-moving" : ""} ${beat === 11 ? "is-leaving" : ""}`} style={{offsetPath:flight.path,offsetDistance:"100%",animationDuration:`${flight.ms}ms`}}><span className="macys-cursor-pointer" data-pressed={beat === 3 || beat === 9}><Cursor size={32} /></span></div></div>}
    </div></Scene>
}
export function AgentPreview({ playing }: { playing: boolean }) {
    const [compact, setCompact] = useState(() => matchMedia("(max-width:720px)").matches)
    useEffect(() => {
        const mq = matchMedia("(max-width:720px)")
        const sync = () => setCompact(mq.matches)
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])
    return <Scene width={compact ? 560 : 760} height={compact ? 550 : 480}><MockupAgentPreview playing={playing} /></Scene>
}
export function BrandedPreview({ playing }: { playing: boolean }) {
    const step = useSyncExternalStore(subscribe, currentPartner, () => 0)
    return <Scene width={720} height={580} style={{backgroundColor:"#eeeeee"}}><div className="branded-phone-preview" data-brand={PARTNERS[step].id}><BrandedLayoutsLoop paused={!playing} ink="#171717" muted="#999999" accent="#171717" /></div></Scene>
}
export function ConfigPreview({ playing }: { playing: boolean }) {
    const step = useCycle(9, 1250, playing)
    const placementOn = step >= 1
    const headlineOn = step >= 2
    const imageOn = step >= 3
    const detailOn = step >= 4
    const ctaOn = step >= 5
    const toggle = (label: string, on: boolean) => <div className="config-row" key={label}><span>{label}</span><span className={`mock-toggle ${on ? "is-on" : ""}`} /></div>
    const field = (label: string, value: string, on: boolean) => <div className="config-field"><span>{label}</span><div className={`config-field-value ${on ? "is-filled" : ""}`}>{on ? value : <span>Enter {label.toLowerCase()}…</span>}</div></div>
    return <Scene width={680} height={570}><div className="config-focus config-focus--detailed">
        <div className="config-controls"><span className="prompt-label">LIVE BUILDER</span><strong>Make it yours.</strong>
            <span className="config-section">PLACEMENT</span>{toggle("Offer placement",placementOn)}
            <span className="config-section">CONTENT</span>{field("Headline","You’ve unlocked something good.",headlineOn)}{toggle("Product media",imageOn)}{field("Product title","Stagg EKG Kettle",detailOn)}
            <span className="config-section">ACTIONS</span>{toggle("Offer buttons",ctaOn)}
            <span className="config-ready">{ctaOn ? "✓ Ready to share" : "Preview updates as you build"}</span>
        </div>
        <div className={`config-output ${placementOn ? "has-placement" : ""}`}>
            <span className="offer-eyebrow">A LITTLE THANK YOU</span>
            <strong className={`config-headline ${headlineOn ? "is-revealed" : ""}`}>You’ve unlocked<br />something good.</strong>
            <div className={`config-product ${imageOn ? "is-revealed" : ""}`}><img src="/projects/shoppable/images.jpg" alt="" /></div>
            <div className={`config-product-details ${detailOn ? "is-revealed" : ""}`}><strong>Stagg EKG Kettle</strong><span>EXCLUSIVE OFFER</span><p>An exclusive offer, just for you.</p></div>
            <div className={`config-actions ${ctaOn ? "is-revealed" : ""}`}><span className="config-cta" data-pressed={step === 6}>Claim your offer ↗</span><span className="config-decline">No, thanks</span></div>
            <span className="config-powered">Powered by Rokt</span>
        </div>
    </div></Scene>
}
