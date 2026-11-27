import { useEffect, useLayoutEffect, useRef, useState } from "react"
import usePausablePlaybackTimer, { usePausableSubtreeAnimations } from "./usePausablePlaybackTimer"
import "./kalshi-preview.css"

// Illustrative quotes. Market prices are not determined by field position.
const START_CHANCE = 82
const END_CHANCE = 66
const SF_PAYOUT = "$37.41"
const PHILADELPHIA_PAYOUT = "$55.56"
type Team = "sf" | "sea" | "phi" | "dal"

function getQuotes(team: "sf" | "sea") {
    return Array.from({ length: START_CHANCE - END_CHANCE + 1 }, (_, index) => {
        const seattle = START_CHANCE - index
        const chance = team === "sea" ? seattle : 100 - seattle
        return String(chance)
    })
}

const lineUp = 1400
const runTime = 2400
const touchdownHold = 1100
// Build speed through the early quotes, then give the last updates room to settle.
const quoteBeats = [120, 100, 88, 80, 76, 76, 80, 90, 106, 124, 148, 176, 210, 248, 286, 340]
const quoteRoll = quoteBeats.reduce((total, beat) => total + beat, 0)
const comparisonBeats = [120, 180]
const comparisonRoll = comparisonBeats.reduce((total, beat) => total + beat, 0)
const payoutDelay = 1050
const comparisonDelay = 1400 + payoutDelay
const tapApproach = 120
const cardPress = 240
const phases = ["lineup", "run", "touchdown", "ticker", "settled", "sf-approach", "sf-press", "focused", "philly-ticker",
    "philly-hold", "philly-approach", "philly-press", "philly-focused", "sf-return-approach", "sf-return-press", "sf-return", "claim-press", "claimed"] as const
type Phase = typeof phases[number]
const timing = [lineUp, runTime, touchdownHold, quoteRoll, 450, tapApproach, cardPress, comparisonDelay, comparisonRoll, 650, tapApproach, cardPress, 1320 + payoutDelay, tapApproach, cardPress, 1400 + payoutDelay, cardPress, 1800]
const phillyRollIndex = phases.indexOf("philly-ticker")
const tapSequences = [
    { game: "san-francisco", approach: "sf-approach", contact: "sf-press", release: "focused" },
    { game: "philadelphia", approach: "philly-approach", contact: "philly-press", release: "philly-focused" },
    { game: "san-francisco", approach: "sf-return-approach", contact: "sf-return-press", release: "sf-return" },
] as const
type Comparison = "idle" | "waiting" | "rolling" | "done"

const GAMES = [
    { id: "san-francisco", team: "San Francisco", status: "Q4 · 2:10", payout: SF_PAYOUT, sides: [
        { code: "SF", logo: "49ers", score: 17, team: "sf" as const },
        { code: "SEA", logo: "seahawks", score: 24, team: "sea" as const },
    ] },
    { id: "chicago", team: "Chicago", status: "Q3 · 6:42", payout: "$80.65", fieldPosition: 38, sides: [
        { code: "CHI", logo: "chi", score: 14, chance: 31 },
        { code: "DET", logo: "det", score: 21, chance: 69 },
    ] },
    { id: "philadelphia", team: "Philadelphia", status: "Q4 · 8:15", payout: "$58.14", fieldPosition: 67, sides: [
        { code: "PHI", logo: "phi", score: 20, team: "phi" as const },
        { code: "DAL", logo: "dal", score: 21, team: "dal" as const },
    ] },
] as const
type Game = typeof GAMES[number]["id"]
const scored = (phase: Phase) => phase !== "lineup" && phase !== "run"

