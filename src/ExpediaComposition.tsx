import { useEffect, useRef, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBed, faCheck, faUmbrellaBeach, faXmark } from "@fortawesome/free-solid-svg-icons"
import "./expedia-composition.css"

function Actions({ mobile = false }: { mobile?: boolean }) {
    return <div className={`exp-actions${mobile ? " exp-actions--mobile" : ""}`}><span>Find My Hotel</span><span>Next</span></div>
}
function Attribution() {
    return <div className="exp-attribution">Powered by <u>Rokt</u> · <u>Privacy Policy</u></div>
}

/** Final-product UI recomposed without hardware, so each overlay can be read. */
export default function ExpediaComposition() {
    const root = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            const inset = width < 500 ? 12 : 28
            setScale(Math.max(0, Math.min((width - inset * 2) / 1032, (height - inset * 2) / 548)))
        })
        observer.observe(root.current!)
        return () => observer.disconnect()
    }, [])
    return <div ref={root} className="expedia-bento" role="img" aria-label="Expedia confirmation, mobile offer sheet and desktop offer modal, arranged as three interface panels."><div className="expedia-scene" style={{ transform:`translate(-50%, -50%) scale(${scale})`, opacity:scale ? 1 : 0 }}>
        <div className="exp-confirmation">
            <div className="exp-confirmation-art" aria-hidden="true" />
            <strong>Your flight is confirmed</strong>
            <div className="exp-itinerary"><span>Itinerary #</span><b>123456789</b></div>
        </div>
        <div className="exp-mobile-sheet">
            <div className="exp-sheet-top"><span><FontAwesomeIcon icon={faCheck}/> Your flight to Honolulu is booked</span><FontAwesomeIcon icon={faXmark}/></div>
            <strong className="exp-sheet-title">Jaden, your flight is confirmed!</strong>
            <p>You’ve got the flights for Jun 12–18. Your Honolulu trip is coming together, here’s what to add next.</p>
            <div className="exp-mobile-offer">
                <div className="exp-mobile-offer-heading"><div><span className="exp-deal">Up to 60% off</span><strong>A great trip starts with the right place to stay.</strong></div><span className="exp-bed"><FontAwesomeIcon icon={faBed}/></span></div>
                <ul>{["Everything in one place", "Earn One Key Rewards", "Premium hotels, handpicked for you"].map(text=><li key={text}><FontAwesomeIcon icon={faCheck}/>{text}</li>)}</ul>
                <Actions mobile />
            </div>
            <Attribution />
        </div>
        <div className="exp-desktop-modal">
            <div className="exp-desktop-heading"><FontAwesomeIcon className="exp-close" icon={faXmark}/><span className="exp-destination"><FontAwesomeIcon icon={faUmbrellaBeach}/></span><strong>Jaden, your flight to Honolulu is confirmed!</strong><span className="exp-step">Step 2 of 3 · Recommended for your trip</span>
                <div className="exp-trip-stages">{["Flight Booked", "For You", "Trip Details"].map((label,i)=><div key={label} data-step={i}><span>{i===0&&<FontAwesomeIcon icon={faCheck}/>}</span><small>{label}</small></div>)}</div>
            </div>
            <div className="exp-desktop-body"><div className="exp-desktop-offer"><div className="exp-hotel-photo" role="img" aria-label="Open-air hotel lounge with wood ceilings and tropical seating"/><div className="exp-desktop-copy"><span className="exp-deal">★ Deals Available!</span><strong>A great trip starts with the right place to stay.</strong><p>Find a hotel that fits your Honolulu trip, handpicked options waiting for you.</p><Actions/></div></div><Attribution/></div>
        </div>
    </div></div>
}
