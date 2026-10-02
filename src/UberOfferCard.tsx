/**
 * The Uber Eats offer card, rebuilt as a component.
 *
 * It was four flat exports that could only cross-fade. Which meant the one
 * thing worth watching — the offer being replaced inside a container that
 * stays put — could never be more than a dissolve, and the call to action
 * could not change its width with its label.
 *
 * So the card is assembled here from its parts, and every measurement is read
 * off those exports rather than guessed: the card is 358 units wide with a 16
 * unit inset, the pills are 40 tall and fully rounded, the primary is #F6F6F6
 * against a white secondary with a hairline, and the type is Uber's own.
 *
 * What carries across all four: the container, the headline, the pill pair,
 * the disclaimer and the Ad mark. What varies: a badge on one of them, a body
 * that one of them does without, and the media — which is the real difference
 * between these layouts. It sits inline beside the headline on two, is absent
 * on a third, and runs full bleed across the top of the fourth, which is why
 * that one has no body copy and the tallest card.
 */

import { useLayoutEffect, useRef, useState } from "react"

/** Uber's own faces, in the two families the app uses: Text for UI, the
 *  display cut for anything large. Declared in index.css. */
export const UBER_TEXT =
    '"Uber Move Text", "Uber Move", -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif'
export const UBER_DISPLAY =
    '"Uber Move", "Uber Move Text", -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif'

const BASE = "../../projects/uber"

/* ------------------------------------------------------------- the content */

export type OfferMedia =
    /** Beside the headline, right-aligned to the card's inset. */
    | { kind: "inline"; src: string; w: number; h: number }
    /** Across the top, edge to edge, above everything. */
    | { kind: "bleed"; src: string; h: number }
    | { kind: "none" }

export interface Offer {
    id: string
    /** The partner, for the label above the phone and for screen readers. */
    label: string
    badge?: string
    media: OfferMedia
    headline: string
    body?: string
    primary: string
    disclaimer: string
    /** The card's height, as the export drew it. */
    height: number
    /** Where the two buttons sit, for the pointer to aim at. */
    claim: { x: number; y: number }
    notNow: { x: number; y: number }
}

export const OFFERS: Offer[] = [
    {
        id: "spotify",
        label: "Spotify Premium",
        media: {
            kind: "inline",
            src: `${BASE}/media-spotify.webp`,
            w: 48,
            h: 48,
        },
        headline: "Soundtrack your wait with Spotify Premium.",
        body: "Your Uber Eats order is on the way, press play on music, podcasts, and more with Spotify.",
        primary: "Open Spotify",
        disclaimer: "Spotify Premium subscription required.",
        height: 223,
        claim: { x: 32, y: 614 },
        notNow: { x: 160, y: 614 },
    },
    {
        id: "farmers",
        label: "The Farmer's Dog",
        media: {
            kind: "inline",
            src: `${BASE}/media-farmers.webp`,
            w: 121,
            h: 62,
        },
        headline: "Breakfast for you. The Farmer's Dog for them.",
        body: "While your Uber Eats order is on the way, explore fresh, personalized meals from The Farmer's Dog.",
        primary: "Explore meals",
        disclaimer: "Availability and terms may vary.",
        height: 238,
        claim: { x: 32, y: 629 },
        notNow: { x: 160, y: 629 },
    },
    {
        id: "starbucks",
        label: "Starbucks",
        badge: "Buy 1 get 1",
        media: { kind: "none" },
        headline: "Breakfast's coming. Coffee next?",
        body: "Your Joe & The Juice breakfast is on the way, keep the morning going with Starbucks.",
        primary: "Add to Order",
        disclaimer: "Availability varies by location.",
        height: 221,
        claim: { x: 32, y: 612 },
        notNow: { x: 160, y: 612 },
    },
    {
        id: "disney",
        label: "Disney+",
        media: { kind: "bleed", src: `${BASE}/media-disney.webp`, h: 130 },
        headline: "Breakfast's on the way. Queue up Disney+.",
        primary: "Open Disney+",
        disclaimer: "Disney+ subscription required. Terms apply.",
        height: 282,
        claim: { x: 33, y: 672 },
        notNow: { x: 161, y: 672 },
    },
]

/* ----------------------------------------------------------- the measurements */

export const CARD_W = 358
/** The card's own inset, and the gap between the headline and inline media. */
const PAD = 16
const CARD_R = 12
const CARD_BORDER = "#EFEFEF"

