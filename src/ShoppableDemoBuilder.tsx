import { PhoneShell } from "./ShoppablePhone"
import { useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faCheck, faCreditCard, faGift, faLayerGroup, faPlay, faShoppingBag, faUpload, faRotateLeft, faSignal, faBatteryFull } from "@fortawesome/free-solid-svg-icons"
import useStudySequence from "./useStudySequence"
import "./shoppable-builder.css"

const EXPERIENCES = [
    { name: "Shoppable Ad", placement: "Product interstitial", description: "A dedicated product offer after checkout, before the final order summary.", icon: faShoppingBag },
    { name: "Pay+", placement: "On the checkout page", description: "An offer within the partner’s checkout, alongside the payment details.", icon: faCreditCard },
    { name: "Rokt Thanks", placement: "On the confirmation page", description: "Relevant partner offers after the customer completes their purchase.", icon: faGift },
]
const TABS = ["Partner & Pages", "Demo Experiences", "Shoppable Offer", "Pay+ Checkout Card", "Thanks Offers", "Review"]
const ICONS = [faUpload, faLayerGroup, faShoppingBag, faCreditCard, faGift, faCheck]
const TIMING = [2200, 1700, 2000, 2200, 1700, 1600, 2600, 2200]
type Screen = "offer" | "payment" | "loading" | "thanks"