function buildDigitReels(values: string[], rising: boolean, beats: number[], duration: number) {
    const width = Math.max(...values.map(value => value.length))
    const padded = values.map(value => value.padStart(width, "\u2007"))
    return Array.from(padded[0], (first, place) => {
        const digits = [first]
        const stops = [{ row: 0, percent: "0%" }]
        let elapsed = 0
        const offset = (time: number) => `${(time / duration * 100).toFixed(3)}%`
        beats.forEach((beat, index) => {
            const next = padded[index + 1][place]
            if (next !== digits[digits.length - 1]) {
                if (index === beats.length - 1) {
                    const row = digits.length - 1
                    stops.push({ row: row + .82, percent: offset(elapsed + beat * .6) })
                }
                digits.push(next)
            }
            elapsed += beat
            stops.push({ row: digits.length - 1, percent: offset(elapsed) })
        })
        const lastRow = digits.length - 1
        // CSS linear() expresses the position as a fraction of the full reel travel.
        // Reverse the row order for falling values so the glyphs move down.
        const easing = lastRow ? `linear(${stops.map(({ row, percent }) => {
            const progress = row / lastRow
            return `${(rising ? progress : 1 - progress).toFixed(5)} ${percent}`
        }).join(", ")})` : undefined
        return { digits: rising ? digits : [...digits].reverse(), easing }
    })
}

const teamQuotes = { sf: getQuotes("sf"), sea: getQuotes("sea"), phi: ["43", "44", "45"], dal: ["57", "56", "55"] }
const reels = {
    sf: buildDigitReels(teamQuotes.sf, true, quoteBeats, quoteRoll),
    sea: buildDigitReels(teamQuotes.sea, false, quoteBeats, quoteRoll),
    phi: buildDigitReels(teamQuotes.phi, true, comparisonBeats, comparisonRoll),
    dal: buildDigitReels(teamQuotes.dal, false, comparisonBeats, comparisonRoll),
}

function RollingChance({ phase, team, comparison }: { phase: Phase; team: Team; comparison: Comparison }) {
    const alternate = team === "phi" || team === "dal"
    const after = alternate
        ? comparison === "rolling" || comparison === "done"
        : phase !== "lineup" && phase !== "run" && phase !== "touchdown"
    const rolling = alternate ? comparison === "rolling" : phase === "ticker"
    const duration = alternate ? comparisonRoll : quoteRoll
    const quotes = teamQuotes[team]
    const value = after ? quotes[quotes.length - 1] : quotes[0]
    const positions = reels[team]
    return <span className="kalshi-number" aria-label={value}>
        {Array.from(value, (digit, place) => <span key={place} className="kalshi-digit" aria-hidden="true">
            {rolling && positions[place].easing ? <span className="kalshi-number-track"
                style={{ animationDuration: `${duration}ms`, animationTimingFunction: positions[place].easing }}>
                {positions[place].digits.map((digit, row) => <span key={row}>{digit}</span>)}
            </span> : digit}
        </span>)}
    </span>
}

