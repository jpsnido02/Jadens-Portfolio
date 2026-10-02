/**
 * The card thumbnail for the conveyor take: partner logos on the same belt.
 *
 * The icons butt together rather than sitting in slots with gaps — the window
 * is one tile wide, and a gap would mean the card periodically showing an
 * empty square. So there is always a logo in it, usually two halves of one
 * sliding into the next.
 *
 * It runs the same cycle length as the hero's conveyor and is seeked from the
 * same epoch, so the logo here is the brand the phone beside it is showing
 * without a timer passing between them.
 */

import { useRef, useSyncExternalStore } from "react"
import { ICON, PARTNERS } from "./partners"
import { CYCLE_MS, LOOP, phaseDelay, useConveyorRunning } from "./conveyor"

export default function PartnerConveyor({
    size,
    radius,
    cornerShape,
    border,
}: {
    size: number
    radius: number
    cornerShape: string
    border: string
}) {
    /** Computed once, and kept across renders so seeking cannot restart the
     *  animation. useSyncExternalStore with a never-changing store is the
     *  cheapest way to hold a value that must not be recomputed. */
    const delay = useSyncExternalStore(() => () => {}, phaseDelay, phaseDelay)

    const wrapRef = useRef<HTMLDivElement>(null)
    const running = useConveyorRunning(wrapRef)

    return (
        <div
            ref={wrapRef}
            style={{
                width: size,
                height: size,
                borderRadius: radius,
                ...({ cornerShape } as object),
                overflow: "hidden",
                border: `1px solid ${border}`,
                boxSizing: "border-box",
                flexShrink: 0,
                position: "relative",
            }}
        >
            <div
                className="conveyor-track"
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    alignItems: "stretch",
                    ...({
                        "--conveyor-shift": `${size * PARTNERS.length}px`,
                    } as object),
                    animationDuration: `${CYCLE_MS}ms`,
                    animationDelay: delay,
                    animationPlayState: running ? "running" : "paused",
                }}
            >
                {LOOP.map((p, i) => (
                    <img
                        key={`${p.id}-${i}`}
                        src={ICON(p.id)}
                        alt=""
                        loading="eager"
                        style={{
                            width: size,
                            height: size,
                            flexShrink: 0,
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
