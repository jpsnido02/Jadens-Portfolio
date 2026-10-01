import { useEffect, useState } from "react"
import { CONTENT_MAX_WIDTH, FONT_FAMILY } from "./tokens"
import ThemeToggle from "./ThemeToggle"
import UberAdsLoop from "./UberAdsLoop"
import { useTheme } from "./useTheme"
import {
    bySlug,
    type Block,
    type CaseStudy,
    type FigureWidth,
} from "./caseStudies"
import type { Palette } from "./theme"

const CORNER = "superellipse(1.6)"

/** Prose measure. 18px type wants roughly 65 characters a line. */
const PROSE = 660
/** The media column. Wider than the prose, which is what makes it read. */
const COLUMN = 960

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(max-width: 820px)").matches
    )
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 820px)")
        const onChange = () => setIsMobile(mq.matches)
        mq.addEventListener("change", onChange)
        return () => mq.removeEventListener("change", onChange)
    }, [])
    return isMobile
}

/**
 * Each study is tinted with the ink of the card it was opened from, so arriving
 * from the yellow card lands on a page carrying that yellow's ink. On the dark
 * theme the relationship inverts: the card ink is far too dark against a
 * near-black page, so the card's own background does the tinting instead.
 */
const tintOf = (palette: Palette, index: number, isDark: boolean) =>
    isDark
        ? (palette.cardBackgrounds[index] ?? palette.text)
        : (palette.cardInks[index] ?? palette.text)

interface Sizes {
    isMobile: boolean
    title: number
    thesis: number
    sectionThesis: number
    body: number
    caption: number
    label: number
}

const sizesFor = (isMobile: boolean): Sizes => ({
    isMobile,
    // Deliberately short of a hero-scale title. Of the five references this
    // was built from, four keep the whole scale small and let position and
    // labelling carry the hierarchy; only one goes big, as its single flourish.
    title: isMobile ? 30 : 42,
    thesis: isMobile ? 21 : 27,
    sectionThesis: isMobile ? 19 : 22,
    body: isMobile ? 16 : 18,
    caption: 14,
    label: 12,
})

/**
 * Figure numbers, derived in one pure pass over the blocks.
 *
 * This cannot be a counter the child renders share: StrictMode invokes each
 * child's render twice, so a shared mutable counter advances twice per figure
 * and numbers them 2, 4, 6, 8. Computing it here keeps it stable across any
 * number of re-renders. A `layer` holds several figures, so it gets a list.
 */
const numberFigures = (study: CaseStudy): (number | number[] | undefined)[] => {
    let n = 0
    return study.blocks.map((block) => {
        if (!study.numbered) return undefined
        switch (block.kind) {
            case "figure":
            case "figurePair":
            case "animation":
                return ++n
            case "attempt":
                return block.src ? ++n : undefined
            case "layer":
                return block.figures.map(() => ++n)
            default:
                return undefined
        }
    })
}

export default function CaseStudyPage({ slug }: { slug: string }) {
    const { theme, palette, toggle } = useTheme()
    const isMobile = useIsMobile()
    const s = sizesFor(isMobile)
    const study = bySlug(slug)

    if (!study) {
        return (
            <main
                style={{
                    fontFamily: FONT_FAMILY,
                    color: palette.text,
                    padding: 48,
                }}
            >
                <p style={{ fontSize: s.body }}>
                    No case study called “{slug}”.{" "}
                    <a href="../../" style={{ color: palette.text }}>
                        Back to work
                    </a>
                </p>
            </main>
        )
    }

    const tint = tintOf(palette, study.paletteIndex, theme === "dark")
    const next = bySlug(study.next)

    // Continuous numbering across the whole page, like figures in a paper —
    // what ties the media to the prose instead of leaving a stack of sections.
    const numbers = numberFigures(study)

    return (
        <>
            <ThemeToggle theme={theme} palette={palette} onToggle={toggle} />
            <main
                style={{
                    fontFamily: FONT_FAMILY,
                    backgroundColor: palette.background,
                    color: palette.text,
                    minHeight: "100dvh",
                    paddingLeft: `max(${isMobile ? 20 : 40}px, env(safe-area-inset-left))`,
                    paddingRight: `max(${isMobile ? 20 : 40}px, env(safe-area-inset-right))`,
                    paddingBottom: `calc(80px + env(safe-area-inset-bottom))`,
                }}
            >
                <div
                    style={{
                        maxWidth: COLUMN,
                        margin: "0 auto",
                        paddingTop: `calc(${isMobile ? 20 : 28}px + env(safe-area-inset-top))`,
                    }}
                >
                    <TopBar palette={palette} sizes={s} />
                    <Masthead
                        study={study}
                        palette={palette}
                        tint={tint}
                        sizes={s}
                    />

                    {study.blocks.map((block, i) => (
                        <BlockView
                            key={i}
                            block={block}
                            palette={palette}
                            tint={tint}
                            sizes={s}
                            number={numbers[i]}
                        />
                    ))}

                    {next && (
                        <NextLink next={next} palette={palette} sizes={s} />
                    )}
                </div>
            </main>
        </>
    )
}