function PayoutCount({ payout, reduced }: { payout?: string; reduced: boolean }) {
    const target = payout ? Math.round(Number(payout.slice(1)) * 100) : 0
    const current = useRef(0)
    const [visible, setVisible] = useState(0)

    useLayoutEffect(() => {
        if (!payout || reduced) {
            current.current = target
            setVisible(target)
            return
        }
        const from = current.current
        if (from === target) return
        const started = performance.now() + payoutDelay
        let frame: number
        function tick(now: number) {
            if (now < started) {
                frame = requestAnimationFrame(tick)
                return
            }
            const time = Math.min(1, (now - started) / 900)
            const progress = 1 - (1 - time) ** 3
            current.current = Math.round(from + (target - from) * progress)
            setVisible(current.current)
            if (time < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [payout, reduced, target])

    return <strong>
        <span aria-hidden="true">{`$${(visible / 100).toFixed(2)}`}</span>
        <span className="kalshi-a11y-payout">{payout ?? "$0.00"}</span>
    </strong>
}

export default function KalshiPreview({ playing, interactive = false }: { playing: boolean; interactive?: boolean }) {
    const root = useRef<HTMLDivElement>(null)
    const stage = useRef<HTMLDivElement>(null)
    const tapIndicator = useRef<HTMLSpanElement>(null)
    const [picked, setPicked] = useState<Game | null>(null)
    const [instantSelection, setInstantSelection] = useState(false)
    const [manualComparison, setManualComparison] = useState<Comparison>("idle")
    const [claimed, setClaimed] = useState<Game | null>(null)
    const [layout, setLayout] = useState({ scale: 0, compact: false })
    const [livePhase, setLivePhase] = useState(0)
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
    useEffect(() => {
        const preference = matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduced(preference.matches)
        sync()
        preference.addEventListener("change", sync)
        return () => preference.removeEventListener("change", sync)
    }, [])

    const phase = reduced ? (interactive ? "settled" : "claimed") : phases[livePhase]
    const running = playing && !reduced
    const tap = interactive || reduced ? undefined : tapSequences.find(sequence =>
        phase === sequence.approach || phase === sequence.contact || phase === sequence.release)
    const tapStep = tap && (phase === tap.approach ? "approach" : phase === tap.contact ? "contact" : "release")
    const scriptedPress = tapStep === "contact" ? tap?.game : null
    const scriptedSelection = phase === "philly-focused" || phase === "sf-return-approach" || phase === "sf-return-press"
        ? "philadelphia"
        : livePhase < phases.indexOf("focused") && !reduced
            ? null
            : "san-francisco"
    const selected = interactive ? picked : scriptedSelection
    const comparison: Comparison = reduced ? "done" : interactive
        ? manualComparison
        : phase === "philly-ticker" ? "rolling" : livePhase > phillyRollIndex ? "done" : "idle"
    const offer = GAMES.find(game => game.id === selected)
    const payout = offer?.id === "philadelphia" && (comparison === "rolling" || comparison === "done")
        ? PHILADELPHIA_PAYOUT : offer?.payout
    const confirmed = offer != null && (interactive ? claimed === selected : phase === "claimed")

    useEffect(() => {
        if (interactive && !reduced && phase === "settled" && picked === "san-francisco") {
            setManualComparison(current => current === "idle" ? "waiting" : current)
        }
    }, [interactive, reduced, phase, picked])
    usePausablePlaybackTimer({
        entryKey: manualComparison,
        duration: manualComparison === "waiting" ? comparisonDelay : manualComparison === "rolling" ? comparisonRoll : null,
        playing: running,
        onElapsed: () => setManualComparison(current => current === "waiting" ? "rolling" : "done"),
    })

    function selectGame(game: Game, immediate: boolean) {
        if (game === picked) return
        setInstantSelection(immediate)
        setPicked(game)
        setClaimed(null)
    }

    function claimOffer() {
        if (selected) setClaimed(selected)
    }

    const duration = interactive && phases[livePhase] === "settled" ? null : timing[livePhase]
    const clock = usePausablePlaybackTimer({
        entryKey: livePhase,
        duration,
        playing: running,
        onElapsed: () => setLivePhase(current => (current + 1) % timing.length),
    })
    usePausableSubtreeAnimations(root, running, `${phase}:${comparison}`)

    useLayoutEffect(() => {
        const frame = stage.current
        const indicator = tapIndicator.current
        if (!frame || !indicator || !tap || !layout.scale) return
        const card = frame.querySelector(`[data-game="${tap.game}"]`)
        if (!card) return
        const bounds = card.getBoundingClientRect()
        const origin = frame.getBoundingClientRect()
        indicator.style.left = `${(bounds.left + bounds.width / 2 - origin.left) / layout.scale}px`
        indicator.style.top = `${(bounds.top + bounds.height / 2 - origin.top) / layout.scale}px`
    }, [tap, layout.scale])

    const wasReduced = useRef(reduced)
    useLayoutEffect(() => {
        // The poster replaces live CSS keyframes. Restore their playhead when
        // returning to the live phase, including when the player is still paused.
        if (wasReduced.current && !reduced) {
            const elapsed = duration == null ? 0 : duration - (clock.remainingMs ?? duration)
            for (const animation of root.current?.getAnimations?.({ subtree: true }) ?? []) {
                if ("animationName" in animation) animation.currentTime = elapsed
            }
        }
        wasReduced.current = reduced
    }, [reduced, duration, clock])
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            const compact = width < 600
            const scale = Math.max(0, Math.min((width - (compact ? 16 : 64)) / (compact ? 600 : 1200),
                (height - (compact ? 12 : 24)) / (compact ? 650 : 610)))
            setLayout({ scale, compact })
        })
        observer.observe(root.current!)
        return () => observer.disconnect()
    }, [])
    return <div ref={root} className="kalshi-preview" data-playing={running} data-compact={layout.compact}
        data-instant-selection={instantSelection} data-play-phase={phase}>
        <div className="kalshi-stage" ref={stage} style={{ transform: `translate(-50%, -50%) scale(${layout.scale})` }}>
            <section className="kalshi-games" aria-label="Football matchups">
                <div className="kalshi-game-list" role="group" aria-label="Select a matchup">
                    {GAMES.map(game => {
                        const active = game.id === selected
                        const liveGame = game.id === "san-francisco"
                        const isScoring = liveGame && scored(phase)
                        const content = <>
                            <span className="kalshi-game-status">{isScoring ? "Q4 · 1:58" : game.status}
                                {isScoring && <strong className="kalshi-score-event">TOUCHDOWN</strong>}
                            </span>
                            <span className="kalshi-game-lines">
                                {game.sides.map((side, index) => <span className="kalshi-game-line" key={side.code}>
                                    <img src={`/projects/kalshi/${side.logo}.png`} alt="" />
                                    <strong>{side.code}</strong>
                                    <span>{isScoring && index === 0 ? 23 : side.score}</span>
                                    <span className="kalshi-game-chance">
                                        {"team" in side
                                            ? <RollingChance phase={phase} team={side.team} comparison={comparison} />
                                            : side.chance}%
                                    </span>
                                </span>)}
                            </span>
                            <span className="kalshi-game-meter" aria-hidden="true">
                                <svg viewBox="0 0 200 12" preserveAspectRatio="none" focusable="false">
                                    <path d="M1 6H199 M1 1V11 M50 1V11 M100 1V11 M150 1V11 M199 1V11" />
                                    <path d="M25 4V8 M75 4V8 M125 4V8 M175 4V8" />
                                </svg>
                                {liveGame && <span data-phase={phase} />}
                                {"fieldPosition" in game && <i className="kalshi-field-position" style={{ left: `${game.fieldPosition}%` }} />}
                            </span>
                        </>
                        return interactive
                            ? <button key={game.id} className="kalshi-game" type="button" aria-pressed={active}
                                aria-label={`${game.sides[0].code} versus ${game.sides[1].code}, show ${game.team} offer`}
                                onClick={event => selectGame(game.id, event.detail === 0 || !running)}>{content}</button>
                            : <div key={game.id} className="kalshi-game" data-selected={active} data-game={game.id} data-clicking={scriptedPress === game.id}>{content}</div>
                    })}
                </div>
                <div className="kalshi-creative">
                    <div className="kalshi-offer-copy">
                        <h3>Pick a team for game day.</h3>
                        <p className="kalshi-payout-label">{offer ? `Your potential payout if ${offer.sides[0].code} wins:` : "Your potential payout:"}</p>
                        <div className="kalshi-payout" aria-live={interactive ? "polite" : undefined}>
                            <PayoutCount payout={payout} reduced={reduced} />
                        </div>
                        {interactive
                            ? <button type="button" className="kalshi-claim" disabled={!offer || confirmed}
                                onClick={claimOffer}>{confirmed ? "Offer claimed" : "Claim offer"}</button>
                            : <span className="kalshi-claim" data-disabled={!offer} data-pressed={phase === "claim-press"}>
                                {confirmed ? "Offer claimed" : "Claim offer"}
                                {!reduced && (phase === "claim-press" || phase === "claimed") && <span className="uber-tap" aria-hidden="true" />}
                            </span>}
                    </div>
                    <div className="kalshi-offer-art">
                        <span aria-hidden="true">Kalshi</span>
                        <img src="/projects/kalshi/sf-offer.png" alt="" onError={event => { event.currentTarget.hidden = true }} />
                    </div>
                </div>
            </section>
            {tap && <span key={tap.approach} ref={tapIndicator} className="kalshi-tap-target" aria-hidden="true">
                {tapStep === "approach"
                    ? <span className="kalshi-tap-indicator" style={{ animationDuration: `${tapApproach}ms` }} />
                    : <span className="uber-tap" />}
            </span>}
        </div>
    </div>
}
