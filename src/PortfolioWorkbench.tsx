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

export { default as ShoppableDashboard } from "./ShoppableDemoBuilder"

const AGENT_TIMING = [4500, 1400, 6500, 1600]
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
const buildTime = (seconds: number) => `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`
const stageClass = (stage: TaskStage) => stage.toLowerCase().replaceAll(" ", "-")
export function AgentDashboard({ playing, interactive = false }: { playing: boolean; interactive?: boolean }) {
    const phase = useStudySequence(AGENT_TIMING, playing && !interactive, 0)
    const [tasks, setTasks] = useState(SAMPLE_TASKS)
    const [selected, setSelected] = useState<string | null>(null)
    const [closing, setClosing] = useState(false)
    const [filter, setFilter] = useState<TaskStage | "All tickets">("All tickets")
    const [view, setView] = useState<"table" | "board">("board")
    const [search, setSearch] = useState("")
    const [feedback, setFeedback] = useState("")
    const [feedbackOpen, setFeedbackOpen] = useState(false)
    const [section, setSection] = useState<"checks" | "request" | "log" | "designs" | null>(null)
    const [notice, setNotice] = useState("")
    const [elapsed, setElapsed] = useState<Record<string, number>>({})
    const [buildStart, setBuildStart] = useState<Record<string, number>>({})
    const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
    const [moving, setMoving] = useState(false)
    const moveTimer = useRef<number | undefined>(undefined)
    useEffect(() => () => window.clearTimeout(moveTimer.current), [])
    const [attention, setAttention] = useState<Record<string, boolean>>({})
    const ticketCards = useRef(new Map<string, HTMLElement>())
    const positions = useRef(new Map<string, DOMRect>())
    const stagesBefore = useRef(new Map<string, TaskStage>())
    const detailPanel = useRef<HTMLElement>(null)
    const sourceRect = useRef<DOMRect | null>(null)
    const detailAnimation = useRef<Animation | null>(null)
    const opener = useRef<HTMLElement | null>(null)
    const rows = interactive ? tasks : SAMPLE_TASKS.map(task => task.id === "DS-103" ? { ...task, stage: phase === 0 ? "Building" as TaskStage : "For review" as TaskStage } : task)
    const active = rows.find(task => task.id === selected)
    const visible = rows.filter(task => (filter === "All tickets" || task.stage === filter) && `${task.title} ${task.account}`.toLowerCase().includes(search.toLowerCase()))
    const stageKey = rows.map(task => `${task.id}:${task.stage}`).join("|")
    const designsMade = (task: typeof SAMPLE_TASKS[number]) => task.stage === "Queue" ? 0 : task.stage === "Building" ? Math.min(29, 16 + (interactive ? Math.max(0, (elapsed[task.id] ?? 0) - (buildStart[task.id] ?? 0)) * 2 : 0)) : 30
    useLayoutEffect(() => {
        const next = new Map<string, DOMRect>()
        const newlyReady: string[] = []
        const changedStage = rows.some(task => stagesBefore.current.has(task.id) && stagesBefore.current.get(task.id) !== task.stage)
        let didMove = false
        for (const task of rows) {
            const card = ticketCards.current.get(task.id)
            if (!card) continue
            const after = card.getBoundingClientRect()
            const before = positions.current.get(task.id)
            const oldStage = stagesBefore.current.get(task.id)
            if (changedStage && before && oldStage && (oldStage !== task.stage || Math.abs(before.top - after.top) > 1 || Math.abs(before.left - after.left) > 1) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                didMove = true
                const scale = after.width / card.offsetWidth
                card.animate([
                    { transform: `translate(${(before.left - after.left) / scale}px,${(before.top - after.top) / scale}px)`, boxShadow: "0 12px 28px #20263022", zIndex: 6 },
                    { transform: "translate(0,0)", boxShadow: "0 0 0 #20263000", zIndex: 6 }
                ], { duration: 850, easing: "cubic-bezier(.45,0,.2,1)" })
            }
            if (oldStage === "Building" && task.stage === "For review") newlyReady.push(task.id)
            next.set(task.id, after)
        }
        if (didMove) {
            setMoving(true)
            window.clearTimeout(moveTimer.current)
            moveTimer.current = window.setTimeout(() => setMoving(false), 900)
        }
        positions.current = next
        stagesBefore.current = new Map(rows.map(task => [task.id, task.stage]))
        if (newlyReady.length) {
            setAttention(current => ({ ...current, ...Object.fromEntries(newlyReady.map(id => [id, true])) }))
            if (interactive) setNotice("A build is ready. Open the highlighted card to review it.")
        }
    }, [stageKey, view, filter, search])
    useEffect(() => {
        if (!interactive || !playing) return
        const building = tasks.filter(task => task.stage === "Building").map(task => task.id)
        if (!building.length) return
        const timer = window.setTimeout(() => setTasks(current => current.map(task => building.includes(task.id) && task.stage === "Building" ? { ...task, stage: "For review" } : task)), 6500)
        return () => window.clearTimeout(timer)
    }, [interactive, playing, tasks])
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
    const morphFrame = (panel: HTMLElement, card: HTMLElement, opening = false) => {
        const target = panel.getBoundingClientRect()
        const source = opening && sourceRect.current ? sourceRect.current : card.getBoundingClientRect()
        const scale = target.width / panel.offsetWidth
        return { transform: `translate(${(source.left - target.left) / scale}px,${(source.top - target.top) / scale}px) scale(${source.width / target.width},${source.height / target.height})`, borderRadius: "7px" }
    }
    useLayoutEffect(() => {
        const panel = detailPanel.current
        const card = selected ? ticketCards.current.get(selected) : null
        if (!panel || !card) return
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            detailAnimation.current = panel.animate([morphFrame(panel, card, true), { transform: "none", borderRadius: "16px" }], { duration: 560, easing: "cubic-bezier(.22,.8,.2,1)" })
        }
        panel.querySelector<HTMLButtonElement>(".pw-close")?.focus({ preventScroll: true })
        return () => detailAnimation.current?.cancel()
    }, [selected])
    const closeTicket = async () => {
        if (closing) return
        const panel = detailPanel.current
        const card = selected ? ticketCards.current.get(selected) : null
        setClosing(true)
        if (panel && card && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            detailAnimation.current?.cancel()
            detailAnimation.current = panel.animate([{ transform: "none", borderRadius: "16px" }, morphFrame(panel, card)], { duration: 420, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" })
            await detailAnimation.current.finished.catch(() => {})
        }
        setSelected(null)
        setClosing(false)
        opener.current?.focus({ preventScroll: true })
    }
    const update = async (stage: TaskStage) => {
        if (closing || !active) return
        const id = active.id
        if (stage === "Building" && !feedback.trim()) return
        await closeTicket()
        if (stage === "Building") {
            setReviewNotes(current => ({ ...current, [id]: feedback.trim() }))
            setBuildStart(current => ({ ...current, [id]: elapsed[id] ?? 0 }))
        }
        setTasks(current => current.map(task => task.id === id ? { ...task, stage } : task))
        setAttention(current => ({ ...current, [id]: false }))
        setNotice(stage === "Complete" ? "Approved. The ticket is complete." : "Feedback sent. The agent is building a revision.")
        setFeedback("")
    }
    const act = (id: string, stage: TaskStage) => {
        if (stage === "Queue") {
            setTasks(current => current.map(task => task.id === id ? { ...task, stage: "Building" } : task))
            setElapsed(current => ({ ...current, [id]: 0 }))
            return
        }
        opener.current = document.activeElement as HTMLElement
        sourceRect.current = ticketCards.current.get(id)?.getBoundingClientRect() ?? null
        setAttention(current => ({ ...current, [id]: false }))
        setFeedback("")
        setFeedbackOpen(false)
        setSection(null)
        setClosing(false)
        setSelected(id)
        setNotice("")
    }
    const rowAction = (id: string, stage: TaskStage) => <Action interactive={interactive} className={`pw-row-action ${stage === "For review" ? "pw-primary" : ""}`} onClick={() => act(id, stage)}>{stage === "Queue" ? "Start build" : stage === "For review" ? "Review build" : "View build"}<WorkbenchIcon name={stage === "Queue" ? "play" : "arrow"} size={9}/></Action>
    return <Workbench kind="agent"><aside className="pw-sidebar"><b className="pw-brand"><RoktWordmark height={22}/></b><span className="pw-nav-label">WORKSPACE</span><span><SiteIcon name="overview" size={10}/> Overview</span><span className="is-active"><SiteIcon name="tasks" size={10}/> Ticket queue</span><span><SiteIcon name="library" size={10}/> Account library</span><span><SiteIcon name="activity" size={10}/> Activity</span><div className="pw-sidebar-note"><i/>Agent workspace<small>Example task data</small></div><div className="pw-sidebar-bottom"><i>JS</i><span>Jaden Snyder<small>Designer · reviewer</small></span></div></aside><div className="pw-main">
        <div className="pw-page-heading"><div><h3>Ticket queue</h3></div><span className="pw-avatar">JS</span></div>
        <section className="pw-task-panel"><div className="pw-task-toolbar"><div className="pw-view-tabs">{(["board", "table"] as const).map(mode => <Action key={mode} interactive={interactive} className={view === mode ? "is-active" : ""} onClick={() => setView(mode)}><SiteIcon name={mode === "table" ? "tasks" : "board"} size={10}/>{mode === "table" ? "Ticket list" : "Board"}</Action>)}</div>{interactive ? <input aria-label="Search tickets" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search tickets…"/> : <span className="pw-search-placeholder"><SiteIcon name="search" size={9}/> Search tickets…</span>}</div><div className="pw-filter-tabs">{(["All tickets", ...STAGES] as const).map(stage => <Action key={stage} interactive={interactive} className={filter === stage ? "is-active" : ""} onClick={() => setFilter(stage)}>{stage}<b>{stage === "All tickets" ? rows.length : rows.filter(task => task.stage === stage).length}</b></Action>)}</div>
        {view === "table" ? <div className="pw-task-table"><div className="pw-table-head"><span>BRAND / TICKET</span><span>PROGRESS</span><span>DESIGNS MADE</span><span>BUILD TIME</span><span>ACTION</span></div>{visible.map(task => <div ref={element => { if (element) ticketCards.current.set(task.id, element) }} className="pw-task-row" key={task.id}><div className="pw-task-title"><i><img src={ACCOUNT_LOGOS[task.account]} alt=""/></i><div><strong>{task.title}</strong><small>{task.account} · {task.id}</small></div></div><span><b className={`pw-status ${stageClass(task.stage)}`}>{task.stage}</b></span><span className="ops-table-count">{designsMade(task)}/30</span><span className="pw-task-time">{buildTime(task.buildSeconds + (elapsed[task.id] ?? 0))}</span>{rowAction(task.id, task.stage)}</div>)}{!visible.length && <p className="pw-empty">No tickets match this search.</p>}</div> : <div className={`pw-kanban ${moving ? "is-moving" : ""}`}>{STAGES.map(stage => <section key={stage}><h4><WorkbenchIcon name={stage === "Queue" ? "queue" : stage === "Building" ? "building" : stage === "For review" ? "review" : "check"} size={11}/>{stage}<span>{visible.filter(task => task.stage === stage).length}</span></h4>{visible.filter(task => task.stage === stage).map(task => <article data-ticket={task.id} onClick={interactive ? event => { if (!(event.target as Element).closest("button")) act(task.id, task.stage) } : undefined} ref={element => { if (element) ticketCards.current.set(task.id, element) }} key={task.id} className={`${task.stage === "For review" ? "ops-card-needs-review" : ""} ${attention[task.id] && task.stage === "For review" ? "ops-needs-attention" : ""} ${task.id === selected ? "ops-card-open" : ""}`}><div className="ops-card-account"><img src={ACCOUNT_LOGOS[task.account]} alt=""/><strong>{task.account}</strong><span>{task.id}</span></div><h5>{task.title}</h5><span className={`pw-status ops-card-stage ${stageClass(task.stage)}`}>{attention[task.id] && task.stage === "For review" && <i className="ops-attention-dot"/>}{task.stage === "For review" && attention[task.id] ? "Ready for your review" : task.stage}</span><div className="ops-build-checks">{["Tokens", "Layout", "QA"].map((label, index) => <span key={label} className={task.stage === "Complete" || task.stage === "For review" || task.stage === "Building" && index === 0 ? "is-done" : ""}><WorkbenchIcon name="check" size={8}/>{label}</span>)}</div><div className="ops-card-progress"><div><span>Designs made</span><b>{designsMade(task)}<em>/30</em></b></div><div className="ops-progress-track" role="progressbar" aria-label={`Designs made for ${task.id}`} aria-valuenow={designsMade(task)} aria-valuemin={0} aria-valuemax={30}><i style={{width:`${designsMade(task) / 30 * 100}%`}}/></div></div><div className="ops-card-time"><span>Total time building</span><b>{buildTime(task.buildSeconds + (elapsed[task.id] ?? 0))}</b></div>{rowAction(task.id, task.stage)}</article>)}{!visible.some(task => task.stage === stage) && <div className="ops-empty-column"><WorkbenchIcon name={stage === "For review" ? "review" : "queue"} size={14}/><span>{stage === "For review" ? "Nothing waiting on you" : "No tickets here"}</span></div>}</section>)}</div>}
        <footer className="pw-table-footer"><span role="status">{notice || "Illustrative tickets · local preview"}</span><span>{visible.length} tickets</span></footer></section>
        {active && <><div className={`ops-detail-backdrop ${closing ? "is-closing" : ""}`} onClick={() => void closeTicket()}/><div className="ops-review-slot"><aside ref={detailPanel} role="dialog" aria-modal="true" aria-label={`${active.id}: ${active.title}`} onKeyDown={event => {
            if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); void closeTicket() }
            if (event.key === "Tab") {
                const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, input')]
                const first = controls[0], last = controls[controls.length - 1]
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
            }
        }} className={`pw-review ops-review-card ${closing ? "is-closing" : ""}`}><div className="ops-review-content">
            <header className="ops-review-header"><div><img src={ACCOUNT_LOGOS[active.account]} alt=""/><strong>{active.account}</strong><span>{active.id}</span></div><button type="button" className="pw-close" aria-label="Close task details" onClick={() => void closeTicket()}><SiteIcon name="close" size={16}/></button></header>
            <h4>{active.stage === "For review" ? "Built and ready for your review." : active.stage === "Complete" ? "Reviewed, approved, and complete." : "Your designs are taking shape."}</h4>
            <p className="ops-review-meta"><i className={stageClass(active.stage)}/><b>{active.stage === "For review" ? "Ready for your review" : active.stage}</b><span>· {active.stage === "For review" ? "built just now" : `build time ${buildTime(active.buildSeconds + (elapsed[active.id] ?? 0))}`}</span><span>· Requested by Jaden Snyder</span></p>
            <div className="ops-review-timeline"><div>{STAGES.map((stage, index) => <div key={stage} className={index < STAGES.indexOf(active.stage) ? "is-done" : stage === active.stage ? "is-current" : ""}><i/><span>{stage}</span></div>)}</div><aside><strong>{active.stage === "Complete" ? "Approved" : "6h 25m left"}</strong><span>{active.stage === "Complete" ? "Ready to hand off" : "Due today"}</span></aside></div>
            <div className="ops-review-commandbar"><div className="ops-review-resources"><button type="button" onClick={() => setSection(section === "designs" ? null : "designs")} aria-expanded={section === "designs"}><WorkbenchIcon name="palette" size={13}/>Open designs</button><button type="button" onClick={() => setSection(section === "request" ? null : "request")} aria-expanded={section === "request"}><WorkbenchIcon name="tasks" size={13}/>Ticket</button><button type="button" onClick={() => setFeedbackOpen(!feedbackOpen)} aria-expanded={feedbackOpen}><WorkbenchIcon name="activity" size={13}/>Chat</button></div>{active.stage === "For review" && <div className="ops-review-decisions"><button type="button" className="ops-request-changes" onClick={() => setFeedbackOpen(true)}>Request changes</button><button type="button" className="pw-primary" onClick={() => void update("Complete")}><WorkbenchIcon name="check" size={13}/>Approve</button></div>}</div>
            {section === "designs" && <section className="ops-design-output"><div><strong>Generated designs</strong><span>{designsMade(active)}/30 · responsive variants</span></div><div className="ops-design-variants">{["Mobile", "Desktop", "Tablet"].map((label, index) => <div key={label}><div className={`ops-variant-preview variant-${index}`}><img src={ACCOUNT_LOGOS[active.account]} alt={active.account}/><b>A little extra.<br/>Just for you.</b><span>Explore your offer →</span></div><strong>{label}</strong><small>10 variants</small></div>)}</div></section>}
            {feedbackOpen && <div className="ops-review-conversation">{reviewNotes[active.id] && <p><strong>Your last feedback</strong><br/>{reviewNotes[active.id]}</p>}<label>Your feedback<textarea aria-label="Review feedback" value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="What should the agent refine?"/></label>{active.stage === "For review" && <button type="button" className="pw-primary" disabled={!feedback.trim()} onClick={() => void update("Building")}>Send feedback & request changes</button>}</div>}
            <div className="ops-review-accordions">{([{id:"checks", label:"Before you approve", meta:`${designsMade(active)} designs · 3 checks`}, {id:"request", label:"Request", meta:"Due today"}, {id:"log", label:"Fleet log", meta:"Build history"}] as const).map(item => <section key={item.id}><button type="button" aria-expanded={section === item.id} onClick={() => setSection(section === item.id ? null : item.id)}><strong>{item.label}</strong><span>{item.meta}</span><WorkbenchIcon name="chevron" size={12}/></button>{section === item.id && <div className="ops-review-accordion-body">{item.id === "checks" ? <><p><WorkbenchIcon name="check" size={11}/>Brand tokens matched</p><p><WorkbenchIcon name="check" size={11}/>Mobile, desktop, and tablet layouts checked</p><p><WorkbenchIcon name="check" size={11}/>Contrast and layout QA completed</p><small>Open designs to inspect the generated variants before approving.</small></> : item.id === "request" ? <><h5>{active.title}</h5><p>Build 30 responsive offer designs using {active.account}’s brand system.</p><dl><div><dt>Requested by</dt><dd>Jaden Snyder</dd></div><div><dt>Placement</dt><dd>{active.type}</dd></div><div><dt>Deliverables</dt><dd>10 mobile · 10 desktop · 10 tablet</dd></div></dl></> : <><p><WorkbenchIcon name="queue" size={11}/>Request added to the queue</p><p><WorkbenchIcon name="building" size={11}/>Brand system applied · designs generated</p><p><WorkbenchIcon name="review" size={11}/>{active.stage === "Complete" ? "Approved by Jaden" : active.stage === "For review" ? "Build complete · waiting for your review" : "Build in progress"}</p>{reviewNotes[active.id] && <p>Revision requested: {reviewNotes[active.id]}</p>}</>}</div>}</section>)}</div>
        </div></aside></div></>}
    </div></Workbench>
}
