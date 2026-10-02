/**
 * The shoppable placement, assembling inside the iPhone frame.
 *
 * Shared by both hero variants — the code-typing one and the config-panel one
 * — so the measured geometry lives in exactly one place. Every layer is a Figma
 * export sliced along the design's own frame boundaries, positioned at
 * coordinates read from the file rather than estimated.
 */

export const FRAME_W = 473
export const FRAME_H = 932
export const SCREEN_X = 40
export const SCREEN_Y = 40
export const SCREEN_W = 393
export const SCREEN_H = 852
export const SCREEN_R = 56

/**
 * How far the screen is carried past the frame's cut-out, in design pixels.
 *
 * The frame asset's inner edge is a hard one-pixel transition from black to
 * nothing, sitting at exactly the screen's own rect. Two separately
 * rasterised layers meeting on the same line means that at some rendered
 * sizes the boundary rounds to a sub-pixel sliver of whatever is behind —
 * which is where the hairline gaps along the screen's edge came from, white
 * where the screen's own ground showed and grey where the page behind did.
 *
 * So the screen is laid out a touch larger than the cut-out and filled with
 * the bezel's own black. The ring is entirely outside the cut-out, so the
 * frame covers all of it; all it does is make sure there is nothing pale for
 * a rounding error to find.
 */
const SEAM = 2

const SHEET_Y = 273
const SHEET_H = SCREEN_H - SHEET_Y
/** Measured off the export: top corners only. */
const SHEET_R = 24

const BASE = "../../projects/shoppable"
const FRAME_SRC = "../../projects/iphone-frame.png"

export type Stage =
    /** The retailer's own confirmation page, behind everything else. */
    | "background"
    | "sheet"
    | "greeting"
    | "headline"
    | "accessory"
    | "images"
    | "details"
    | "buttonPrimary"
    | "buttonDecline"

/** Each component, at its measured position inside the 393x852 screen. */
const LAYERS: {
    stage: Stage
    src: string
    x: number
    y: number
    w: number
    h: number
}[] = [
    {
        stage: "greeting",
        src: `${BASE}/greeting.png`,
        x: 21.5,
        y: 297,
        w: 350,
        h: 20,
    },
    {
        stage: "headline",
        src: `${BASE}/headline.png`,
        x: 21.5,
        y: 321,
        w: 350,
        h: 32,
    },
    {
        stage: "accessory",
        src: `${BASE}/accessory.png`,
        x: 21.5,
        y: 369,
        w: 350,
        h: 24,
    },
    {
        stage: "images",
        src: `${BASE}/images.jpg`,
        x: 21.5,
        y: 393,
        w: 350,
        h: 231,
    },
    {
        stage: "details",
        src: `${BASE}/details.png`,
        x: 21.5,
        y: 640,
        w: 350,
        h: 72,
    },
    {
        stage: "buttonPrimary",
        src: `${BASE}/button-primary.png`,
        x: 16,
        y: 744,
        w: 361,
        h: 42,
    },
    {
        stage: "buttonDecline",
        src: `${BASE}/button-decline.png`,
        x: 16,
        y: 794,
        w: 361,
        h: 42,
    },
]

const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
const PIECE_EASE = "cubic-bezier(0.33, 1, 0.68, 1)"

/**
 * The customer page the placement actually appears on: a retailer's order
 * confirmation. Invented rather than borrowed — it needs to be plausible, not
 * real, and only its top band is visible once the sheet is up, so the identity
 * and the confirmation sit there and the receipt detail runs underneath.
 */
