import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import UberOfferCard, { OFFERS, type Offer } from "./UberOfferCard"
import { AgentStudyTicket } from "./AgentOperationsDemo"
import { SiteIcon } from "./icons"
import "./case-study-visuals.css"

export type StudyVisualName = "uber" | "agent" | "kalshi" | "macys" | "branded" | "expedia"
const asset = (path: string) => {
    const pathName = window.location.pathname
    const base = pathName.includes("/work/") ? pathName.split("/work/")[0] : pathName.replace(/\/(?:index\.html)?$/, "")
    return `${base}/projects/${path}`
}
function ResponsiveOffer({ offer, index }: { offer: Offer; index: number }) {
    const ref = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(358)
    useLayoutEffect(() => {
        const observer = new ResizeObserver(([entry]) => setWidth(Math.min(358, entry.contentRect.width)))
        observer.observe(ref.current!)
        return () => observer.disconnect()
    }, [])
    const media = offer.media.kind === "none" ? offer.media : {...offer.media, src: asset(`uber/${offer.media.src.split("/").pop()}`)}
    return <div ref={ref} className="ux-responsive-offer"><UberOfferCard offer={{...offer, media}} index={index} px={v => v * width / 358} swapMs={0} animate={false} phase="idle" pagerIndex={index}/></div>
}
function Note({ title, children }: { title: string; children: ReactNode }) {
    return <div className="ux-note"><strong>{title}</strong><p>{children}</p></div>
}
function Flow({ items }: { items: { title: string; body: string }[] }) {
    return <ol className="ux-flow">{items.map(item => <li key={item.title}><strong>{item.title}</strong><p>{item.body}</p></li>)}</ol>
}
function Uber({ detail }: { detail: boolean }) {
    if (detail) return <div className="ux-uber-detail"><div className="ux-uber-detail-card"><ResponsiveOffer offer={OFFERS[0]} index={0}/></div><div className="ux-notes"><Note title="Context in the message">“Soundtrack your wait” connects the offer to the delivery moment.</Note><Note title="An action with a destination">“Open Spotify” tells the customer what happens next.</Note><Note title="Room to decline">The secondary action keeps accepting the offer optional.</Note></div></div>
    return <div className="ux-uber-pair">{[OFFERS[0], OFFERS[2]].map((offer, i) => <div className="ux-uber-example" key={offer.id}><div className="ux-order-context"><span className="ux-order-dot"/><span>Your breakfast is on its way.</span></div><div className="ux-uber-card"><ResponsiveOffer offer={offer} index={i}/></div><p>{i === 0 ? "Time context · something to listen to while waiting" : "Meal context · coffee to complement breakfast"}</p></div>)}</div>
}
function Agent({ detail }: { detail: boolean }) {
    if (detail) return <div className="ux-agent-flow"><Flow items={[{title:"Queue",body:"A request is ready for the agent."},{title:"Building",body:"Generated designs accumulate against the request."},{title:"For review",body:"The reviewer inspects the build and its checks."},{title:"Complete",body:"Human approval completes the ticket."}]}/><div className="ux-feedback"><SiteIcon name="back" size={15}/><span><strong>Request changes</strong> returns the work to Building with reviewer feedback.</span></div></div>
    return <div className="ux-agent-parts"><div className="ux-agent-ticket"><AgentStudyTicket/><Note title="A request with context">Account, task, owner, and due date stay with the work.</Note></div><div className="ux-agent-review"><div className="ux-review-heading"><img src={asset("agent-logos/shutterfly.svg")} alt="Shutterfly"/><span>DS-103 · For review</span></div><strong className="ux-review-title">Create photo book checkout designs</strong><div className="ux-review-summary"><div><span>Mock status</span><strong>14 / 14</strong></div><div><span>Build time</span><strong>5m 58s</strong></div></div><div className="ux-review-links"><span>Figma</span><span>Google Drive</span><span>Google Chat</span></div><div className="ux-review-checks"><strong>Before you approve</strong>{["Brand tokens match the account","Responsive layouts reviewed","Contrast and layout QA complete"].map(text=><span key={text}><SiteIcon name="check" size={12}/>{text}</span>)}</div><div className="ux-review-actions"><span>Request changes</span><b>Approve build</b></div></div><div className="ux-agent-review-note"><Note title="A deliberate review boundary">Build completeness, quality checks, and the approval action share one view. These are dashboard elements rearranged for explanation.</Note></div></div>
}
function Kalshi({ detail }: { detail: boolean }) {
    if (detail) return <div className="ux-kalshi-anatomy"><div><strong>Keep the decision anchored.</strong><dl><div><dt>Selected team</dt><dd>San Francisco</dd></div><div><dt>Entry amount</dt><dd>$25</dd></div></dl></div><div><strong>Update the market information.</strong><dl><div><dt>Market chance</dt><dd>18% <SiteIcon name="next" size={14}/> 16%</dd></div><div><dt>Potential payout</dt><dd>$131.16 <SiteIcon name="next" size={14}/> $147.56</dd></div></dl></div></div>
    return <div className="ux-kalshi-pair">{[{chance:"18",pay:"131.16",label:"Before the play"},{chance:"16",pay:"147.56",label:"After the five-yard loss"}].map(q=><div className="ux-kalshi-state" key={q.chance}><p>{q.label}</p><div className="ux-kalshi-ad"><div className="ux-kalshi-top"><span>PRO FOOTBALL</span><strong>Kalshi</strong></div><span className="ux-kalshi-event">SAN FRANCISCO VS SEATTLE · GAME WINNER</span><span className="ux-kalshi-label">MARKET CHANCE</span><div className="ux-kalshi-prediction"><span>San Francisco</span><strong>{q.chance}%</strong></div><div className="ux-kalshi-values"><div><span>YOU PAY</span><strong>$25</strong></div><div><span>POTENTIAL PAYOUT</span><strong>${q.pay}</strong></div></div><p className="ux-kalshi-condition">if San Francisco wins this game</p></div></div>)}</div>
}
function Macys({ detail }: { detail: boolean }) {
    if (detail) return <div className="ux-macys-detail"><div className="ux-macys-product"><img src={asset("macys/shirt-blue.webp")} alt="Blue shirt from the final bag-page design"/><div><span>Your exclusive discount</span><strong>Tommy Hilfiger</strong><p><b>$39.99</b> <s>$79.99</s></p><div className="ux-macys-unlocked"><SiteIcon name="check" size={14}/>Discount unlocked</div></div></div><div className="ux-notes"><Note title="Make the condition explicit">The additional suggested item is what unlocks access to the exclusive price.</Note><Note title="Keep the reward in place">The product and price stay together as the availability changes.</Note><Note title="Confirm the consequence">The final bag state reflects the discounted item after it is added.</Note></div></div>
    return <div className="ux-macys-states">{[{label:"The condition",items:"1 item in your bag",action:"Add a suggested item to unlock",locked:true},{label:"The reward",items:"2 items in your bag",action:"Discount unlocked · Add to bag",locked:false},{label:"The confirmation",items:"3 items in your bag",action:"Discounted item added",locked:false}].map((state,i)=><div className="ux-macys-state" key={state.label}><p>{state.label}</p><div className="ux-macys-bag"><strong>Shopping bag</strong><span>{state.items}</span></div><img src={asset("macys/shirt-blue.webp")} alt="Blue shirt offered at an exclusive price"/><strong>Tommy Hilfiger</strong><span className="ux-macys-price">$39.99 <s>$79.99</s></span><div className="ux-macys-status" data-locked={state.locked}><SiteIcon name={i === 0 ? "tasks" : "check"} size={13}/>{state.action}</div></div>)}</div>
}
const brands=[{id:"gap",name:"Gap",accent:"#17386a",type:"Georgia, serif"},{id:"bestbuy",name:"Best Buy",accent:"#0046be",type:"Arial, sans-serif"},{id:"depop",name:"Depop",accent:"#d32727",type:"Arial, sans-serif"}]
function Branded({ detail }: { detail: boolean }) {
    if (detail) return <div className="ux-brand-rules"><div><strong>Shared interaction</strong><ul><li>Confirmation stays recognizable.</li><li>The offer communicates one benefit.</li><li>The primary action names the next step.</li><li>A decline path remains available.</li></ul></div><div><strong>Partner expression</strong><div className="ux-brand-swatches">{brands.map(b=><span key={b.id} style={{background:b.accent}} aria-label={`${b.name} brand color`}/>)}</div><p>Typography, palette, controls, and language adapt to the partner.</p></div></div>
    return <div className="ux-brand-comparison">{brands.map(b=><div className="ux-brand-treatment" key={b.id} style={{"--ux-brand":b.accent,fontFamily:b.type} as CSSProperties}><img src={asset(`partners/${b.id}-mark.svg`)} alt={b.name}/><span>Order confirmed</span><strong>Jaden, your order<br/>is complete.</strong><p>Enjoy a 7-day free trial<br/>of Disney+ Basic.</p><div>Claim offer</div><small>Decline</small></div>)}</div>
}
function Expedia({ detail }: { detail: boolean }) {
    if (detail) return <div className="ux-expedia-priorities"><div className="ux-expedia-preview"><img src={asset("expedia-offer-mobile.webp")} alt="Final Expedia mobile offer composition"/></div><div className="ux-notes"><Note title="Confirm first">The traveler needs to know the original booking is complete.</Note><Note title="Connect the next need">Hotel and onward-travel offers follow the context of the flight.</Note><Note title="Preserve the choice">A clear continuation path lets the traveler finish without accepting another offer.</Note></div></div>
    return <div className="ux-expedia-journey"><Flow items={[{title:"Flight booked",body:"Confirm the completed transaction."},{title:"Continue the trip",body:"Introduce a relevant hotel or onward-travel offer."},{title:"Choose the next step",body:"Explore the offer or continue to the trip summary."}]}/><div className="ux-expedia-branch"><span>Explore hotel or transport</span><span>Continue without an offer</span></div></div>
}
export default function CaseStudyVisual({ name, variant = "composition" }: { name: StudyVisualName; variant?: "composition" | "detail" }) {
    const detail = variant === "detail"
    return <div className={`ux-visual ux-visual--${name}`}><div className="ux-visual-description">{detail ? "Design breakdown" : name === "expedia" ? "Journey breakdown" : name === "macys" || name === "kalshi" ? "State breakdown" : "Interface composition"}<span>{name === "uber" ? "Final offer components" : "Final design · rearranged for explanation"}</span></div>{name === "uber" ? <Uber detail={detail}/> : name === "agent" ? <Agent detail={detail}/> : name === "kalshi" ? <Kalshi detail={detail}/> : name === "macys" ? <Macys detail={detail}/> : name === "branded" ? <Branded detail={detail}/> : <Expedia detail={detail}/>}</div>
}