/* ------------------------------------------------------------------ chrome */

function TopBar({ palette, sizes }: { palette: Palette; sizes: Sizes }) {
    return (
        <div
            style={{
                fontSize: sizes.caption,
                color: palette.textMuted,
                marginBottom: sizes.isMobile ? 40 : 72,
            }}
        >
            {/* Back only. The year used to sit at the right of this row, which
                put it directly underneath the fixed theme toggle on a phone. */}
            <a
                href="../../"
                style={{ color: palette.textMuted, textDecoration: "none" }}
            >
                ← Back
            </a>
        </div>
    )
}

function Masthead({
    study,
    palette,
    tint,
    sizes,
}: {
    study: CaseStudy
    palette: Palette
    tint: string
    sizes: Sizes
}) {
    const meta = [
        ["Client", study.client],
        ["Role", study.role],
        ["Year", study.year],
        ["Duration", study.duration],
    ]
    return (
        <header style={{ marginBottom: sizes.isMobile ? 36 : 56 }}>
            <h1
                style={{
                    fontSize: sizes.title,
                    lineHeight: 1.08,
                    letterSpacing: "-0.025em",
                    fontWeight: 600,
                    marginTop: 0,
                    marginBottom: 0,
                    maxWidth: PROSE + 120,
                }}
            >
                {study.title}
            </h1>
            <dl
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: sizes.isMobile ? "16px 28px" : "16px 48px",
                    marginTop: sizes.isMobile ? 28 : 36,
                    marginBottom: 0,
                }}
            >
                {meta.map(([label, value]) => (
                    <div key={label}>
                        <dt
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: tint,
                                marginBottom: 4,
                            }}
                        >
                            {label}
                        </dt>
                        <dd
                            style={{
                                fontSize: sizes.caption,
                                color: palette.text,
                                marginTop: 0,
                                marginBottom: 0,
                            }}
                        >
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
        </header>
    )
}

function NextLink({
    next,
    palette,
    sizes,
}: {
    next: CaseStudy
    palette: Palette
    sizes: Sizes
}) {
    return (
        <a
            href={`../${next.slug}/`}
            className="cs-next"
            style={{
                display: "block",
                marginTop: sizes.isMobile ? 72 : 120,
                paddingTop: 28,
                borderTop: `1px solid ${palette.cardBorder}`,
                textDecoration: "none",
                color: palette.text,
            }}
        >
            <span
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: palette.textMuted,
                }}
            >
                Next
            </span>
            <span
                style={{
                    display: "block",
                    fontSize: sizes.sectionThesis,
                    marginTop: 10,
                    letterSpacing: "-0.02em",
                }}
            >
                {next.title} →
            </span>
            {/* The next project's thesis, not just its name. Three of the five
                references preview content rather than linking blind. */}
            <span
                style={{
                    display: "block",
                    fontSize: sizes.caption,
                    color: palette.textMuted,
                    marginTop: 6,
                }}
            >
                {next.preview}
            </span>
        </a>
    )
}

/* ------------------------------------------------------------------- media */

