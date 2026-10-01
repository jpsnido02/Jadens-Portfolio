export type ThemeName = "light" | "dark"

export interface Palette {
    /** Page background, behind the hero's padding. */
    background: string
    /** Right panel background. */
    panel: string
    text: string
    /** Muted text — the status line. */
    textMuted: string
    /**
     * The key is a surface, not a coloured slab: a near-page fill, a hairline
     * border and a small ambient shadow, so it reads as a raised card of the
     * page rather than a primary action competing with the project cards.
     * Colour is held back entirely for the confirmed state.
     */
    key: {
        fill: string
        fillHover: string
        fillPressed: string
        border: string
        borderHover: string
        ink: string
        inkHover: string
        shadow: string
        shadowHover: string
        shadowPressed: string
    }
    accent: string
    /** Hover fill — one step along the same ramp, toward more contrast. */
    accentBase: string
    /** Fill once the press has been confirmed. */
    accentSuccess: string
    /** Text on the accent fill, and on the success fill. Dark in the light
     * theme, white in the dark one — which is what sets each theme's fills. */
    onAccent: string
    onAccentSuccess: string
    /** Click burst — deliberately opposite the CTA fill on the wheel. */
    burst: string
    /** Cycled across the project cards. */
    cardBackgrounds: string[]
    /** One ink per card, index-matched to cardBackgrounds. */
    cardInks: string[]
    /**
     * One border per card, index-matched. It tracks the page, or it stops
     * being an edge: the old #E4E7EC read 1.19:1 against Gray 50 but only
     * 1.06:1 against a darker ground. This holds 1.18:1 against the page and
     * 1.31:1 against the card, so it reads from both sides.
     */
    cardCardBorders: string[]
    /**
     * One accent per card: the partner's primary brand colour, used on the
     * card's click affordance. Darkened where the raw brand colour cannot
     * carry text on white.
     */
    cardAccents: string[]
    cardText: string
    cardTextMuted: string
    /** Hairline around the card thumbnail, and the plate behind it. */
    cardBorder: string
    cardThumbBackground: string
}