function ConfirmationPage({ px }: { px: (v: number) => number }) {
    const INK = "#191A17"
    const MUTED = "#6B6C66"
    const LINE = "#E8E7E2"
    const row = (label: string, value: string, bold = false) => (
        <div
            key={label}
            style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: px(13),
                fontWeight: bold ? 600 : 400,
                color: bold ? INK : MUTED,
                marginTop: px(8),
            }}
        >
            <span>{label}</span>
            <span style={{ color: INK }}>{value}</span>
        </div>
    )

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                background: "#FBFAF8",
                color: INK,
                overflow: "hidden",
            }}
        >
            {/*
             * The real status bar from the design file. Its export was an
             * opaque white bar, so the white was knocked out by luminance —
             * the glyphs keep their antialiasing and composite over the page's
             * warm ground instead of pasting a white rectangle on top of it.
             */}
            <img
                src={`${BASE}/statusbar.png`}
                alt=""
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: px(393),
                    height: px(54),
                    display: "block",
                }}
            />

            {/* retailer */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: px(58),
                    paddingBottom: px(14),
                    borderBottom: `1px solid ${LINE}`,
                    textAlign: "center",
                    fontSize: px(13),
                    fontWeight: 700,
                    letterSpacing: px(2.4),
                }}
            >
                ALDER &amp; CO.
            </div>

            <div
                style={{
                    position: "absolute",
                    left: px(24),
                    right: px(24),
                    top: px(116),
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        width: px(38),
                        height: px(38),
                        borderRadius: 999,
                        background: "#E7F5EC",
                        color: "#1B7F4B",
                        margin: "0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: px(19),
                        fontWeight: 700,
                    }}
                >
                    ✓
                </div>
                <div
                    style={{
                        marginTop: px(14),
                        fontSize: px(22),
                        fontWeight: 600,
                        letterSpacing: px(-0.4),
                    }}
                >
                    Order confirmed
                </div>
                <div
                    style={{
                        marginTop: px(6),
                        fontSize: px(13),
                        color: MUTED,
                    }}
                >
                    Thanks, Kathleen. Arriving Thu 9 Oct.
                </div>
            </div>

            {/* receipt detail, mostly covered once the sheet is up */}
            <div
                style={{
                    position: "absolute",
                    left: px(24),
                    right: px(24),
                    top: px(232),
                }}
            >
                <div
                    style={{
                        fontSize: px(11),
                        fontWeight: 600,
                        letterSpacing: px(1),
                        color: MUTED,
                    }}
                >
                    ORDER #AC-4471902
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: px(12),
                        alignItems: "center",
                        marginTop: px(14),
                        paddingTop: px(14),
                        borderTop: `1px solid ${LINE}`,
                    }}
                >
                    <div
                        style={{
                            width: px(54),
                            height: px(54),
                            borderRadius: px(8),
                            background: "#EFEEE9",
                            flexShrink: 0,
                        }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: px(14), fontWeight: 600 }}>
                            Ribbed Cotton Throw
                        </div>
                        <div
                            style={{
                                fontSize: px(12),
                                color: MUTED,
                                marginTop: px(2),
                            }}
                        >
                            Oat · Qty 1
                        </div>
                    </div>
                    <div style={{ fontSize: px(14), fontWeight: 600 }}>
                        $78.00
                    </div>
                </div>
                <div style={{ marginTop: px(14) }}>
                    {row("Subtotal", "$78.00")}
                    {row("Shipping", "Free")}
                    {row("Total", "$78.00", true)}
                </div>
            </div>
        </div>
    )
}

/**
 * The phone itself: its shadow, its clipped screen, and the frame artwork over
 * the top. Every hero that shows a phone renders through this, so the three of
 * them cannot drift apart — the geometry is measured off the frame asset and
 * lives here alone.
 *
 * `children` is a render prop receiving `px`, which converts the design's own
 * 473x932 units into real pixels at the rendered width. Geometry is laid out at
 * real scaled pixels rather than inside a `transform: scale()`: a fractional
 * ancestor scale rasterises its subtree and resamples it, which showed up as
 * blurring on every transition.
 */
