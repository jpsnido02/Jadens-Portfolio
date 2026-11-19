import { useEffect, useRef, useState, type ReactNode } from "react"
import { CARD_W, UBER_TEXT } from "./UberOfferCard"
import "./uber-offer-gallery.css"

const formats = [
    { label: "One-word lesson", brand: "Duolingo", title: "One breakfast word. A free week of Super.", claim: "Claim free week", reward: "7 days of Super Duolingo" },
    { label: "Guided pause", brand: "Headspace", title: "Two breaths. A free week of Headspace.", claim: "Claim free week", reward: "7 days of Headspace" },
    { label: "Coffee pass", brand: "Starbucks", title: "Breakfast now. Coffee for two later.", claim: "Claim coffee pass", reward: "2-for-1 coffee pass" },
] as const

type Step = "offer" | "breathing" | "ready" | "claimed" | "dismissed"

function Offer({ index }: { index: number }) {
    const format = formats[index]
    const [step, setStep] = useState<Step>("offer")
    const [wrongAnswer, setWrongAnswer] = useState(false)
    const [coffee, setCoffee] = useState("Hot")
    const [beat, setBeat] = useState(0)
    useEffect(() => {
        if (step !== "breathing") return
        const timer = window.setTimeout(() => {
            if (beat === 3) setStep("ready")
            else setBeat(beat + 1)
        }, 3000)
        return () => window.clearTimeout(timer)
    }, [step, beat])

    function reset() {
        setCoffee("Hot")
        setBeat(0)
        setWrongAnswer(false)
        setStep("offer")
    }
    function action(text: string, click: () => void, secondary = false) {
        return <button type="button" className={secondary ? "uf-secondary" : undefined} onClick={click}>{text}</button>
    }

    let message: string
    let creativeControl: ReactNode
    const finished = step === "claimed" || step === "dismissed"
    if (step === "claimed") {
        message = index === 2 ? coffee + " coffee · 2-for-1 pass" : format.reward
    } else if (step === "dismissed") {
        message = "Your breakfast is being prepared."
    } else if (step === "ready") {
        message = ["That’s right. Pan means bread.", "Two breaths, nicely done.", coffee + " coffee for your next visit."][index]
    } else if (index === 0) {
        message = wrongAnswer ? "Butter is mantequilla. What does pan mean?" : "What does “pan” mean in Spanish?"
        creativeControl = <>{action("Bread", () => setStep("ready"))}{action("Butter", () => setWrongAnswer(true))}</>
    } else if (index === 1) {
        message = step === "breathing" ? "Follow the circle for two slow breaths." : "Take a 12-second breathing break while breakfast cooks."
        creativeControl = step === "breathing" ? action("Stop", reset) : action("Start breathing", () => setStep("breathing"))
    } else {
        message = "Choose your 2-for-1 coffee pass."
        creativeControl = <>{["Hot", "Iced"].map(choice => <button type="button" key={choice} onClick={() => {setCoffee(choice); setStep("ready")}}>{choice}</button>)}</>
    }

    return <article className="uf-card" style={{ maxWidth: CARD_W, fontFamily: UBER_TEXT }} aria-label={format.brand + " offer"}>
        <div className="uf-creative">
        {index === 0 && <div className="uf-art uf-letters" aria-hidden="true">{["p", "a", "n"].map(letter => <b key={letter}>{letter}</b>)}</div>}
        {index === 1 && <div className="uf-art uf-pause"><i aria-hidden="true" data-running={step === "breathing"}/><b>{step === "breathing" ? (beat % 2 ? "Breathe out" : "Breathe in") : "Two breaths"}</b></div>}
        {index === 2 && <div className="uf-art uf-pass"><div><span>Starbucks<br/>Morning coffee pass</span><b>2 for 1</b></div></div>}
        {creativeControl && <div className="uf-tools" role="group" aria-label={["Answer the lesson", "Breathing exercise", "Choose a coffee"][index]}>{creativeControl}</div>}
        </div>
        <div className="uf-copy">
            <small>{format.brand}</small>
            <div aria-live="polite" aria-atomic="true">
                <h3>{step === "claimed" ? "Offer claimed" : step === "dismissed" ? "Back to your order" : format.title}</h3>
                <p>{message}</p>
            </div>
            {finished ? <button type="button" className="uf-replay" onClick={reset}>Replay offer</button> :
                <div className="uf-actions">
                    {action(format.claim, () => setStep("claimed"))}
                    {action("Not now", () => setStep("dismissed"), true)}
                </div>}
            <div className="uf-meta"><span>{["Spanish · Weekly pass", "12 seconds · Sound off", "At participating stores."][index]}</span><span>Ad</span></div>
        </div>
    </article>
}

export default function UberOfferGallery() {
    const track = useRef<HTMLDivElement>(null)
    const [active, setActive] = useState(0)
    function select(index: number) {
        const el = track.current
        if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "instant" })
        setActive(index)
    }
    return <div className="uf-gallery" id="offer-formats" role="region" aria-label="Interactive Uber Eats offer formats">
        <div className="uf-track" ref={track} onScroll={e => {
            const el = e.currentTarget
            if (el.clientWidth) setActive(Math.max(0, Math.min(formats.length - 1, Math.round(el.scrollLeft / el.clientWidth))))
        }}>
            {formats.map((format, index) => <div className="uf-slide" key={format.brand} aria-hidden={active !== index} inert={active !== index}><Offer index={index}/></div>)}
        </div>
        <div className="uf-picker" role="group" aria-label="Choose an offer format">{formats.map((format, index) =>
            <button key={format.brand} type="button" aria-pressed={active === index} onClick={() => select(index)}>{format.label}</button>)}</div>
    </div>
}
