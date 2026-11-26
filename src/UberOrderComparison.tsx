import { useRef, useState, type CSSProperties, type PointerEvent } from "react"
import { FRAME_W, FRAME_H } from "./IPhoneFrame"
import UberAdsLoop from "./UberAdsLoop"
import "./uber-order-comparison.css"

export default function UberOrderComparison() {
    const [breakfast, setBreakfast] = useState(65)
    const range = useRef<HTMLInputElement>(null)

    function updateSplit(event: PointerEvent<HTMLDivElement>) {
        const { left, width } = event.currentTarget.getBoundingClientRect()
        if (width > 0) {
            const percent = Math.round((event.clientX - left) / width * 100)
            setBreakfast(Math.max(0, Math.min(100, percent)))
        }
    }

    function beginDrag(event: PointerEvent<HTMLDivElement>) {
        if (!event.isPrimary || event.button !== 0) return
        range.current?.focus({ preventScroll: true })
        event.currentTarget.setPointerCapture(event.pointerId)
        updateSplit(event)
    }

    return <div className="meal-comparison" id="order-comparison" style={{ "--split": breakfast + "%" } as CSSProperties}>
        <span className="meal-tag meal-tag-left">Breakfast</span>
        <div className="meal-window" style={{aspectRatio:`${FRAME_W} / ${FRAME_H}`}} onPointerDown={beginDrag}
            onPointerMove={event => {
                if (event.isPrimary && event.currentTarget.hasPointerCapture(event.pointerId)) updateSplit(event)
            }}>
            <div className="meal-screen" aria-hidden="true"><UberAdsLoop comparisonMeal="dinner" fit="contain" /></div>
            <div className="meal-screen meal-breakfast" aria-hidden="true"><UberAdsLoop comparisonMeal="breakfast" fit="contain" /></div>
            <input ref={range} className="meal-range" type="range" min="0" max="100" value={breakfast}
                aria-label="Compare breakfast and dinner offers on Uber Eats"
                aria-valuetext={breakfast + "% breakfast with Starbucks, " + (100 - breakfast) + "% dinner with Disney+"}
                onChange={event => setBreakfast(event.currentTarget.valueAsNumber)} />
            <div className="meal-divider" aria-hidden="true"><span>
                <svg width="15" height="12" viewBox="0 0 15 12" fill="none" focusable="false">
                    <path d="M2 1v10M7.5 1v10M13 1v10" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
            </span></div>
        </div>
        <span className="meal-tag meal-tag-right">Dinner</span>
    </div>
}