export default function ShoppableDemoBuilder({ playing, interactive = false }: { playing: boolean; interactive?: boolean }) {
    const root = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)
    const [tab, setTab] = useState(1)
    const [enabled, setEnabled] = useState([true, false, true])
    const [product, setProduct] = useState("Stagg EKG electric kettle")
    const [price, setPrice] = useState("132.30")
    const [partner, setPartner] = useState("Fellow")
    const [screen, setScreen] = useState<Screen>("offer")
    const [running, setRunning] = useState(false)
    const [added, setAdded] = useState(false)
    const phase = useStudySequence(TIMING, playing && !interactive, 1)
    const activeTab = interactive ? tab : phase < 2 ? 1 : phase === 2 ? 2 : 5
    const choices = interactive ? enabled : [true, phase === 1, true]
    const previewScreen = interactive ? running ? screen : choices[0] ? "offer" : choices[1] ? "payment" : "thanks" : phase === 4 ? "payment" : phase === 5 ? "loading" : phase === 7 ? "thanks" : "offer"
    const available = (index: number) => index < 2 || index === 5 || choices[index - 2]
    const reset = () => { setRunning(false); setScreen("offer"); setAdded(false) }
    const navigate = (index: number) => { setTab(index); reset() }
    const next = () => { const nextTab = TABS.findIndex((_, index) => index > activeTab && available(index)); if (nextTab >= 0) navigate(nextTab) }
    const previous = () => { for (let index = activeTab - 1; index >= 0; index--) if (available(index)) { navigate(index); return } }
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setScale(Math.max(0, Math.min((entry.contentRect.width - 24) / 1200, (entry.contentRect.height - 24) / 1100))))
        observer.observe(root.current!)
        return () => observer.disconnect()
    }, [])
    useEffect(() => {
        if (!interactive || screen !== "loading") return
        const timer = window.setTimeout(() => setScreen(enabled[0] ? "offer" : "thanks"), 1200)
        return () => window.clearTimeout(timer)
    }, [screen, interactive, enabled])
    const play = () => { setRunning(true); setAdded(false); setScreen("payment") }
    const button = (label: string, action: () => void, primary = false, disabled = false) => interactive ? <button type="button" className={primary ? "db-primary" : "db-secondary"} onClick={action} disabled={disabled}>{label}</button> : <span className={primary ? "db-primary" : "db-secondary"}>{label}</span>
    return <div ref={root} className="db-stage"><div className="db-app" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <nav className="db-steps" aria-label="Partner setup steps">{TABS.map((label, index) => interactive ? <button type="button" key={label} aria-current={activeTab === index ? "step" : undefined} disabled={!available(index)} onClick={() => navigate(index)}><FontAwesomeIcon icon={ICONS[index]}/>{label}{index === 0 && <FontAwesomeIcon className="db-complete" icon={faCheck}/>}</button> : <span key={label} data-active={activeTab === index} data-disabled={!available(index)}><FontAwesomeIcon icon={ICONS[index]}/>{label}</span>)}</nav>
        <div className="db-body"><section className="db-editor" aria-label="Experience configuration"><h3>{TABS[activeTab]}</h3>
            {activeTab === 1 ? <><p className="db-intro">Choose the experiences for this partner. Turn one off without losing its configuration.</p><div className="db-experiences" role="group" aria-label="Demo experiences">{EXPERIENCES.map((experience, index) => <div className="db-experience" key={experience.name} data-enabled={choices[index]}><span className={`db-experience-icon db-icon-${index}`}><FontAwesomeIcon icon={experience.icon}/></span><div><div className="db-experience-title"><strong>{experience.name}</strong><span>{experience.placement}</span></div><p>{experience.description}</p></div>{interactive ? <button className="db-switch" type="button" role="switch" aria-label={experience.name} aria-describedby={`db-experience-${index}`} aria-checked={choices[index]} onClick={() => {setEnabled(current => current.map((value, i) => i === index ? !value : value)); reset()}}><i/></button> : <span className="db-switch" data-checked={choices[index]}><i/></span>}<span id={interactive ? `db-experience-${index}` : undefined} className="db-sr-only">{experience.description}</span></div>)}</div></> : activeTab === 0 ? <><p className="db-intro">Set the partner details used throughout the customer experience.</p><label className="db-field">Partner name<input value={partner} readOnly={!interactive} onChange={event => setPartner(event.target.value)} maxLength={30}/></label><div className="db-note"><FontAwesomeIcon icon={faCheck}/> Checkout and confirmation pages are connected.</div></> : activeTab === 2 ? <><p className="db-intro">Configure the offer customers see after checkout. Your changes appear in the preview.</p><label className="db-field">Product name<input value={product} readOnly={!interactive} maxLength={60} onChange={event => setProduct(event.target.value)}/></label><label className="db-field">Offer price ($)<input value={price} readOnly={!interactive} inputMode="decimal" onChange={event => setPrice(event.target.value.replace(/[^0-9.]/g, ""))}/></label><div className="db-product-summary"><img src="/projects/shoppable/images.jpg" alt="Stagg electric kettle"/><div><strong>{product}</strong><span>${price || "0.00"}</span></div></div></> : activeTab === 3 || activeTab === 4 ? <><p className="db-intro">{activeTab === 3 ? "The checkout card appears beside the customer’s payment details." : "Partner offers appear after the final order confirmation."}</p><div className="db-note"><FontAwesomeIcon icon={faCheck}/> {activeTab === 3 ? "Checkout card" : "Confirmation offers"} enabled</div><p className="db-help">Return to Demo Experiences to change the placements in this journey.</p>{button("Edit demo experiences", () => navigate(1))}</> : <><div className="db-review">{EXPERIENCES.map((experience, index) => <div key={experience.name}><span>{experience.name}</span><b>{choices[index] ? "Enabled" : "Off"}</b></div>)}</div><div className="db-note">{choices.some(Boolean) ? "Your demo is configured. Play it to check the customer experience." : "Enable at least one experience to play a demo."}</div>{interactive ? <button type="button" className="db-primary db-play" disabled={!choices.some(Boolean)} onClick={play}><FontAwesomeIcon icon={faPlay}/> Play demo</button> : <span className="db-primary db-play"><FontAwesomeIcon icon={faPlay}/> Play demo</span>}</>}
            <footer className="db-editor-actions">{button(activeTab === 0 ? "Demo Experiences" : TABS[Math.max(0, activeTab - 1)] === "Pay+ Checkout Card" && !choices[1] ? "Shoppable Offer" : "Back", activeTab === 0 ? () => navigate(1) : previous)}{activeTab < 5 && button(activeTab === 1 ? choices[0] ? "Shoppable Offer →" : choices[1] ? "Pay+ Checkout Card →" : choices[2] ? "Thanks Offers →" : "Review →" : "Continue →", next, true)}{activeTab === 5 && button("Edit experiences", () => navigate(1))}</footer>
        </section><section className="db-preview" aria-label="Live customer preview"><div className="db-preview-label"><span>LIVE PREVIEW</span>{interactive && <button type="button" onClick={running ? reset : play} disabled={!choices.some(Boolean)}><FontAwesomeIcon icon={running ? faRotateLeft : faPlay}/>{running ? "Reset preview" : "Play demo"}</button>}</div><span className="db-sr-only" role={interactive ? "status" : undefined}>{running ? `Previewing ${previewScreen === "loading" ? "payment confirmation" : previewScreen}.` : "Preview ready"}</span>
            <div className="db-device"><PhoneShell width={430}>{px => <div className="db-phone-canvas" style={{transform:`scale(${px(1)})`}}><div className="db-phone-status"><b>9:41</b><span><FontAwesomeIcon icon={faSignal}/><FontAwesomeIcon icon={faBatteryFull}/></span></div><div className="db-store"><strong>{partner}</strong><span>{previewScreen === "offer" ? "An exclusive offer for your order" : "Secure checkout"}</span></div><div className="db-device-content" data-screen={previewScreen}>
                {!choices.some(Boolean) && !running ? <div className="db-centered"><FontAwesomeIcon icon={faLayerGroup}/><h4>Select a demo experience</h4><p>Your customer preview will appear here.</p></div> : previewScreen === "payment" ? <><span className="db-customer-eyebrow">CHECKOUT</span><h4>Complete your order</h4><div className="db-receipt"><span>Everyday essentials <b>$64.00</b></span><span>Shipping <b>Free</b></span><strong>Total <b>$64.00</b></strong></div>{choices[1] && <div className="db-checkout-offer">A little extra for your next order. Explore a partner offer after checkout.</div>}<div className="db-payment"><FontAwesomeIcon icon={faCreditCard}/> Visa ending in 4242 <FontAwesomeIcon icon={faCheck}/></div>{button("Pay $64.00", () => setScreen("loading"), true)}<small className="db-demo-disclosure">Demo payment · no actual charge</small></> : previewScreen === "loading" ? <div className="db-centered"><span className="db-spinner"/><h4>We’ve got something more for your purchase.</h4><p>Your payment is confirmed.</p></div> : previewScreen === "thanks" ? <div className="db-centered"><FontAwesomeIcon className="db-success" icon={faCheck}/><h4>Thank you for your order.</h4><p>{added ? `${product} has been added.` : "Your order is confirmed."}</p>{choices[2] && <div className="db-thanks-offer"><FontAwesomeIcon icon={faGift}/><strong>Something for your next adventure</strong><span>Discover offers from our partners.</span></div>}{button("Back to preview", reset)}</div> : <><div className="db-customer-progress"><span><FontAwesomeIcon icon={faCheck}/> Order confirmed</span><i/><strong>Special offer</strong><i/><span>Summary</span></div><h4>Your order is confirmed!</h4><p className="db-customer-copy">Before you go, enjoy an exclusive offer selected for you.</p><div className="db-product-art"><img src="/projects/shoppable/images.jpg" alt="Stagg EKG electric kettle"/></div><div className="db-offer-detail"><strong>{product}</strong><span>${price || "0.00"} <del>$189.00</del></span></div><div className="db-offer-actions">{button("Buy with shop", () => {setAdded(true);setScreen("thanks")}, true)}{button("Add to order · Visa 4242", () => {setAdded(true);setScreen("thanks")})}{interactive ? <button className="db-decline" type="button" onClick={() => {setAdded(false);setScreen("thanks")}}>Decline offer</button> : <span className="db-decline">Decline offer</span>}</div></>}
            </div></div>}</PhoneShell></div>
        </section></div>
    </div></div>
}