const mediaStyle = (width: FigureWidth, isMobile: boolean) => {
    if (isMobile)
        return {
            width: "100%",
            aspectRatio: width === "strip" ? "2.2" : "4 / 3",
        }
    switch (width) {
        case "bleed":
            // Breaks the column and runs to the page's own edges.
            return {
                width: `min(calc(100vw - 80px), ${CONTENT_MAX_WIDTH - 80}px)`,
                marginLeft: `calc(${COLUMN / 2}px - min(calc(50vw - 40px), ${(CONTENT_MAX_WIDTH - 80) / 2}px))`,
                aspectRatio: "16 / 9",
            }
        case "strip":
            // The rhythm-breaker. A page of equal-height media reads as a
            // document; one thin band every few beats reads as a layout.
            return { width: "100%", aspectRatio: "4.4" }
        case "half":
            return { width: "48%", aspectRatio: "4 / 3" }
        default:
            return { width: "100%", aspectRatio: "16 / 10" }
    }
}

function Media({
    src,
    alt,
    width,
    palette,
    isMobile,
}: {
    src?: string
    alt?: string
    width: FigureWidth
    palette: Palette
    isMobile: boolean
}) {
    const box = mediaStyle(width, isMobile)
    return (
        <div
            style={{
                ...box,
                overflow: "hidden",
                borderRadius: 12,
                ...({ cornerShape: CORNER } as object),
                backgroundColor: palette.cardThumbBackground,
                border: `1px solid ${palette.cardBorder}`,
            }}
        >
            {src && (
                <img
                    src={src}
                    alt={alt ?? ""}
                    loading="lazy"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            )}
        </div>
    )
}

function Caption({
    n,
    text,
    palette,
    tint,
    sizes,
}: {
    n?: number
    text?: string
    palette: Palette
    tint: string
    sizes: Sizes
}) {
    if (!text && n === undefined) return null
    return (
        <p
            style={{
                display: "flex",
                gap: 10,
                fontSize: sizes.caption,
                lineHeight: 1.5,
                color: palette.textMuted,
                marginTop: 12,
                marginBottom: 0,
                maxWidth: PROSE,
            }}
        >
            {n !== undefined && (
                <span
                    style={{
                        color: tint,
                        fontWeight: 600,
                        flexShrink: 0,
                        // Tabular figures, so a caption numbered 1 and one
                        // numbered 11 start their text at the same place.
                        fontVariantNumeric: "tabular-nums",
                        minWidth: "1.2em",
                    }}
                >
                    {n}
                </span>
            )}
            {text && <span>{text}</span>}
        </p>
    )
}

/* ------------------------------------------------------------------ blocks */

const stack = (isMobile: boolean) => (isMobile ? 44 : 72)

