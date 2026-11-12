/**
 * The pointer, shared by every animation that has one.
 *
 * The art is the system arrow — a black arrow with a white keyline — which
 * reads on a white retail page and on a dark panel without either one needing
 * its own variant. It was drawn once and lives here rather than in each hero,
 * so they cannot drift apart.
 *
 * The component renders the arrow with its *tip* at the parent's origin, not
 * its bounding box. Callers position the thing they are pointing at and the
 * tip lands on it, which is what you want from a cursor and what makes the
 * press scale pivot correctly — `transform-origin: 0 0` on a wrapper is then
 * the tip itself.
 */

/** The tip's position inside the 28x28 artwork, as a fraction. */
const TIP_X = 8.2 / 28
const TIP_Y = 4.9 / 28

export default function Cursor({ size }: { size: number }) {
    return (
        <span
            style={{
                position: "relative",
                display: "block",
                width: 0,
                height: 0,
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 28 28"
                style={{
                    position: "absolute",
                    left: -size * TIP_X,
                    top: -size * TIP_Y,
                    display: "block",
                }}
            >
                {/* White keyline, then the arrow over it. */}
                <polygon
                    fill="#FFFFFF"
                    points="8.2,20.9 8.2,4.9 19.8,16.5 13,16.5 12.6,16.6"
                />
                <polygon
                    fill="#FFFFFF"
                    points="17.3,21.6 13.7,23.1 9,12 12.7,10.5"
                />
                <rect
                    x="12.5"
                    y="13.6"
                    transform="matrix(0.9221 -0.3871 0.3871 0.9221 -5.7605 6.5909)"
                    width="2"
                    height="8"
                />
                <polygon points="9.2,7.3 9.2,18.5 12.2,15.6 12.6,15.5 17.4,15.5" />
            </svg>
        </span>
    )
}
