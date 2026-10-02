/**
 * The card thumbnail for the conveyor take: one logo, swapped.
 *
 * Sliding the logos the way the phones slide was the obvious thing and it
 * looked wrong — a logo is a mark rather than a scene, and dragging one
 * through a tile this size reads as a glitch rather than as motion. So the
 * tile holds a single mark and changes it as each phone comes most of the way
 * to the hero's centre, which keeps the card on the brand the phone beside it
 * is showing without anything sliding.
 *
 * Both read the same run, so there is no timer passing between them.
 */

import { useRef } from "react"
import { ICON, PARTNERS } from "./partners"
import { useConveyorLogo, useConveyorRun } from "./conveyor"

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
    const wrapRef = useRef<HTMLDivElement>(null)
    const { running } = useConveyorRun(wrapRef)
    const current = useConveyorLogo(running)
    const partner = PARTNERS[current]

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
            {/* Every mark stays mounted and the current one is simply the
                visible one, so a logo is never swapped in still decoding. */}
            {PARTNERS.map((p, i) => (
                <img
                    key={p.id}
                    src={ICON(p.id)}
                    alt={i === current ? p.name : ""}
                    loading="eager"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        opacity: i === current ? 1 : 0,
                    }}
                />
            ))}
            <span style={{ display: "none" }}>{partner.name}</span>
        </div>
    )
}