export const PALETTES: Record<ThemeName, Palette> = {
    light: {
        // A cool light grey, still under ink that is already a blue-black —
        // a neutral ground under #1F2129 reads faintly mismatched. Darker
        // than the Gray 50 it was: against that a white card separated by
        // only 1.05:1 and disappeared on a poor screen. This sits about
        // halfway to the point where it stops reading as a light page at
        // all — 1.11:1, roughly double the old step.
        background: "#F1F3F7",
        panel: "#F1F3F7",
        text: "#1F2129",
        textMuted: "#4B4F5C",
        key: {
            // The page's own colour, so the key reads as a raised piece of the
            // page rather than a whiter card sitting on it. The hairline and
            // the shadow are the whole of its definition; the fill only moves
            // on press, and then only by one cool step.
            fill: "#F1F3F7",
            fillHover: "#F1F3F7",
            fillPressed: "#EFF1F5",
            border: "rgba(0,0,0,0.1)",
            borderHover: "rgba(0,0,0,0.15)",
            ink: "rgba(0,0,0,0.85)",
            inkHover: "rgba(0,0,0,0.65)",
            shadow: "rgba(0,0,0,0.02) 0 1px 3px 0",
            shadowHover: "rgba(0,0,0,0.1) 0 4px 12px",
            shadowPressed: "rgba(0,0,0,0.06) 0 2px 4px",
        },
        accent: "#175CD3",
        accentBase: "#1849A9",
        // Teal 700 — the blue-green the success state was asked for, and the
        // only colour the key ever shows. 5.6:1 under white, 5.4:1 against the
        // page, so the reward is the one state that carries any hue at all.
        accentSuccess: "#107569",
        onAccent: "#FFFFFF",
        onAccentSuccess: "#FFFFFF",
        burst: "#F5811F",
        // Seven, one per project: the card colour is indexed by the same
        // modulus as the project data, so the two array lengths have to match
        // or a project's colour drifts on each loop of the scroll.
        // Roughly halfway between the original pastels and the vivid set:
        // clearly coloured, but no longer competing with the artwork. Light
        // enough that the card ink stays dark on every one of them.
        cardBackgrounds: [
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
        ],
        // Accents are index-matched to position, so they are re-ordered with
        // the projects — otherwise reordering hands Uber Eats the Macy's red.
        // In order: Uber Eats, McDonald's, Macy's, the agent tool, Branded
        // Layouts, the Rokt prototype tool, Expedia.
        //
        // The agent tool's accent is purple rather than the Home
        // Depot orange its hero demos on — the project is the agent, not the
        // partner, and purple carries the generated-rather-than-drawn idea.
        // Index 3 moved to teal to leave it unique.
        //
        // The cards are white with a hairline a step darker than the page, and
        // carry no brand colour themselves. Every attempt at tinting them —
        // pastel, muted, deep, brand-lightened — put a coloured ground behind
        // a coloured logo, which is the thing that kept reading badly. The
        // brand now arrives twice instead: in the app icon, and in the accent
        // on "View Project".

        cardInks: [
            "#1F2129",
            "#1F2129",
            "#1F2129",
            "#1F2129",
            "#1F2129",
            "#1F2129",
            "#1F2129",
        ],
        cardCardBorders: [
            "#DCE1EA",
            "#DCE1EA",
            "#DCE1EA",
            "#DCE1EA",
            "#DCE1EA",
            "#DCE1EA",
            "#DCE1EA",
        ],
        cardAccents: [
            "#048849",
            "#976F00",
            "#E21A2C",
            "#7C3AED",
            "#0F766E",
            "#B22473",
            "#1668E3",
        ],
        cardText: "#1F2129",
        cardTextMuted: "#2A2D36",
        cardBorder: "rgba(0,0,0,0.16)",
        cardThumbBackground: "#EFEFEF",
    },
    dark: {
        background: "#0D0E11",
        panel: "#0D0E11",
        text: "#F2F3F5",
        textMuted: "#9BA1AC",
        key: {
            // The same idea inverted: the page's own colour, defined by its
            // hairline. A shadow does almost nothing on a near-black ground,
            // so here the border carries the edge on its own.
            fill: "#0D0E11",
            fillHover: "#0D0E11",
            fillPressed: "#171A1F",
            border: "rgba(255,255,255,0.22)",
            borderHover: "rgba(255,255,255,0.34)",
            ink: "rgba(255,255,255,0.92)",
            inkHover: "rgba(255,255,255,0.7)",
            shadow: "rgba(0,0,0,0.4) 0 1px 3px 0",
            shadowHover: "rgba(0,0,0,0.55) 0 4px 12px",
            shadowPressed: "rgba(0,0,0,0.5) 0 2px 4px",
        },
        accent: "#53B1FD",
        accentBase: "#84CAFF",
        // Unchanged: on a near-black page the lime is 16.3:1 and already
        // matches the light-blue resting fill's weight. Only light mode broke.
        // Teal 400, the same blue-green taken light so it carries dark ink on
        // this page the way the rest of the dark palette does. 10.2:1.
        accentSuccess: "#2ED3B7",
        onAccent: "#0D0E11",
        onAccentSuccess: "#0D0E11",
        burst: "#FF9433",
        // The same seven, unchanged: at this saturation they carry on a
        // near-black page without glaring, and the dark card ink still holds.
        cardBackgrounds: [
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
            "#FFFFFF",
        ],
        // Accents are index-matched to position, so they are re-ordered with
        // the projects — otherwise reordering hands Uber Eats the Macy's red.
        // In order: Uber Eats, McDonald's, Macy's, the agent tool, Branded
        // Layouts, the Rokt prototype tool, Expedia.
        //
        // The agent tool's accent is purple rather than the Home
        // Depot orange its hero demos on — the project is the agent, not the
        // partner, and purple carries the generated-rather-than-drawn idea.
        // Index 3 moved to teal to leave it unique.
        //
        // The cards are white with a hairline a step darker than the page, and
        // carry no brand colour themselves. Every attempt at tinting them —
        // pastel, muted, deep, brand-lightened — put a coloured ground behind
        // a coloured logo, which is the thing that kept reading badly. The
        // brand now arrives twice instead: in the app icon, and in the accent
        // on "View Project".

        cardInks: [
            "#1F2129",
            "#1F2129",
            "#1F2129",
            "#1F2129",
            "#1F2129",
            "#1F2129",
            "#1F2129",
        ],
        cardCardBorders: [
            "#DCE1EA",
            "#DCE1EA",
            "#DCE1EA",
            "#DCE1EA",
            "#DCE1EA",
            "#DCE1EA",
            "#DCE1EA",
        ],
        cardAccents: [
            "#048849",
            "#976F00",
            "#E21A2C",
            "#7C3AED",
            "#0F766E",
            "#B22473",
            "#1668E3",
        ],
        cardText: "#1F2129",
        cardTextMuted: "#2A2D36",
        cardBorder: "rgba(0,0,0,0.18)",
        cardThumbBackground: "#EAEAEA",
    },
}

const STORAGE_KEY = "portfolio-theme"

export const readStoredTheme = (): ThemeName | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored === "light" || stored === "dark" ? stored : null
    } catch {
        return null
    }
}

export const storeTheme = (theme: ThemeName) => {
    try {
        localStorage.setItem(STORAGE_KEY, theme)
    } catch {
        // Private browsing and blocked site data both throw; the toggle still
        // works for this session.
    }
}

export const preferredTheme = (): ThemeName =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
