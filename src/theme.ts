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
    cardText: string
    cardTextMuted: string
    /** Hairline around the card thumbnail, and the plate behind it. */
    cardBorder: string
    cardThumbBackground: string
}

export const PALETTES: Record<ThemeName, Palette> = {
    light: {
        // Gray 50 — a cool white, to sit under ink that is already a
        // blue-black. A neutral ground under #1F2129 reads faintly mismatched.
        background: "#F9FAFB",
        panel: "#F9FAFB",
        text: "#1F2129",
        textMuted: "#4B4F5C",
        key: {
            // The page's own colour, so the key reads as a raised piece of the
            // page rather than a whiter card sitting on it. The hairline and
            // the shadow are the whole of its definition; the fill only moves
            // on press, and then only by one cool step.
            fill: "#F9FAFB",
            fillHover: "#F9FAFB",
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
            "#FFFF80",
            "#B4ECD2",
            "#FFC1B5",
            "#FFD3FB",
            "#CC99E6",
            "#4DFFA5",
            "#7FFFD4",
        ],
        // Each card's text is that card's own hue taken dark — never a
        // neutral. It is what stops six colours reading as six unrelated
        // stickers. The Uber Eats pair is #B4ECD2 / #022518: 12.4:1 at full
        // ink and 8.3:1 through the 0.85 knock-down the card text uses.
        cardInks: [
            "#5A5A02",
            "#022518",
            "#5A1002",
            "#5A0252",
            "#361348",
            "#025A2D",
            "#025A3C",
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
            "#FFFF80",
            "#B4ECD2",
            "#FFC1B5",
            "#FFD3FB",
            "#CC99E6",
            "#4DFFA5",
            "#7FFFD4",
        ],
        // Each card's text is that card's own hue taken dark — never a
        // neutral. It is what stops seven colours reading as seven unrelated
        // stickers. All clear 6.5:1.
        cardInks: [
            "#5A5A02",
            "#022518",
            "#5A1002",
            "#5A0252",
            "#361348",
            "#025A2D",
            "#025A3C",
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