const HEAD_SIZE = 17
const HEAD_LINE = 20
const BODY_SIZE = 13.5
const BODY_LINE = 20
const PILL_H = 40
const PILL_PAD = 15
const PILL_GAP = 10
const PILL_SIZE = 14.5
const FILL = "#F6F6F6"
const HAIRLINE = "#E8E8E8"
const INK = "#030303"
const MUTED = "#9A9A9A"

/** The pager, drawn rather than drawn on. */
const DOT_D = 8
const DOT_GAP = 16
const DOT_X = 20
const DOT_UP = 15
const DOT_ON = "#030303"
const DOT_OFF = "#E3E3E3"
/**
 * What the content column leaves clear at the bottom for the pager.
 *
 * The dots are positioned against the card's own bottom edge rather than
 * flowing after the footer, so the column has to stop short of them. The
 * export left 13 units between the disclaimer and the dots, which reads as
 * them touching; this is 24, with the dots themselves sitting a little nearer
 * the edge to buy the difference without squeezing the copy above.
 */
const FOOT_CLEAR = DOT_UP + DOT_D + 26

const EASE = "cubic-bezier(0.33, 1, 0.68, 1)"

/* ------------------------------------------------------------------ render */

/**
 * The widths the primary button takes, measured once from the real strings.
 *
 * A button sized by its content cannot transition, because `auto` is not a
 * length. Measuring every label up front and then animating between those
 * numbers is what lets the button change width with its wording rather than
 * jumping.
 */
function usePillWidths(px: (v: number) => number) {
    const ref = useRef<HTMLDivElement>(null)
    const [widths, setWidths] = useState<number[] | null>(null)
    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const spans = Array.from(el.children) as HTMLElement[]
        // offsetWidth, not getBoundingClientRect: the hero puts a camera
        // transform on an ancestor, and a measured rect comes back scaled by
        // it — so the button's width depended on whether the camera happened
        // to be pushed in when this ran.
        const next = spans.map((s) => s.offsetWidth + px(PILL_PAD) * 2)
        if (next.every((n) => n > 0)) setWidths(next)
    }, [px])
    return { ref, widths }
}

function Pill({
    label,
    primary,
    width,
    px,
    ms,
}: {
    label: string
    primary: boolean
    width?: number
    px: (v: number) => number
    ms: number
}) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: px(PILL_H),
                width,
                padding: width ? undefined : `0 ${px(PILL_PAD)}px`,
                borderRadius: px(PILL_H / 2),
                background: primary ? FILL : "#FFFFFF",
                border: primary ? "none" : `1px solid ${HAIRLINE}`,
                boxSizing: "border-box",
                fontFamily: UBER_TEXT,
                fontSize: px(PILL_SIZE),
                fontWeight: 500,
                color: INK,
                whiteSpace: "nowrap",
                // The width follows the label, so it has to be able to move.
                transition: `width ${ms}ms ${EASE}`,
            }}
        >
            {label}
        </span>
    )
}