function BlockView({
    block,
    palette,
    tint,
    sizes,
    number,
}: {
    block: Block
    palette: Palette
    tint: string
    sizes: Sizes
    number?: number | number[]
}) {
    const gap = stack(sizes.isMobile)
    // Longhands only. React warns when a `margin` shorthand and a
    // `marginTop` longhand set the same value on one element, which is easy to
    // do once a shared style object is spread into several blocks.
    const wrap = { marginTop: gap, marginBottom: 0 }
    const bodyStyle = {
        fontSize: sizes.body,
        lineHeight: 1.6,
        color: palette.textMuted,
        maxWidth: PROSE,
        marginTop: 0,
        marginBottom: 0,
    }
    const labelStyle = {
        fontSize: sizes.label,
        fontWeight: 600 as const,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: tint,
        marginTop: 0,
        marginBottom: 0,
    }

    switch (block.kind) {
        case "abstract":
            return (
                <p
                    style={{
                        ...bodyStyle,
                        ...wrap,
                        color: palette.text,
                        fontSize: sizes.isMobile ? 17 : 19,
                    }}
                >
                    {block.text}
                </p>
            )

        case "thesis":
            return (
                <p
                    style={{
                        ...wrap,
                        fontSize: sizes.thesis,
                        lineHeight: 1.3,
                        letterSpacing: "-0.02em",
                        color: palette.text,
                        maxWidth: PROSE + 60,
                        marginTop: gap,
                        marginBottom: 0,
                    }}
                >
                    {block.text}
                </p>
            )

        case "confidential":
            return (
                <p
                    style={{
                        ...bodyStyle,
                        marginTop: sizes.isMobile ? 24 : 32,
                        fontSize: sizes.caption,
                        fontStyle: "italic",
                    }}
                >
                    {block.text}
                </p>
            )

        case "section":
            return (
                <section style={wrap}>
                    <p style={labelStyle}>{block.label}</p>
                    {block.thesis && (
                        <p
                            style={{
                                fontSize: sizes.sectionThesis,
                                lineHeight: 1.35,
                                letterSpacing: "-0.015em",
                                color: palette.text,
                                maxWidth: PROSE,
                                marginTop: 14,
                                marginBottom: 0,
                            }}
                        >
                            {block.thesis}
                        </p>
                    )}
                    {block.body && (
                        <p style={{ ...bodyStyle, marginTop: 14 }}>
                            {block.body}
                        </p>
                    )}
                </section>
            )

        case "animation": {
            const n = typeof number === "number" ? number : undefined
            const box = mediaStyle(block.width, sizes.isMobile)
            return (
                <figure style={{ ...wrap }}>
                    <div
                        style={{ width: box.width, marginLeft: box.marginLeft }}
                    >
                        <UberAdsLoop />
                    </div>
                    <figcaption>
                        <Caption
                            n={n}
                            text={block.caption}
                            palette={palette}
                            tint={tint}
                            sizes={sizes}
                        />
                    </figcaption>
                </figure>
            )
        }

        case "figure": {
            const n = typeof number === "number" ? number : undefined
            return (
                <figure style={{ ...wrap, marginTop: gap, marginBottom: 0 }}>
                    <Media
                        src={block.src}
                        alt={block.alt}
                        width={block.width}
                        palette={palette}
                        isMobile={sizes.isMobile}
                    />
                    <figcaption>
                        <Caption
                            n={n}
                            text={block.caption}
                            palette={palette}
                            tint={tint}
                            sizes={sizes}
                        />
                    </figcaption>
                </figure>
            )
        }

        case "figurePair": {
            const n = typeof number === "number" ? number : undefined
            return (
                <figure style={{ ...wrap, marginTop: gap, marginBottom: 0 }}>
                    <div
                        style={{
                            display: "flex",
                            gap: sizes.isMobile ? 12 : 24,
                            flexDirection: sizes.isMobile ? "column" : "row",
                        }}
                    >
                        {block.items.map((item, i) => (
                            <div key={i} style={{ flex: 1 }}>
                                <Media
                                    src={item.src}
                                    alt={item.alt}
                                    width="full"
                                    palette={palette}
                                    isMobile={sizes.isMobile}
                                />
                            </div>
                        ))}
                    </div>
                    <figcaption>
                        <Caption
                            n={n}
                            text={block.caption}
                            palette={palette}
                            tint={tint}
                            sizes={sizes}
                        />
                    </figcaption>
                </figure>
            )
        }

        case "attempt": {
            const n = typeof number === "number" ? number : undefined
            return (
                <section style={wrap}>
                    <p
                        style={{
                            ...labelStyle,
                            // The winner is the only one that takes the page's
                            // full-contrast ink; the dead ends stay tinted.
                            color: block.won ? palette.text : tint,
                        }}
                    >
                        {block.label}
                    </p>
                    <p style={{ ...bodyStyle, marginTop: 14 }}>{block.body}</p>
                    {block.reasons && (
                        <ol
                            style={{
                                ...bodyStyle,
                                marginTop: 16,
                                paddingLeft: 0,
                                listStyle: "none",
                            }}
                        >
                            {block.reasons.map((reason, i) => (
                                <li
                                    key={i}
                                    style={{
                                        display: "flex",
                                        gap: 12,
                                        marginTop: i ? 8 : 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: tint,
                                            fontWeight: 600,
                                            flexShrink: 0,
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span>{reason}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                    {block.src && (
                        <figure style={{ marginTop: 24, marginBottom: 0 }}>
                            <Media
                                src={block.src}
                                width={block.won ? "full" : "half"}
                                palette={palette}
                                isMobile={sizes.isMobile}
                            />
                            <figcaption>
                                <Caption
                                    n={n}
                                    palette={palette}
                                    tint={tint}
                                    sizes={sizes}
                                />
                            </figcaption>
                        </figure>
                    )}
                </section>
            )
        }

        case "insights":
            return (
                <ul
                    style={{
                        ...wrap,
                        listStyle: "none",
                        padding: 0,
                        marginTop: gap,
                        marginBottom: 0,
                        display: "grid",
                        gap: sizes.isMobile ? 16 : 24,
                        gridTemplateColumns: sizes.isMobile
                            ? "1fr"
                            : `repeat(${Math.min(block.items.length, 3)}, 1fr)`,
                    }}
                >
                    {block.items.map((item, i) => (
                        <li key={i}>
                            <span
                                style={{
                                    display: "block",
                                    height: 2,
                                    width: 28,
                                    backgroundColor: tint,
                                    marginBottom: 14,
                                }}
                            />
                            {/* Noun phrases, not sentences. Shorter reads as
                                a finding; a sentence reads as a paragraph. */}
                            <span
                                style={{
                                    fontSize: sizes.body,
                                    lineHeight: 1.4,
                                    color: palette.text,
                                }}
                            >
                                {item}
                            </span>
                        </li>
                    ))}
                </ul>
            )

        case "criteria":
            return (
                <ol
                    style={{
                        ...wrap,
                        listStyle: "none",
                        padding: 0,
                        marginTop: gap,
                        marginBottom: 0,
                        display: "grid",
                        gap: sizes.isMobile ? 24 : 32,
                        gridTemplateColumns: sizes.isMobile
                            ? "1fr"
                            : `repeat(${block.items.length}, 1fr)`,
                    }}
                >
                    {block.items.map((item, i) => (
                        <li key={i}>
                            <span
                                style={{
                                    fontSize: sizes.caption,
                                    fontWeight: 600,
                                    color: tint,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <span
                                style={{
                                    display: "block",
                                    fontSize: sizes.sectionThesis,
                                    letterSpacing: "-0.015em",
                                    color: palette.text,
                                    marginTop: 6,
                                    marginBottom: 8,
                                }}
                            >
                                {item.word}
                            </span>
                            <span
                                style={{
                                    fontSize: sizes.caption,
                                    lineHeight: 1.5,
                                    color: palette.textMuted,
                                }}
                            >
                                {item.question}
                            </span>
                        </li>
                    ))}
                </ol>
            )

        case "layer":
            return (
                <section style={wrap}>
                    <p style={labelStyle}>{block.name}</p>
                    <p
                        style={{
                            fontSize: sizes.sectionThesis,
                            lineHeight: 1.35,
                            letterSpacing: "-0.015em",
                            color: palette.text,
                            maxWidth: PROSE,
                            marginTop: 14,
                            marginBottom: 0,
                        }}
                    >
                        {block.thesis}
                    </p>
                    <div
                        style={{
                            display: "flex",
                            gap: sizes.isMobile ? 12 : 24,
                            flexDirection: sizes.isMobile ? "column" : "row",
                            marginTop: 28,
                        }}
                    >
                        {block.figures.map((fig, i) => {
                            const n = Array.isArray(number)
                                ? number[i]
                                : undefined
                            return (
                                <figure
                                    key={i}
                                    style={{
                                        flex: 1,
                                        marginTop: 0,
                                        marginBottom: 0,
                                    }}
                                >
                                    <Media
                                        src={fig.src}
                                        alt={fig.alt}
                                        width="full"
                                        palette={palette}
                                        isMobile={sizes.isMobile}
                                    />
                                    <figcaption>
                                        <Caption
                                            n={n}
                                            text={fig.caption}
                                            palette={palette}
                                            tint={tint}
                                            sizes={sizes}
                                        />
                                    </figcaption>
                                </figure>
                            )
                        })}
                    </div>
                </section>
            )

        case "quote":
            return (
                <blockquote
                    style={{
                        ...wrap,
                        marginTop: gap,
                        marginBottom: 0,
                        maxWidth: PROSE + 60,
                    }}
                >
                    {/* The accent sits above rather than alongside: a border
                        on the left would indent the quote off the page's edge. */}
                    <span
                        style={{
                            display: "block",
                            height: 2,
                            width: 28,
                            backgroundColor: tint,
                            marginBottom: 18,
                        }}
                    />
                    <p
                        style={{
                            fontSize: sizes.sectionThesis,
                            lineHeight: 1.45,
                            letterSpacing: "-0.015em",
                            color: palette.text,
                            marginTop: 0,
                            marginBottom: 0,
                        }}
                    >
                        “{block.text}”
                    </p>
                    <footer
                        style={{
                            fontSize: sizes.caption,
                            color: palette.textMuted,
                            marginTop: 14,
                        }}
                    >
                        {block.who} — {block.role}
                    </footer>
                </blockquote>
            )

        case "numbers":
            return (
                <div
                    style={{
                        ...wrap,
                        display: "grid",
                        gap: sizes.isMobile ? 28 : 40,
                        gridTemplateColumns: sizes.isMobile
                            ? "1fr 1fr"
                            : `repeat(${block.items.length}, auto)`,
                        justifyContent: "start",
                    }}
                >
                    {block.items.map((item, i) => (
                        <div key={i}>
                            <span
                                style={{
                                    display: "block",
                                    fontSize: sizes.isMobile ? 32 : 44,
                                    fontWeight: 600,
                                    letterSpacing: "-0.03em",
                                    lineHeight: 1,
                                    color: tint,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {item.value}
                            </span>
                            <span
                                style={{
                                    display: "block",
                                    fontSize: sizes.caption,
                                    color: palette.textMuted,
                                    marginTop: 10,
                                    maxWidth: 180,
                                }}
                            >
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            )

        case "splitOutcome":
            return (
                <div
                    style={{
                        ...wrap,
                        display: "grid",
                        gap: sizes.isMobile ? 32 : 48,
                        gridTemplateColumns: sizes.isMobile ? "1fr" : "1fr 1fr",
                        maxWidth: COLUMN,
                    }}
                >
                    {[
                        ["Business result", block.business],
                        ["Design contribution", block.design],
                    ].map(([heading, items]) => (
                        <div key={heading as string}>
                            <p style={labelStyle}>{heading as string}</p>
                            <ul
                                style={{
                                    listStyle: "none",
                                    padding: 0,
                                    marginTop: 16,
                                    marginBottom: 0,
                                }}
                            >
                                {(items as string[]).map((item, i) => (
                                    <li
                                        key={i}
                                        style={{
                                            fontSize: sizes.body,
                                            lineHeight: 1.5,
                                            color: palette.textMuted,
                                            paddingTop: i ? 12 : 0,
                                            marginTop: i ? 12 : 0,
                                            borderTop: i
                                                ? `1px solid ${palette.cardBorder}`
                                                : undefined,
                                        }}
                                    >
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )

        case "takeaway":
            return (
                <section style={{ ...wrap, maxWidth: PROSE }}>
                    <h2
                        style={{
                            // Same size as the body copy it sits above. The
                            // hierarchy is carried by weight and colour, not
                            // scale — the restraint is the point.
                            fontSize: sizes.body,
                            fontWeight: 600,
                            lineHeight: 1.4,
                            color: palette.text,
                            marginTop: 0,
                            marginBottom: 0,
                        }}
                    >
                        {block.title}
                    </h2>
                    <p style={{ ...bodyStyle, marginTop: 10 }}>{block.body}</p>
                </section>
            )

        case "wip":
            return (
                <section
                    style={{
                        ...wrap,
                        maxWidth: PROSE,
                        padding: sizes.isMobile ? 20 : 24,
                        borderRadius: 12,
                        ...({ cornerShape: CORNER } as object),
                        border: `1px solid ${palette.cardBorder}`,
                    }}
                >
                    <p style={labelStyle}>Still moving</p>
                    <p style={{ ...bodyStyle, marginTop: 12 }}>{block.text}</p>
                </section>
            )

        case "appendix":
            return (
                <section style={{ ...wrap, maxWidth: PROSE }}>
                    <h2
                        style={{
                            fontSize: sizes.body,
                            fontWeight: 600,
                            lineHeight: 1.4,
                            color: tint,
                            marginTop: 0,
                            marginBottom: 0,
                        }}
                    >
                        {block.title}
                    </h2>
                    <p style={{ ...bodyStyle, marginTop: 10 }}>{block.body}</p>
                </section>
            )
    }
}
