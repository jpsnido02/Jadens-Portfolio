/**
 * The loop indicator: where an animated hero is in its cycle, and where it
 * starts over.
 *
 * Two of the seven heroes are a photograph and five of them are playing, and
 * nothing on the card said which was which — so a still was something you
 * waited at, expecting it to begin. This line is the difference. A hero that
 * carries one is running; a hero with none is a picture, and the absence says
 * so without a word of copy.
 *
 * It is a readout of the script rather than a second clock. Each loop hands
 * over the fraction its current step ends at and how long that step runs for,
 * and the fill transitions to exactly that over exactly that — so the bar
 * cannot drift from the animation it is describing, however long it runs, and
 * it stops dead whenever the loop does, because a loop that is not stepping
 * sends nothing to move to.
 */

/** Thick enough to read against artwork; thin enough not to be furniture. */
const TRACK_H = 3

export default function LoopProgress({
    value,
    ms,
    inset,
    muted,
    accent,
}: {
    /** How far through the cycle the current step ends, 0 to 1. */
    value: number
    /** How long that step takes, which is how long the fill has to get there. */
    ms: number
    /** Clear of the pane's own rounded corners. */
    inset: number
    muted: string
    accent: string
}) {
    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                left: inset,
                right: inset,
                bottom: inset,
                height: TRACK_H,
                borderRadius: TRACK_H,
                overflow: "hidden",
                backgroundColor: muted,
                opacity: 0.45,
                // Over the hero, not beside it. Reserving a strip would have
                // cost every one of these heroes the height they were just
                // given, to say something a hairline says.
                zIndex: 2,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    height: "100%",
                    backgroundColor: accent,
                    transformOrigin: "left center",
                    transform: `scaleX(${value})`,
                    // Linear, because it is reporting elapsed time and an
                    // eased readout of elapsed time is a lie.
                    transition: ms > 0 ? `transform ${ms}ms linear` : "none",
                }}
            />
        </div>
    )
}

/**
 * The cumulative fraction each step of a script ends at, and its duration.
 *
 * Every one of these heroes is driven by the same shape — an array of steps
 * each carrying `ms`, ending in a reset — so the mapping from "which step" to
 * "how far through" is the same arithmetic in all of them, and lives here
 * once rather than four times.
 */
export function cycleProgress(
    durations: number[]
): { value: number; ms: number }[] {
    const total = durations.reduce((n, d) => n + d, 0) || 1
    let run = 0
    return durations.map((d) => {
        run += d
        return { value: run / total, ms: d }
    })
}
