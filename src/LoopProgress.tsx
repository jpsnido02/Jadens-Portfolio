import { useCallback, useState, type ReactNode } from "react"

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
 * One sweep, start to finish, over the cycle's whole length. It was a
 * transition per script step, which was exact but visibly stop-and-go: a step
 * whose transition landed before its successor fired left the fill sitting
 * still, and a step of no duration jumped it. A single linear animation over
 * the total reads as the one continuous thing it is describing.
 *
 * Each loop says how long its cycle runs and counts its passes; the count is
 * the key, so the animation starts over on each pass rather than drifting
 * further from the loop with every lap. These heroes all restart their script
 * when they are scrolled back to, so the two cannot stay out of step either.
 */

/**
 * What a loop calls to say where it is: the fraction of the cycle the step it
 * just entered ends at, and how long that step runs for.
 */
export type LoopReporter = (cycleMs: number, pass: number) => void

/** Thick enough to read against artwork; thin enough not to be furniture. */
const TRACK_H = 3
/** Track to hero. */
const ROW_GAP = 11

export default function LoopProgress({
    cycleMs,
    pass,
    inset,
    muted,
    accent,
}: {
    /** How long one pass of the hero's script takes. */
    cycleMs: number
    /** Which pass this is, so each one starts the sweep over. */
    pass: number
    /** Clear of the pane's own rounded corners. */
    inset: number
    muted: string
    accent: string
}) {
    return (
        <div
            aria-hidden="true"
            style={{
                // A strip of its own at the head of the pane, not an overlay
                // on the hero. Laid over the top it was legible on three of
                // the four and not on the fourth: Uber's camera pushes the
                // whole phone to 1.3, which fills the pane, so the line came
                // down across the status bar and read as a scratch on the
                // device rather than as a bar. Thirteen pixels of height is
                // the price of it never landing on anything.
                flex: "0 0 auto",
                marginLeft: inset,
                marginRight: inset,
                marginBottom: ROW_GAP,
                height: TRACK_H,
                borderRadius: TRACK_H,
                overflow: "hidden",
                // Above whatever is below it: a scaled hero paints outside
                // its layout box, so reserving the strip is not on its own
                // enough to keep the two apart.
                position: "relative",
                zIndex: 2,
                pointerEvents: "none",
            }}
        >
            {/* The unelapsed track, dimmed on a layer of its own. Putting the
                opacity on the parent dimmed the fill with it — CSS opacity
                composites the whole subtree — so the accent was arriving at
                45% and reading as a pale smear rather than a bar. */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: muted,
                    opacity: 0.45,
                }}
            />
            <div
                key={pass}
                style={{
                    position: "relative",
                    height: "100%",
                    backgroundColor: accent,
                    transformOrigin: "left center",
                    transform: "scaleX(0)",
                    // Linear, because it is reporting elapsed time and an
                    // eased readout of elapsed time is a lie.
                    animation:
                        cycleMs > 0
                            ? `loop-sweep ${cycleMs}ms linear forwards`
                            : "none",
                }}
            />
        </div>
    )
}

/** How long one pass of a script takes, for the indicator to sweep over. */
export function cycleMs(durations: number[]) {
    return durations.reduce((n, d) => n + d, 0)
}

/**
 * A hero and its indicator, with the reading between them.
 *
 * The state lives here rather than in the page so that a hero stepping
 * through its script — thirty or so times a cycle — re-renders itself and a
 * three-pixel line, and nothing else on the page.
 */
export function HeroStage({
    children,
    indicate,
    muted,
    accent,
    inset,
}: {
    children: (report: LoopReporter) => ReactNode
    /** False for a still, and for a hero that already draws its own. */
    indicate: boolean
    muted: string
    accent: string
    inset: number
}) {
    const [at, setAt] = useState({ cycleMs: 0, pass: 0 })
    const report = useCallback<LoopReporter>(
        (cycleMs, pass) => setAt({ cycleMs, pass }),
        [],
    )
    return (
        <>
            {indicate && (
                <LoopProgress
                    cycleMs={at.cycleMs}
                    pass={at.pass}
                    inset={inset}
                    muted={muted}
                    accent={accent}
                />
            )}
            {/* Whatever is left, with the hero centred in it. The pane used
                to do this centring itself; it cannot now, because the strip
                above has to come out of the height first.

                Clipped, because a transform paints outside its layout box:
                Uber's camera pushes the whole phone to 1.3 and the device
                then reached up into the strip however much height was
                reserved for it. The pane already trims that overflow — this
                trims it thirteen pixels sooner, which is what keeps the line
                on the pane's own ground instead of across a status bar. */}
            <div
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    width: "100%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {children(report)}
            </div>
        </>
    )
}