export default function UberOfferCard({
    offer,
    index,
    px,
    swapMs,
    animate,
}: {
    offer: Offer
    /** Which of the four, for the pager. */
    index: number
    px: (v: number) => number
    swapMs: number
    animate: boolean
}) {
    const { ref: measureRef, widths } = usePillWidths(px)
    const bleed = offer.media.kind === "bleed" ? offer.media : null
    const inline = offer.media.kind === "inline" ? offer.media : null
    /** Text gives way to the media beside it, when there is any. */
    const textW = inline ? CARD_W - PAD * 3 - inline.w : CARD_W - PAD * 2
    const fade = `opacity ${Math.round(swapMs * 0.42)}ms linear`

    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: px(CARD_W),
                height: px(offer.height),
                borderRadius: px(CARD_R),
                border: `1px solid ${CARD_BORDER}`,
                background: "#FFFFFF",
                boxSizing: "border-box",
                overflow: "hidden",
                fontFamily: UBER_TEXT,
                // The container holds still; only what is in it changes.
                transition: animate ? `height ${swapMs}ms ${EASE}` : "none",
            }}
        >
            {/* Measured off-screen, never shown. */}
            <div
                ref={measureRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    visibility: "hidden",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    fontFamily: UBER_TEXT,
                    fontSize: px(PILL_SIZE),
                    fontWeight: 500,
                }}
            >
                {OFFERS.map((o) => (
                    <span key={o.id}>{o.primary}</span>
                ))}
            </div>

            {bleed && (
                <img
                    key={offer.id}
                    src={bleed.src}
                    alt=""
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                        height: px(bleed.h),
                        objectFit: "cover",
                        display: "block",
                        animation: animate
                            ? `uber-offer-in ${Math.round(swapMs * 0.5)}ms ${EASE} both`
                            : "none",
                    }}
                />
            )}

            <div
                style={{
                    position: "absolute",
                    left: px(PAD),
                    right: px(PAD),
                    top: px(bleed ? bleed.h + PAD : PAD),
                    bottom: px(FOOT_CLEAR),
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {offer.badge && (
                    <span
                        style={{
                            alignSelf: "flex-start",
                            marginBottom: px(10),
                            padding: `${px(5)}px ${px(10)}px`,
                            borderRadius: px(6),
                            background: "#0E6B3D",
                            color: "#FFFFFF",
                            fontSize: px(12.5),
                            fontWeight: 500,
                            animation: animate
                                ? `uber-offer-in ${Math.round(swapMs * 0.5)}ms ${EASE} both`
                                : "none",
                        }}
                    >
                        {offer.badge}
                    </span>
                )}

                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: px(PAD),
                    }}
                >
                    <h3
                        key={`${offer.id}-h`}
                        style={{
                            // The media aligns to the row's top; the
                            // headline's cap sits a few units below it, as
                            // the export has it.
                            margin: `${px(3)}px 0 0`,
                            width: px(textW),
                            fontFamily: UBER_DISPLAY,
                            fontSize: px(HEAD_SIZE),
                            lineHeight: `${px(HEAD_LINE)}px`,
                            fontWeight: 700,
                            letterSpacing: "-0.01em",
                            color: INK,
                            transition: fade,
                        }}
                    >
                        {offer.headline}
                    </h3>
                    {inline && (
                        <img
                            key={offer.id}
                            src={inline.src}
                            alt=""
                            style={{
                                width: px(inline.w),
                                height: px(inline.h),
                                borderRadius: px(8),
                                flexShrink: 0,
                                display: "block",
                                objectFit: "cover",
                                animation: animate
                                    ? `uber-offer-in ${Math.round(swapMs * 0.5)}ms ${EASE} both`
                                    : "none",
                            }}
                        />
                    )}
                </div>

                {offer.body && (
                    <p
                        key={`${offer.id}-b`}
                        style={{
                            margin: `${px(12)}px 0 0`,
                            fontSize: px(BODY_SIZE),
                            lineHeight: `${px(BODY_LINE)}px`,
                            color: "#2B2B2B",
                            transition: fade,
                        }}
                    >
                        {offer.body}
                    </p>
                )}

                {/* The pills sit a fixed distance above the footer, so they
                    hold their place as the copy above them changes length. */}
                <div
                    style={{
                        marginTop: "auto",
                        display: "flex",
                        gap: px(PILL_GAP),
                    }}
                >
                    <Pill
                        label={offer.primary}
                        primary
                        width={widths ? widths[index] : undefined}
                        px={px}
                        ms={swapMs}
                    />
                    <Pill label="Not now" primary={false} px={px} ms={swapMs} />
                </div>

                <div
                    style={{
                        marginTop: px(14),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: px(11.5),
                        color: MUTED,
                    }}
                >
                    <span key={`${offer.id}-d`} style={{ transition: fade }}>
                        {offer.disclaimer}
                    </span>
                    <span
                        style={{
                            padding: `${px(2)}px ${px(5)}px`,
                            borderRadius: px(3),
                            background: "#EFEFEF",
                            color: "#6B6B6B",
                            fontSize: px(10),
                        }}
                    >
                        Ad
                    </span>
                </div>
            </div>

            {/* The pager, against the card's own bottom edge. */}
            {OFFERS.map((_, i) => (
                <span
                    key={i}
                    style={{
                        position: "absolute",
                        left: px(DOT_X + i * DOT_GAP - DOT_D / 2),
                        top: px(offer.height - DOT_UP - DOT_D / 2),
                        width: px(DOT_D),
                        height: px(DOT_D),
                        borderRadius: "50%",
                        background: i === index ? DOT_ON : DOT_OFF,
                        transition: animate
                            ? `background-color ${Math.round(swapMs * 0.3)}ms linear ${Math.round(swapMs * 0.4)}ms, top ${swapMs}ms ${EASE}`
                            : "none",
                    }}
                />
            ))}
        </div>
    )
}
