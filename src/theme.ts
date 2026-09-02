export type ThemeName = "light" | "dark"

export interface Palette {
    /** Page background, behind the hero's padding. */
    background: string
    /** Right panel background. */
    panel: string
    text: string
    /** Muted text — the status line. */
    textMuted: string
    /** Intro link pills and the theme toggle. */
    pill: string
    pillHover: string
    pillGlyph: string
    /**
 * Untitled UI palette steps. The key's fills and their base edges are one step
 * apart on the same ramp, so the edge always reads as a shadow of its face.
 */
    accent: string
    /** Edge each fill presses down into. Always darker than its face. */
    accentBase: string
    /** Fill once the press has been confirmed, and its edge. */
    accentSuccess: string
    accentSuccessBase: string
    /** Text on the accent fill. */
    onAccent: string
    /** Click burst — deliberately opposite the CTA fill on the wheel. */
    burst: string
    /** Hairline rule under the intro links. */
    divider: string
    /** Translucent surface for the toggle, which floats over the hero. */
    floatingSurface: string
    floatingBorder: string
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
        background: "#FCFCFC",
        panel: "#FCFCFC",
        text: "#1F2129",
        textMuted: "#4B4F5C",
        pill: "#EFEFEF",
        pillHover: "#E4E4E4",
        pillGlyph: "#1F2129",
        accent: "#1F2129",
        // Gray 900 — the key's face is Gray 800-ish, so its edge is one step
        // down the same ramp rather than a flat black.
        accentBase: "#101828",
        accentSuccess: "#D0F8AB",
        accentSuccessBase: "#A6EF67",
        onAccent: "#FFFFFF",
        burst: "#F5811F",
        divider: "#F2F4F7",
        floatingSurface: "rgba(255,255,255,0.72)",
        floatingBorder: "rgba(0,0,0,0.08)",
        // Roughly halfway between the original pastels and the vivid set:
        // clearly coloured, but no longer competing with the artwork. Light
        // enough that the card ink stays dark on every one of them.
        cardBackgrounds: [
            "#FFFF80",
            "#FFD280",
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
            "#5A3B02",
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
        pill: "#1C1E23",
        pillHover: "#262930",
        pillGlyph: "#F2F3F5",
        accent: "#F2F3F5",
        accentBase: "#D0D5DD",
        accentSuccess: "#D0F8AB",
        accentSuccessBase: "#A6EF67",
        onAccent: "#0D0E11",
        burst: "#FF9433",
        divider: "#22252C",
        floatingSurface: "rgba(22,24,28,0.72)",
        floatingBorder: "rgba(255,255,255,0.12)",
        // The same five, unchanged: at this saturation they carry on a
        // near-black page without glaring, and the dark card ink still holds.
        cardBackgrounds: [
            "#FFFF80",
            "#FFD280",
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
            "#5A3B02",
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
