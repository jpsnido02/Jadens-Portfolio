import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import useStudySequence from "./useStudySequence"
import { SiteIcon, RoktWordmark } from "./icons"
import "./portfolio-workbench.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { config } from "@fortawesome/fontawesome-svg-core"
import { faHouse, faCartShopping, faPalette, faFolderOpen, faCircleCheck, faPlay, faCreditCard, faBatteryFull, faArrowRight, faRobot, faListCheck, faLayerGroup, faClockRotateLeft, faTableList, faTableColumns, faMagnifyingGlass, faXmark, faInbox, faGears, faClipboardCheck, faSliders, faChevronRight, faPlus, faBell, faEllipsis, faSignal } from "@fortawesome/free-solid-svg-icons"
import "@fortawesome/fontawesome-svg-core/styles.css"
config.autoAddCss = false
const WORKBENCH_ICONS = { home: faHouse, shop: faCartShopping, palette: faPalette, folder: faFolderOpen, check: faCircleCheck, play: faPlay, card: faCreditCard, battery: faBatteryFull, arrow: faArrowRight, robot: faRobot, tasks: faListCheck, library: faLayerGroup, activity: faClockRotateLeft, table: faTableList, board: faTableColumns, search: faMagnifyingGlass, close: faXmark, queue: faInbox, building: faGears, review: faClipboardCheck, sliders: faSliders, chevron: faChevronRight, plus: faPlus, bell: faBell, more: faEllipsis, signal: faSignal }
function WorkbenchIcon({ name, size = 12 }: { name: keyof typeof WORKBENCH_ICONS; size?: number }) {
    return <FontAwesomeIcon icon={WORKBENCH_ICONS[name]} className="pw-icon" aria-hidden="true" focusable="false" style={{width:size,height:size}} />
}


function Workbench({ children, kind }: { children: ReactNode; kind: string }) {
    const root = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)
    const [appHeight, setAppHeight] = useState(660)
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const nextScale = Math.max(0, kind === "agent" ? Math.min((entry.contentRect.width - 48) / 1268, (entry.contentRect.height - 40) / 660) : Math.min((entry.contentRect.width - 30) / 1000, (entry.contentRect.height - 30) / 660))
            setScale(nextScale)
            if (kind === "agent" && nextScale > 0) setAppHeight((entry.contentRect.height - 40) / nextScale)
        })
        observer.observe(root.current!)
        return () => observer.disconnect()
    }, [kind])
    return <div ref={root} className={`pw-stage pw-stage--${kind}`}><div className="pw-app" style={{ height: kind === "agent" ? appHeight : undefined, transform: kind === "agent" ? `translateY(-50%) scale(${scale})` : `translate(-50%,-50%) scale(${scale})` }}>{children}</div></div>
}

function Action({ children, interactive, onClick, className = "", disabled = false, label }: { children: ReactNode; interactive: boolean; onClick?: () => void; className?: string; disabled?: boolean; label?: string }) {
    return interactive ? <button type="button" aria-label={label} className={className} onClick={onClick} disabled={disabled}>{children}</button> : <span className={className} data-disabled={disabled}>{children}</span>
}

const SHOP_TIMING = [1300, 850, 850, 850, 1600, 1800, 1600, 2700, 2400]
const SETTINGS = [
    { title: "Post-purchase placement", detail: "After payment, before confirmation" },
    { title: "Personalized message", detail: "A little more for their purchase" },
    { title: "Shoppable product", detail: "Stagg EKG · $132.30 · 30% off" },
    { title: "One-click add to order", detail: "Use the customer’s existing checkout" },
]
type CheckoutStep = "configure" | "payment" | "loading" | "offer" | "thanks"

