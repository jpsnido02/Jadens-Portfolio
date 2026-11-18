import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react"
import UberAdsLoop from "./UberAdsLoop"
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
    return <Scene width={700} height={520}><UberAdsLoop fit="contain" gallery poster paused={!playing} /></Scene>
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
