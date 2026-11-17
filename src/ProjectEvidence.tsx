import { SiteIcon } from "./icons"
import useStudySequence from "./useStudySequence"
import type { CSSProperties } from "react"
import "./project-evidence.css"

const AGENT_BEATS = [1800, 1600, 4200, 2600, 400]
export function AgentReviewScene({ playing = false, compact = false, posterOnly = false }: { playing?: boolean; compact?: boolean; posterOnly?: boolean }) {
    const beat = useStudySequence(AGENT_BEATS, playing, 2)
    const phase = posterOnly ? 2 : beat
    const state = phase === 0 || phase === 4 ? "Building" : phase === 3 ? "Complete" : "For review"
    return <div className={`agent-story ${compact ? "agent-story--compact" : ""}`} data-phase={phase} aria-hidden="true">
        <div className="agent-story-top"><strong>Design Agents</strong><span>Design review</span></div>
        <div className="agent-story-stages">{["Queue","Building","For review","Complete"].map(label => <span key={label} data-current={label === state}>{label}</span>)}</div>
        <div className="agent-story-ticket"><div><img src="/projects/agent-logos/shutterfly.svg" alt=""/><span>Shutterfly</span><small>DS-103</small></div><strong>Create photo book checkout designs</strong><span className="agent-story-status"><SiteIcon name={state === "Complete" ? "check" : state === "Building" ? "activity" : "tasks"} size={12}/>{state === "Complete" ? "Approved and complete" : state === "Building" ? "Building the design" : "Ready for your review"}</span></div>
        <div className="agent-story-review"><div className="agent-output"><div className="agent-output-brand"><img src="/projects/agent-logos/shutterfly.svg" alt="Shutterfly"/><span>ORDER CONFIRMED</span></div><div className="agent-output-photo"><img src="/projects/agent-logos/shutterfly.svg" alt=""/><span>Your memories,<br/>made to keep.</span></div><strong>Your next photo story starts here.</strong><p>Explore another way to bring your photos to life.</p><span className="agent-output-cta">Explore photo gifts <SiteIcon name="next" size={12}/></span><small>Continue to order summary</small></div><div className="agent-review-criteria"><span className="evidence-label">REVIEW CRITERIA</span><strong>Does the design fit the account?</strong><ul><li><SiteIcon name="check" size={12}/>Brand type and color</li><li><SiteIcon name="check" size={12}/>Clear customer action</li><li><SiteIcon name="check" size={12}/>Responsive layout</li></ul><div className="agent-review-note">Keep the proposed design and its checks in the same view.</div><div className="agent-review-actions"><span>Request changes</span><b>{state === "Complete" ? "Approved" : "Approve"}<SiteIcon name="check" size={12}/></b></div></div></div>
        <div className="agent-story-footer"><span>{state === "Building" ? "Preparing the design for review" : state === "Complete" ? "Human approval completes the ticket" : "Your feedback or approval is the next step"}</span><small>Illustrative output</small></div>
    </div>
}

// Source screenshots are 786 × 1704. These windows isolate the offer panels
// above the phone's home indicator, retaining the original design pixels.
const BRANDED_OFFERS = [
    { id: "gap", name: "Gap", top: 886, bottom: 1656, offer: "Disney+ Basic seven-day trial" },
    { id: "bestbuy", name: "Best Buy", top: 800, bottom: 1660, offer: "Hulu + Live TV seven-day trial" },
    { id: "depop", name: "Depop", top: 828, bottom: 1660, offer: "Hulu + Live TV seven-day trial" },
]

export function BrandedComparison() {
    return <div className="brand-comparison">
        {BRANDED_OFFERS.map(brand => <div className="brand-proof" key={brand.id}>
            <div className="brand-proof-crop" style={{
                aspectRatio: `754 / ${brand.bottom - brand.top}`,
                "--offer-top": `-${brand.top / 1704 * 100}%`,
            } as CSSProperties}>
                <img
                    src={`/projects/branded/${brand.id}.jpg`}
                    alt={`${brand.name} branded offer design for a ${brand.offer}, including its original claim and decline controls.`}
                    width={786}
                    height={1704}
                    loading="lazy"
                />
            </div>
        </div>)}
    </div>
}

function ExpediaDecision() {
    return <div className="expedia-decision">
        <div className="expedia-decision-screen">
            <img src="/projects/expedia-offer.webp" width={1950} height={1107} loading="lazy" alt="Original Expedia mobile offer confirming the Honolulu flight, suggesting a hotel, and offering Find My Hotel or Next." />
        </div>
        <div className="expedia-decision-notes">
            <h3>A next step grounded in the booking</h3>
            <dl>
                <div><dt>Confirm the completed action</dt><dd>The booked-flight message stays visible above the offer, giving the traveler reassurance before introducing a hotel.</dd></div>
                <div><dt>Carry the trip context forward</dt><dd>Honolulu and the travel dates connect the recommendation to the trip the customer just booked.</dd></div>
                <div><dt>Keep the choice clear</dt><dd>“Find My Hotel” gives the offer a specific action. “Next” lets the traveler continue without taking it.</dd></div>
            </dl>
        </div>
    </div>
}

function MacysDecision() {
    return <div className="macys-evidence">{[false,true].map(unlocked => <div className="macys-proof" key={String(unlocked)}><span className="evidence-label">{unlocked ? "AFTER THE SECOND ADDITION" : "BEFORE THE SECOND ADDITION"}</span><div className="macys-proof-bag"><strong>Shopping bag</strong><span>{unlocked ? "2 items" : "1 item"}</span></div><div className="macys-proof-item"><img src="/projects/macys/shirt-blue.webp" alt="Tommy Hilfiger blue shirt"/><div><small>Your exclusive discount</small><strong>Tommy Hilfiger</strong><span><b>$39.99</b> <s>$79.99</s></span></div></div><div className={`macys-proof-action ${unlocked ? "is-unlocked" : ""}`}><SiteIcon name={unlocked ? "check" : "tasks"} size={12}/>{unlocked ? "Discount unlocked · Add to bag" : "Add a suggested item to unlock"}</div></div>)}</div>
}

export default function ProjectEvidence({ name, playing = false }: { name: string; playing?: boolean }) {
    if (name === "agent-review") return <AgentReviewScene posterOnly />
    if (name === "branded-comparison") return <BrandedComparison />
    if (name === "macys-decision") return <MacysDecision />
    if (name === "uber-context") return <div className="uber-evidence"><div><span className="evidence-label">ORDER CONTEXT</span><strong>Your breakfast is on its way.</strong><p>The wait gives the offer a reason to be here.</p><span className="uber-evidence-order">Breakfast order <span>→</span> Delivery wait</span></div><div className="uber-evidence-offer"><img src="/projects/uber/media-spotify.webp" alt="Spotify"/><strong>Soundtrack your wait with Spotify Premium.</strong><p>Your Uber Eats order is on the way. Press play while you wait.</p><span>Open Spotify</span><small>Not now</small></div></div>
    if (name === "expedia-proof") return <ExpediaDecision />
    return null
}