export function ShoppableDashboard({ playing, interactive = false }: { playing: boolean; interactive?: boolean }) {
    const phase = useStudySequence(SHOP_TIMING, playing && !interactive, 4)
    const [settings, setSettings] = useState([false, false, false, false])
    const [manualStep, setManualStep] = useState<CheckoutStep>("configure")
    const [accepted, setAccepted] = useState(false)
    const enabled = interactive ? settings : SETTINGS.map((_, index) => phase > index)
    const ready = enabled.every(Boolean)
    const step: CheckoutStep = interactive ? manualStep : phase < 5 ? "configure" : phase === 5 ? "payment" : phase === 6 ? "loading" : phase === 7 ? "offer" : "thanks"
    useEffect(() => {
        if (!interactive || manualStep !== "loading") return
        const timer = window.setTimeout(() => setManualStep("offer"), 1300)
        return () => window.clearTimeout(timer)
    }, [interactive, manualStep])
    const reset = () => { setManualStep("configure"); setAccepted(false) }
    return <Workbench kind="shop">
        <aside className="pw-sidebar"><b className="pw-brand"><RoktWordmark height={22}/><span>demo studio</span></b><span className="pw-nav-label">WORKSPACE</span><span>Overview</span><span className="is-active"><SiteIcon name="library" size={10} /> Shoppable</span><span>Brand library</span><span>Saved demos</span><div className="pw-sidebar-bottom"><i>JS</i><span>Jaden Snyder<small>Designer workspace</small></span></div></aside>
        <div className="pw-main"><header className="pw-topbar"><span>Demo studio <i>/</i> Shoppable checkout</span><span className="pw-example">Demo builder</span></header>
            <div className="pw-page-heading"><div><span className="pw-eyebrow">BUILD A CUSTOMER JOURNEY</span><h3>From checkout to one more thing.</h3><p>Configure the offer. Play the complete experience.</p></div><span className={`pw-status ${ready ? "complete" : "queue"}`}>{ready ? "Ready to preview" : "Draft"}</span></div>
            <div className="pw-shop-layout"><section className="pw-config-card"><div className="pw-card-heading"><strong>Experience settings</strong><span>{enabled.filter(Boolean).length} / 4 enabled</span></div><div className="pw-config-meta"><span>BRAND <b>Gap</b></span><span>FORMAT <b>Post-purchase</b></span></div>
                {SETTINGS.map((setting, index) => <div className="pw-setting" key={setting.title}><div><strong>{setting.title}</strong><p>{setting.detail}</p></div>{interactive ? <button type="button" role="switch" aria-checked={enabled[index]} aria-label={setting.title} className="pw-toggle" data-on={enabled[index]} onClick={() => { setSettings(current => current.map((value, i) => i === index ? !value : value)); reset() }}><i /></button> : <span className="pw-toggle" data-on={enabled[index]}><i /></span>}</div>)}
                <div className="pw-build-summary"><span className="pw-check"><SiteIcon name="check" size={9} /></span><div><strong>{ready ? "Your journey is ready" : "Make the experience yours"}</strong><p>{ready ? "Payment → offer → updated order" : "Enable all four settings to play the demo."}</p></div></div>
                <Action interactive={interactive} disabled={!ready} className="pw-primary pw-play" onClick={() => setManualStep("payment")}><SiteIcon name="play" size={9} /> {step === "configure" ? "Play demo" : "Restart demo"}</Action>
            </section><section className="pw-phone-area"><div className="pw-preview-heading"><span>Customer preview</span><span className="pw-preview-dot">{step === "configure" ? "Not started" : "Demo running"}</span></div><div className="pw-phone"><div className="pw-phone-status">9:41 <i /><span><WorkbenchIcon name="signal" size={7} /><WorkbenchIcon name="battery" size={9} /></span></div><div className="pw-phone-screen" data-checkout-step={step}>
                {(step === "configure" || step === "payment") && <><div className="pw-store-logo"><img src="/projects/partners/gap-mark.svg" alt="Gap"/></div><span className="pw-phone-kicker">SECURE CHECKOUT</span><h4>You’re almost there.</h4><div className="pw-order-item"><span><img src="/projects/partners/gap-mark.svg" alt="Gap"/></span><div><strong>Everyday essentials</strong><small>Ready for your next adventure</small></div><b>$64</b></div><div className="pw-order-summary"><span>Subtotal <b>$64.00</b></span><span>Shipping <b>Free</b></span><span>Total <strong>$64.00</strong></span></div><div className="pw-payment-method"><WorkbenchIcon name="card" size={10} /> Visa ending in 4242 <span><WorkbenchIcon name="check" size={8} /></span></div><Action interactive={interactive} disabled={step !== "payment"} className="pw-phone-button" onClick={() => setManualStep("loading")}>Pay $64.00 <WorkbenchIcon name="arrow" size={9} /></Action><p className="pw-phone-fine">{step === "configure" ? "Enable your settings, then press Play demo." : "Demo payment · no actual charge"}</p></>}
                {step === "loading" && <div className="pw-phone-center"><span className="pw-loader" /><span className="pw-phone-kicker">PAYMENT CONFIRMED</span><h4>We’ve got something more for your purchase.</h4><p>Finding a little extra, just for you.</p></div>}
                {step === "offer" && <><span className="pw-phone-kicker">AN EXCLUSIVE LITTLE EXTRA</span><h4>Good things come<br />with good taste.</h4><div className="pw-kettle"><img src="/projects/shoppable/images.jpg" alt="Stagg EKG kettle" /><span>30% OFF</span></div><div className="pw-product-name"><strong>Stagg EKG electric kettle</strong><p>Your morning ritual, upgraded.</p><b>$132.30 <del>$189.00</del></b></div><Action interactive={interactive} className="pw-phone-button" onClick={() => { setAccepted(true); setManualStep("thanks") }}>Add to my order <WorkbenchIcon name="arrow" size={9} /></Action><Action interactive={interactive} className="pw-phone-decline" onClick={() => { setAccepted(false); setManualStep("thanks") }}>No thanks, continue</Action></>}
                {step === "thanks" && <div className="pw-phone-center"><span className="pw-success-ring"><SiteIcon name="check" size={19} /></span><span className="pw-phone-kicker">ORDER CONFIRMED</span><h4>{!interactive || accepted ? <>A little more.<br />All yours.</> : <>You’re all set.</>}</h4><p>Thanks for shopping with Gap. Your order is on its way.</p><div className="pw-confirmation">Confirmation #GAP-1024</div><Action interactive={interactive} className="pw-phone-button" onClick={reset}>Back to the builder</Action></div>}
            </div><div className="pw-phone-home" /></div><div className="pw-journey">{["Payment", "Loading", "Offer", "Thank you"].map((label, index) => <span key={label} className={index === ["payment", "loading", "offer", "thanks"].indexOf(step) ? "is-current" : ""}><i>{index + 1}</i>{label}</span>)}</div></section></div>
        </div>
    </Workbench>
}

const AGENT_TIMING = [1800, 2500, 4200, 1800, 1800]
const STAGES = ["Queue", "Building", "For review", "Complete"] as const
type TaskStage = typeof STAGES[number]
const ACCOUNT_LOGOS: Record<string, string> = { OpenTable: "/projects/agent-logos/opentable.svg", Shutterfly: "/projects/agent-logos/shutterfly.svg", eBay: "/projects/agent-logos/ebay.svg" }
const SAMPLE_TASKS = [
    { id: "DS-104", account: "OpenTable", title: "Build reservation confirmation offers", type: "Mobile placement", stage: "Queue" as TaskStage, buildSeconds: 0 },
    { id: "DS-103", account: "Shutterfly", title: "Create photo book checkout designs", type: "Brand system", stage: "Building" as TaskStage, buildSeconds: 768 },
    { id: "DS-102", account: "eBay", title: "Review post-purchase offer designs", type: "Accessibility", stage: "For review" as TaskStage, buildSeconds: 1456 },
    { id: "DS-101", account: "OpenTable", title: "Adapt dining rewards for mobile", type: "Responsive design", stage: "Complete" as TaskStage, buildSeconds: 1122 },
    { id: "DS-100", account: "eBay", title: "Create order confirmation variants", type: "Offer placement", stage: "Queue" as TaskStage, buildSeconds: 0 },
    { id: "DS-099", account: "Shutterfly", title: "Refresh seasonal offer templates", type: "Campaign design", stage: "Complete" as TaskStage, buildSeconds: 1644 },
]
const designsMade = (stage: TaskStage) => stage === "Queue" ? 0 : stage === "Building" ? 16 : 30
const buildTime = (seconds: number) => seconds ? `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s` : "0m 00s"
const stageClass = (stage: TaskStage) => stage.toLowerCase().replaceAll(" ", "-")
export function AgentDashboard({ playing, interactive = false }: { playing: boolean; interactive?: boolean }) {
    const phase = useStudySequence(AGENT_TIMING, playing && !interactive, 2)
    const [tasks, setTasks] = useState(SAMPLE_TASKS)
    const [selected, setSelected] = useState<string | null>(null)
    const ticketCards = useRef(new Map<string, HTMLElement>())
    const detailPanel = useRef<HTMLElement>(null)
    const sourceRect = useRef<DOMRect | null>(null)
    const detailAnimation = useRef<Animation | null>(null)
    const opener = useRef<HTMLElement | null>(null)
    const [closing, setClosing] = useState(false)
    const morphFrame = (panel: HTMLElement, card: HTMLElement, opening = false) => {
        const target = panel.getBoundingClientRect()
        const source = opening && sourceRect.current ? sourceRect.current : card.getBoundingClientRect()
        const scale = target.width / panel.offsetWidth
        return { transform: `translate(${(source.left - target.left) / scale}px, ${(source.top - target.top) / scale}px) scale(${source.width / target.width}, ${source.height / target.height})`, borderRadius: "7px" }
    }
    useLayoutEffect(() => {
        const panel = detailPanel.current
        const card = selected ? ticketCards.current.get(selected) : null
        if (!interactive || !panel || !card) return
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            detailAnimation.current = panel.animate([morphFrame(panel, card, true), { transform: "none", borderRadius: "12px" }], { duration: 560, easing: "cubic-bezier(.22,.8,.2,1)" })
        }
        panel.querySelector<HTMLButtonElement>(".pw-close")?.focus({ preventScroll: true })
        return () => detailAnimation.current?.cancel()
    }, [selected, interactive])
    const closeTicket = async () => {
        if (closing) return
        const panel = detailPanel.current
        const card = selected ? ticketCards.current.get(selected) : null
        setClosing(true)
        if (panel && card && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            detailAnimation.current?.cancel()
            detailAnimation.current = panel.animate([{ transform: "none", borderRadius: "12px" }, morphFrame(panel, card)], { duration: 420, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" })
            await detailAnimation.current.finished.catch(() => {})
        }
        setSelected(null)
        setClosing(false)
        opener.current?.focus({ preventScroll: true })
    }
    const [filter, setFilter] = useState<TaskStage | "All tickets">("All tickets")
    const [view, setView] = useState<"table" | "board">("board")
    const [search, setSearch] = useState("")
    const [feedback, setFeedback] = useState("")
    const [notice, setNotice] = useState("")
    const [elapsed, setElapsed] = useState<Record<string, number>>({})
    const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
    useEffect(() => {
        if (!interactive) return
        const building = tasks.filter(task => task.stage === "Building").map(task => task.id)
        if (!building.length) return
        const timer = window.setTimeout(() => setTasks(current => current.map(task => building.includes(task.id) && task.stage === "Building" ? { ...task, stage: "For review" } : task)), 18000)
        return () => window.clearTimeout(timer)
    }, [interactive, tasks])
    useEffect(() => {
        if (!interactive || !playing) return
        const building = tasks.filter(task => task.stage === "Building").map(task => task.id)
        if (!building.length) return
        const timer = window.setInterval(() => setElapsed(current => {
            const next = { ...current }
            building.forEach(id => { next[id] = (next[id] ?? 0) + 1 })
            return next
        }), 1000)
        return () => window.clearInterval(timer)
    }, [interactive, playing, tasks])
    const rows = interactive ? tasks : SAMPLE_TASKS.map((task, index) => index === 0 ? { ...task, stage: STAGES[Math.min(phase, 3)] } : task)
    const activeId = interactive ? selected : phase === 2 ? "DS-104" : null
    const active = rows.find(task => task.id === activeId)
    const visible = rows.filter(task => (filter === "All tickets" || task.stage === filter) && `${task.title} ${task.account}`.toLowerCase().includes(search.toLowerCase()))
    const update = async (stage: TaskStage) => {
        if (closing) return
        await closeTicket()
        if (stage === "Building" && activeId && feedback.trim()) setReviewNotes(current => ({ ...current, [activeId]: feedback.trim() }))
        setTasks(current => current.map(task => task.id === activeId ? { ...task, stage } : task))
        setSelected(null)
        setNotice(stage === "Complete" ? "Approved. The task is complete." : "Feedback sent. The agent will build a revision.")
        setFeedback("")
    }
    const act = (id: string, stage: TaskStage) => { opener.current = document.activeElement as HTMLElement; sourceRect.current = ticketCards.current.get(id)?.getBoundingClientRect() ?? null; setClosing(false); setSelected(id); setNotice(""); if (stage === "Queue") setTasks(current => current.map(task => task.id === id ? { ...task, stage: "Building" } : task)) }
    const rowAction = (id: string, stage: TaskStage) => <Action interactive={interactive} className={`pw-row-action ${stage === "For review" ? "pw-primary" : ""}`} onClick={() => act(id, stage)}>{stage === "Queue" ? "Start build" : "View build"}<WorkbenchIcon name={stage === "Queue" ? "play" : "arrow"} size={9} /></Action>
    return <Workbench kind="agent"><aside className="pw-sidebar"><b className="pw-brand"><RoktWordmark height={22}/></b><span className="pw-nav-label">WORKSPACE</span><span><SiteIcon name="overview" size={10} /> Overview</span><span className="is-active"><SiteIcon name="tasks" size={10} /> Ticket queue</span><span><SiteIcon name="library" size={10} /> Account library</span><span><SiteIcon name="activity" size={10} /> Activity</span><div className="pw-sidebar-note"><i />Agent workspace<small>Example task data</small></div><div className="pw-sidebar-bottom"><i>JS</i><span>Jaden Snyder<small>Designer · reviewer</small></span></div></aside><div className="pw-main">
        <div className="pw-page-heading"><div><h3>Ticket queue</h3><p>5,000+ account pages. One agent-to-reviewer workflow.</p></div><div className="pw-agent-heading-tools"><span className="pw-agent-notification"><WorkbenchIcon name="bell" size={14} /><i /></span><span className="pw-avatar">JS</span></div></div>
        <div className="ops-handoff"><div><WorkbenchIcon name="robot" size={14}/><span>AGENT OWNS</span><b>Queue <WorkbenchIcon name="arrow" size={9}/> Building</b></div><span className="ops-handoff-divider"/><div><WorkbenchIcon name="review" size={14}/><span>YOUR CALL</span><b>For review <WorkbenchIcon name="arrow" size={9}/> Complete</b></div></div>
        <section className="pw-task-panel"><div className="pw-task-toolbar"><div className="pw-view-tabs">{(["board", "table"] as const).map(mode => <Action key={mode} interactive={interactive} className={view === mode ? "is-active" : ""} onClick={() => setView(mode)}><SiteIcon name={mode === "table" ? "tasks" : "board"} size={10} />{mode === "table" ? "Ticket list" : "Board"}</Action>)}</div>{interactive ? <input aria-label="Search tickets" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search tickets…" /> : <span className="pw-search-placeholder"><SiteIcon name="search" size={9} /> Search tickets…</span>}</div><div className="pw-filter-tabs">{(["All tickets", ...STAGES] as const).map(stage => <Action key={stage} interactive={interactive} className={filter === stage ? "is-active" : ""} onClick={() => setFilter(stage)}>{stage}<b>{stage === "All tickets" ? rows.length : rows.filter(task => task.stage === stage).length}</b></Action>)}</div>
        {view === "table" ? <div className="pw-task-table"><div className="pw-table-head"><span>BRAND / TICKET</span><span>PROGRESS</span><span>DESIGNS MADE</span><span>BUILD TIME</span><span>ACTION</span></div>{visible.map(task => <div ref={element => { if (element) ticketCards.current.set(task.id, element) }} className={`pw-task-row ${task.id === activeId ? "is-selected" : ""}`} key={task.id}><div className="pw-task-title"><i><img src={ACCOUNT_LOGOS[task.account]} alt=""/></i><div><strong>{task.title}</strong><small>{task.account} · {task.id}</small></div></div><span><b className={`pw-status ${stageClass(task.stage)}`}>{task.stage}</b></span><span className="ops-table-count">{designsMade(task.stage)}/30</span><span className="pw-task-time">{buildTime(task.buildSeconds + (elapsed[task.id] ?? 0))}</span>{rowAction(task.id, task.stage)}</div>)}{visible.length === 0 && <p className="pw-empty">No tickets match this search.</p>}</div> : <div className="pw-kanban">{STAGES.map(stage => <section key={stage}><h4><WorkbenchIcon name={stage === "Queue" ? "queue" : stage === "Building" ? "building" : stage === "For review" ? "review" : "check"} size={11}/>{stage}<span>{visible.filter(task => task.stage === stage).length}</span></h4>{visible.filter(task => task.stage === stage).map(task => <article onClick={interactive ? event => { if (!(event.target as HTMLElement).closest("button")) act(task.id, task.stage) } : undefined} ref={element => { if (element) ticketCards.current.set(task.id, element) }} key={task.id} className={`${task.stage === "For review" ? "ops-card-needs-review" : ""} ${task.id === activeId ? "ops-card-open" : ""}`}><div className="ops-card-account"><img src={ACCOUNT_LOGOS[task.account]} alt=""/><strong>{task.account}</strong><span>{task.id}</span></div><h5>{task.title}</h5><span className={`pw-status ops-card-stage ${stageClass(task.stage)}`}>{task.stage}</span><div className="ops-build-checks" aria-label={task.stage === "Queue" ? "Not started" : task.stage === "Building" ? "Design build in progress" : "Build checks ready"}>{["Tokens","Layout","QA"].map((label, index) => <span key={label} className={task.stage === "Complete" || task.stage === "For review" || task.stage === "Building" && index === 0 ? "is-done" : ""}><WorkbenchIcon name={task.stage === "Queue" ? "queue" : "check"} size={8}/>{label}</span>)}</div><div className="ops-card-progress"><div><span>Designs made</span><b>{designsMade(task.stage)}<em>/30</em></b></div><div className="ops-progress-track" role="progressbar" aria-label={`Designs made for ${task.id}`} aria-valuenow={designsMade(task.stage)} aria-valuemin={0} aria-valuemax={30}><i style={{width: `${designsMade(task.stage) / 30 * 100}%`}}/></div></div><div className="ops-card-time"><span>Total time building</span><b>{buildTime(task.buildSeconds + (elapsed[task.id] ?? 0))}</b></div>{rowAction(task.id, task.stage)}</article>)}{visible.filter(task => task.stage === stage).length === 0 && <div className="ops-empty-column"><WorkbenchIcon name={stage === "For review" ? "review" : stage === "Complete" ? "check" : "queue"} size={14}/><span>{stage === "For review" ? "Nothing waiting on you" : "No tickets here"}</span></div>}</section>)}</div>}
        <footer className="pw-table-footer"><span role="status">{notice || "Illustrative tickets · local preview"}</span><span>{visible.length} tickets</span></footer></section>
        {active && <><div className={`ops-detail-backdrop ${closing ? "is-closing" : ""}`} onClick={interactive ? () => void closeTicket() : undefined} /><aside ref={detailPanel} role={interactive ? "dialog" : undefined} aria-modal={interactive ? true : undefined} aria-label={`${active.id}: ${active.title}`} onKeyDown={event => {
            if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); void closeTicket() }
            if (event.key === "Tab") {
                const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, input, [tabindex="0"]')]
                const first = controls[0], last = controls[controls.length - 1]
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
            }
        }} className={`pw-review ops-detail-expanded ${closing ? "is-closing" : ""}`}><div className="ops-detail-content"><div className="pw-review-heading"><span>{active.id} · {active.account}</span><Action interactive={interactive} onClick={() => void closeTicket()} className="pw-close" label="Close task details"><SiteIcon name="close" size={12} /></Action></div><span className={`pw-status ${stageClass(active.stage)}`}>{active.stage}</span><h4>{active.title}</h4><p>{active.stage === "For review" ? "The agent has finished. Your call comes next." : active.stage === "Complete" ? "Reviewed and approved output." : "The agent is applying the account’s design system."}</p>{reviewNotes[active.id] && <div className="ops-review-note"><strong>Your latest feedback</strong><p>{reviewNotes[active.id]}</p></div>}<div className="pw-output-preview"><img className="pw-account-logo" src={ACCOUNT_LOGOS[active.account]} alt={active.account}/><strong>A little extra.<br />A better everyday.</strong><div>Explore your offer <WorkbenchIcon name="arrow" size={8} /></div></div><div className="pw-review-checks">{(active.stage === "Building" ? ["Reading brand tokens", "Building responsive layout", "Running contrast checks"] : ["Brand tokens matched", "Responsive layout checked", "Contrast checks complete"]).map(label => <span key={label}><SiteIcon name={active.stage === "Building" ? "activity" : "check"} size={8} /> {label}</span>)}</div>{active.stage === "For review" ? <><label className="pw-feedback-label">Your feedback{interactive ? <textarea value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="What should the agent refine?" /> : <span className="pw-feedback-placeholder">What should the agent refine?</span>}</label><div className="pw-review-actions"><Action interactive={interactive} className="pw-secondary" disabled={interactive && !feedback.trim()} onClick={() => update("Building")}>Request changes</Action><Action interactive={interactive} className="pw-primary" onClick={() => update("Complete")}>Approve <SiteIcon name="check" size={9} /></Action></div></> : <Action interactive={interactive} className="pw-secondary" onClick={() => void closeTicket()}>Back to tickets</Action>}</div></aside></>}
    </div></Workbench>
}
