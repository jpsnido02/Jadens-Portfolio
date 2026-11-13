import { useEffect, useRef, useState } from "react"
import useStudySequence from "./useStudySequence"
import "./kalshi-preview.css"

// Illustrative quotes for the portfolio loop, not a live feed or a payout model.
// Single-game example: SF trails SEA 17–24 late in Q4. Quotes are illustrative, not inferred from yardage.
const QUOTES = [
    { probability: 18, payout: "131.16" },
    { probability: 16, payout: "147.56" },
]
// Line up → five-yard loss → finish → quote update → reverse → settle.
const PLAY_TIMING = [1400, 2400, 550, 3000, 1800, 600]
function FootballPlay({ phase }: { phase: number }) {
    const finished = phase === 2 || phase === 3
    return <div className={`kalshi-football ${finished ? "is-finished" : ""}`} data-play-phase={phase}>
        <div className="kalshi-game-context"><span>SF 17 · SEA 24</span><span className="kalshi-example-label">ILLUSTRATIVE GAME</span><span>Q4 · {finished ? "1:58 · 3RD & 15 · SF 25" : "2:10 · 2ND & 10 · SF 30"}</span></div>
        <svg viewBox="0 0 1200 174" role="img" aria-label="San Francisco loses 5 yards, from the 30-yard line to the 25-yard line.">
            <rect x="1" y="1" width="1198" height="172" rx="12" fill="#111d18" stroke="#ffffff12" strokeWidth="2" />
            {[100, 420, 740, 1060].map((x, i) => <g key={x}>
                <text className="kalshi-yard-number" x={x} y="42" textAnchor="middle">{20 + i * 10}</text>
                <line x1={x} x2={x} y1="60" y2="148" stroke="#ffffff28" strokeWidth="2" />
            </g>)}
            {Array.from({ length: 34 }, (_, i) => 100 + i * 32).map(x => <g key={x} stroke="#ffffff20" strokeWidth="2">
                <line x1={x} x2={x} y1="60" y2="69" />
                <line x1={x} x2={x} y1="139" y2="148" />
            </g>)}
            <line className="kalshi-scrimmage" x1="420" x2="420" y1="60" y2="148" />
            <line className="kalshi-first-down" x1="740" x2="740" y1="60" y2="148" />
            <path className="kalshi-yard-progress" d="M420 104 H260" pathLength="1" />
            <g className="kalshi-ball-marker">
                <circle r="28" fill="#00d49b" stroke="#111d18" strokeWidth="5" />
                <g transform="rotate(-35)">
                    <ellipse rx="15" ry="9" fill="none" stroke="#06251c" strokeWidth="2.5" />
                    <path d="M-7 0H7 M-4 -3V3 M0 -3V3 M4 -3V3" fill="none" stroke="#06251c" strokeWidth="2" strokeLinecap="round" />
                </g>
            </g>
            <text className="kalshi-run-gain" x="260" y="42" textAnchor="middle">−5 YDS</text>
        </svg>
    </div>
}
function RollingValue({ value, previous, revision }: { value: string; previous: string; revision: number }) {
    const down = Number(value) < Number(previous)
    return <span className="kalshi-number" aria-label={value}>{value.split("").map((digit, index) => {
        const old = previous[index] ?? digit
        return <span key={index} className={`kalshi-digit ${digit === "." ? "is-point" : ""}`} aria-hidden="true">{digit === old ? digit : <span key={revision} className="kalshi-number-track" data-direction={down ? "down" : "up"}>{(down ? [digit, old] : [old, digit]).map((character, position) => <span key={position}>{character}</span>)}</span>}</span>
    })}</span>
}
export default function KalshiPreview({ playing }: { playing: boolean }) {
    const root = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)
    const phase = useStudySequence(PLAY_TIMING, playing, 3)
    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setScale(Math.max(0, Math.min((entry.contentRect.width - 80) / 1200, (entry.contentRect.height - 80) / 870))))
        observer.observe(root.current!)
        return () => observer.disconnect()
    }, [])
    const quote = phase === 3 ? QUOTES[1] : QUOTES[0]
    const previous = phase === 3 ? QUOTES[0] : phase === 4 ? QUOTES[1] : quote
    const revision = phase
    return <div ref={root} className="kalshi-preview" data-playing={playing} data-quote={quote.probability} data-play-phase={phase}>
        <div className="kalshi-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
            <FootballPlay phase={phase} />
            <div className="kalshi-ad">
                <span className="kalshi-sport">PRO FOOTBALL</span><span className="kalshi-wordmark">Kalshi</span>
                <span className="kalshi-event">SAN FRANCISCO VS SEATTLE · GAME WINNER</span>
                <span className="kalshi-chance-label">MARKET CHANCE</span>
                <div className="kalshi-prediction"><span>San Francisco</span><span className="kalshi-odds"><RollingValue value={String(quote.probability)} previous={String(previous.probability)} revision={revision} /><span>%</span></span></div>
                <div className="kalshi-rule" />
                <span className="kalshi-pay-label">YOU PAY</span><strong className="kalshi-pay">$25.00</strong>
                <span className="kalshi-code">CODE: FREE50</span>
                <span className="kalshi-payout-label">POTENTIAL PAYOUT</span><strong className="kalshi-payout"><span>$</span><RollingValue value={quote.payout} previous={previous.payout} revision={revision} /></strong>
                <span className="kalshi-condition">if San Francisco wins this game</span>
                <p className="kalshi-terms">Illustrative scenario and prices for a new $25 entry.<br />Trading involves risk of loss. Not available in all states. 18+.</p>
            </div>
        </div>
    </div>
}