export function PhoneShell({
    width,
    children,
}: {
    width: number
    children: (px: (v: number) => number) => React.ReactNode
}) {
    const px = (v: number) => (v * width) / FRAME_W

    return (
        <div
            style={{
                width,
                height: width * (FRAME_H / FRAME_W),
                position: "relative",
                flexShrink: 0,
            }}
        >
            {/* The shadow follows the phone's body, measured off the frame
                asset's own alpha. Inset 24 rather than 23: the silhouette is
                only alpha 185 at 23, so a box there left a hairline of
                unshadowed box showing the page through it. */}
            <div
                style={{
                    position: "absolute",
                    left: px(24),
                    top: px(24),
                    width: px(425),
                    height: px(884),
                    borderRadius: px(65.5),
                    boxShadow: `0 ${px(12)}px ${px(34)}px rgba(16,24,40,0.15), 0 ${px(2)}px ${px(8)}px rgba(16,24,40,0.07)`,
                }}
            />

            {/* The seam filler. See SEAM. */}
            <div
                style={{
                    position: "absolute",
                    left: px(SCREEN_X - SEAM),
                    top: px(SCREEN_Y - SEAM),
                    width: px(SCREEN_W + SEAM * 2),
                    height: px(SCREEN_H + SEAM * 2),
                    borderRadius: px(SCREEN_R + SEAM),
                    overflow: "hidden",
                    backgroundColor: "#000000",
                }}
            >
                {/* The screen proper, at its real rect, so everything inside
                    keeps the coordinates it was measured at. */}
                <div
                    style={{
                        position: "absolute",
                        left: px(SEAM),
                        top: px(SEAM),
                        width: px(SCREEN_W),
                        height: px(SCREEN_H),
                        borderRadius: px(SCREEN_R),
                        overflow: "hidden",
                        // White, not the design's dimmed grey app: on a white
                        // page that grey reads as a screenshot. White lets the
                        // sheet float, carried by its own shadow.
                        backgroundColor: "#FFFFFF",
                    }}
                >
                    {children(px)}
                </div>
            </div>

            <img
                src={FRAME_SRC}
                alt=""
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

export default function ShoppablePhone({
    width,
    isDone,
}: {
    width: number
    isDone: (stage: Stage) => boolean
}) {
    return (
        <PhoneShell width={width}>
            {(px) => (
                <>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            opacity: isDone("background") ? 1 : 0,
                            transition: `opacity 320ms ${PIECE_EASE}`,
                        }}
                    >
                        <ConfirmationPage px={px} />
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: px(SHEET_Y),
                            width: px(SCREEN_W),
                            height: px(SHEET_H),
                            background: "#FFFFFF",
                            borderTopLeftRadius: px(SHEET_R),
                            borderTopRightRadius: px(SHEET_R),
                            // White on white, so the shadow is the only thing
                            // saying this is an overlay. Cast upward, since it
                            // rises from below.
                            boxShadow: `0 ${-px(4)}px ${px(26)}px rgba(16,24,40,0.14), 0 ${-px(1)}px ${px(4)}px rgba(16,24,40,0.06)`,
                            transform: isDone("sheet")
                                ? "translate3d(0,0,0)"
                                : `translate3d(0, ${px(SHEET_H)}px, 0)`,
                            transition: `transform 560ms ${SHEET_EASE}`,
                        }}
                    />

                    {LAYERS.map((layer) => (
                        <img
                            key={layer.stage}
                            src={layer.src}
                            alt=""
                            // Eager: each layer has to be decoded before its
                            // beat arrives, and the seven together are only
                            // 68 KB.
                            loading="eager"
                            style={{
                                position: "absolute",
                                left: px(layer.x),
                                top: px(layer.y),
                                width: px(layer.w),
                                height: px(layer.h),
                                display: "block",
                                opacity: isDone(layer.stage) ? 1 : 0,
                                transform: isDone(layer.stage)
                                    ? "translate3d(0,0,0)"
                                    : `translate3d(0, ${px(8)}px, 0)`,
                                transition: `opacity 260ms ${PIECE_EASE}, transform 340ms ${PIECE_EASE}`,
                            }}
                        />
                    ))}
                </>
            )}
        </PhoneShell>
    )
}
