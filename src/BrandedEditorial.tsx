import type { CSSProperties, ReactNode } from "react"
import "./branded-editorial.css"
import StudyCredits from "./StudyCredits"
import type { CaseStudy } from "./caseStudies"

const offers = [
    { id: "gap", name: "Gap", top: 886, bottom: 1656, buttonTop: 1354, buttonBottom: 1548, description: "Gap’s original Disney+ offer with order context, a blue Claim Now action, and an outlined Decline action." },
    { id: "bestbuy", name: "Best Buy", top: 800, bottom: 1660, buttonTop: 1372, buttonBottom: 1582, description: "Best Buy’s original Hulu offer with its wordmark, blue Claim now action, and No thanks alternative." },
    { id: "depop", name: "Depop", top: 828, bottom: 1660, buttonTop: 1352, buttonBottom: 1544, description: "Depop’s original Hulu offer with its red wordmark, pill-shaped Claim now action, and Decline alternative." },
]

// Windows into the supplied design exports. No redrawing, stretching, or
// generated replacement UI: each window keeps the source's pixel proportions.
function DesignWindow({ id, top, bottom, alt }: { id: string; top: number; bottom: number; alt: string }) {
    return <div className="branded-design-window" role="img" aria-label={alt} style={{
        aspectRatio: `754 / ${bottom - top}`,
        backgroundImage: `url(/projects/branded/${id}.jpg)`,
        backgroundPosition: `center ${top / (1704 - (bottom - top)) * 100}%`,
    } as CSSProperties}/>

}

export function BrandedOfferDetail({ id }: { id: string }) {
    const offer = offers.find(item => item.id === id)
    return offer ? <div className="branded-offer-detail"><DesignWindow {...offer} alt={offer.description} /></div> : null
}

export default function BrandedEditorial({ study, playing, demo, onExpand }: { study: CaseStudy; playing: boolean; demo: ReactNode; onExpand: (id: string) => void }) {
    return <article className="branded-editorial" style={{ "--branded-play-state": playing ? "running" : "paused" } as CSSProperties}>
        <figure id="branded-opening" className="branded-stage" aria-label="Original Gap, Best Buy, and Depop offer designs">
            <div className="branded-stage-ground" aria-hidden="true" />
            {offers.map((offer, index) => <div className={`branded-stage-piece branded-stage-piece--${offer.id}`} style={{ "--piece-delay": `${index * 110}ms` } as CSSProperties} key={offer.id}>
                <button type="button" className="branded-stage-paper" onClick={() => onExpand(offer.id)} aria-label={`Expand ${offer.name} offer design`} aria-haspopup="dialog"><DesignWindow {...offer} alt={offer.description} /></button>
                <span className="branded-partner-name">{offer.name}</span>
            </div>)}
            <figcaption>One offer structure, expressed through three different brands. Select a design to explore.</figcaption>
        </figure>

        <header id="branded-overview" className="branded-introduction">
            <div className="branded-intro-heading"><h1>{study.title}</h1><p className="branded-deck">{study.result ?? study.preview}</p></div>
            <StudyCredits study={study}/>
            <p className="branded-intro-description">A shared offer needs to feel at home across different partner experiences. I designed branded treatments that preserve the underlying offer structure while adapting typography, color, and controls to the partner.</p>
        </header>

        <section id="branded-system" className="branded-decision" aria-labelledby="branded-decision-title">
            <div className="branded-decision-copy"><h2 id="branded-decision-title">Keep the choice clear.<br/>Let the brand change.</h2><p>The greeting, offer content, primary action, and decline action keep their roles. Brand tokens change how those elements look without changing what the customer needs to do.</p><p>Color, shape, and language carry the partner’s identity all the way to the decision.</p></div>
            <figure className="branded-control-study"><div className="branded-control-list">{offers.map(offer => <div className="branded-control-example" key={offer.id}><span>{offer.name}</span><DesignWindow id={offer.id} top={offer.buttonTop} bottom={offer.buttonBottom} alt={`${offer.name} primary and decline actions, enlarged from the original design.`}/></div>)}</div><figcaption>Original action pairs, shown at the same scale.</figcaption></figure>
        </section>

        <section id="branded-context" className="branded-in-context" aria-labelledby="branded-context-title"><div className="branded-context-heading"><h2 id="branded-context-title">Part of the checkout experience.</h2><p>The customer’s transaction stays in view while the offer takes on the partner’s logo, styling, and language.</p></div>{demo}</section>

        <section id="branded-outcome" className="branded-outcome" aria-labelledby="branded-outcome-title"><h2 id="branded-outcome-title">A familiar experience.<br/>A measurable impact.</h2><div><p>The branded UX iteration drove $30 million in revenue by adapting the offer experience to the customer’s transaction and the partner’s brand. In tested accounts, it also delivered a verified 20% value-per-transaction lift.</p><p className="branded-reflection">The reusable part is the relationship between the elements. Preserving that relationship lets the visual language change without making the customer relearn the experience.</p></div></section>
    </article>
}
