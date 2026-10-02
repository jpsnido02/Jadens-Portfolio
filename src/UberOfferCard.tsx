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
        claim: { x: 32, y: 629 },
        notNow: { x: 160, y: 629 },
    },
    {
        id: "starbucks",
        label: "Starbucks",
        badge: "Buy 1 get 1",
        media: { kind: "none" },
        headline: "Breakfast's coming. Coffee next?",
        body: "Your Lenwich breakfast is on the way, keep the morning going with Starbucks.",
        primary: "Add to Order",
        disclaimer: "Availability varies by location.",
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
/* Every gap in the card is stated, so none of them depends on how much room
 * happens to be left over. */
/** Copy to buttons. */
const CTA_GAP = 8
/** Buttons to the disclaimer. */
const DISC_GAP = 6
/** Headline to body, with media beside the headline and without. */
const BODY_GAP_MEDIA = 12
const BODY_GAP_BARE = 4
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
 * Room the content leaves under itself for the pager, which hangs off the
 * card's bottom edge rather than flowing after the disclaimer.
 */
const PAGER_ROOM = DOT_UP + DOT_D + 8

const EASE = "cubic-bezier(0.33, 1, 0.68, 1)"

/**
 * The height the card takes for what is currently in it.
 *
 * The container is the one thing that carries across all four offers, so it
 * has to move between their heights rather than jump — and a transition needs
 * two lengths, which `auto` is not. So the content is laid out freely, its
 * own height is read back, and that number is what the card is set to: the
 * height follows the copy without the copy having to be measured by hand.
 */
function useContentHeight(deps: unknown[]) {
    const ref = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState<number | null>(null)
    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        // offsetTop/offsetHeight, not a measured rect: the hero puts a
        // camera transform on an ancestor, and a rect comes back scaled by
        // it. offsetTop is against the card, which is the positioned
        // parent, and it counts the bleed media's margin.
        // offsetTop is measured from the card's padding edge, so the
        // card's own hairline has to be added back on both sides for a
        // border-box height.
        const next = el.offsetTop + el.offsetHeight + 2
        if (next > 0) setHeight(next)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return { ref, height }
}

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
    tapKey,
}: {
    label: string
    primary: boolean
    width?: number
    px: (v: number) => number
    ms: number
    /** Set when this button is the one being pressed; changes to replay. */
    tapKey?: number
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
                position: "relative",
            }}
        >
            {label}
            {/* The press, drawn on the button rather than at a coordinate
                worked out from the card's height. */}
            {tapKey !== undefined && (
                <span
                    key={tapKey}
                    className="uber-tap"
                    style={{
                        left: "50%",
                        top: "50%",
                        width: px(44),
                        height: px(44),
                        marginLeft: px(-22),
                        marginTop: px(-22),
                    }}
                />
            )}
        </span>
    )
}

export default function UberOfferCard({
    offer,
    index,
    px,
    swapMs,
    animate,
    tap,
    tapKey,
}: {
    offer: Offer
    /** Which of the four, for the pager. */
    index: number
    px: (v: number) => number
    swapMs: number
    animate: boolean
    /** Which button is being pressed, if either. */
    tap?: "claim" | "notNow" | null
    tapKey?: number
}) {
    const { ref: measureRef, widths } = usePillWidths(px)
    const bleed = offer.media.kind === "bleed" ? offer.media : null
    const inline = offer.media.kind === "inline" ? offer.media : null
    /** Text gives way to the media beside it, when there is any. */
    const textW = inline ? CARD_W - PAD * 3 - inline.w : CARD_W - PAD * 2
    const fade = `opacity ${Math.round(swapMs * 0.42)}ms linear`
    // Re-read once the buttons have their measured widths, since until then
    // the row is laid out at its intrinsic size.
    const { ref: contentRef, height } = useContentHeight([offer.id, px, widths])

    return (
        <div
            style={{
                // In flow and as tall as what is in it, so the page below
                // follows it without anyone having to know its height.
                position: "relative",
                width: px(CARD_W),
                borderRadius: px(CARD_R),
                border: `1px solid ${CARD_BORDER}`,
                background: "#FFFFFF",
                boxSizing: "border-box",
                overflow: "hidden",
                fontFamily: UBER_TEXT,
                // Set, not auto, so the one thing that carries across the
                // four offers can move between their heights.
                height: height ?? undefined,
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
                ref={contentRef}
                style={{
                    padding: `${px(bleed ? 0 : PAD)}px ${px(PAD)}px ${px(PAGER_ROOM)}px`,
                    marginTop: px(bleed ? bleed.h + PAD : 0),
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

                {/* Centred against the media rather than topped out with
                    it: the headline is one or two lines and the media is a
                    fixed block, so aligning their tops left whichever was
                    shorter hanging. */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: px(PAD),
                    }}
                >
                    <h3
                        key={`${offer.id}-h`}
                        style={{
                            // The media aligns to the row's top; the
                            // headline's cap sits a few units below it, as
                            // the export has it.
                            margin: 0,
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
                            margin: `${px(inline ? BODY_GAP_MEDIA : BODY_GAP_BARE)}px 0 0`,
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
                        marginTop: px(CTA_GAP),
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
                        tapKey={tap === "claim" ? tapKey : undefined}
                    />
                    <Pill
                        label="Not now"
                        primary={false}
                        px={px}
                        ms={swapMs}
                        tapKey={tap === "notNow" ? tapKey : undefined}
                    />
                </div>

                <div
                    style={{
                        marginTop: px(DISC_GAP),
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
                        bottom: px(DOT_UP - DOT_D / 2),
                        width: px(DOT_D),
                        height: px(DOT_D),
                        borderRadius: "50%",
                        background: i === index ? DOT_ON : DOT_OFF,
                        // No delay: the dots are anchored to the card's
                        // bottom edge, so they travel with the height, and
                        // the one that lights up should be moving with them
                        // rather than catching up afterwards.
                        transition: animate
                            ? `background-color ${Math.round(swapMs * 0.45)}ms linear`
                            : "none",
                    }}
                />
            ))}
        </div>
    )
}
