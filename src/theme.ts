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
 * Untitled UI palette steps. The key's fills and their base edges are one step
 * apart on the same ramp, so the edge always reads as a shadow of its face.
 */
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
        // The key inverts against its own page: dark fill here, light fill in
        // the dark theme. That is what buys the contrast — dark ink on a
        // near-white page confines every fill to a luminance band 0.043 wide,
        // too narrow for three states to look different from one another.
        // White ink opens the band to 0.05-0.183 and roughly doubles both
        // measures. Blue 700 rest, Blue 800 hover: a visible step, not a nudge.
        accent: "#175CD3",
        accentBase: "#1849A9",
        // 0.135 against the rest fill's 0.125 — confirming changes hue and
        // essentially nothing else.
        accentSuccess: "#067647",
        onAccent: "#FFFFFF",
        onAccentSuccess: "#FFFFFF",
        burst: "#F5811F",
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
        // Light fill, dark ink — the inversion of the light theme, for the
        // same reason. A white-labelled fill on a near-black page is capped at
        // 0.183 luminance and tops out around 4.2:1 against the page; going
        // the other way reaches 8.3:1 on both the label and the chip. Hover
        // brightens to Blue 300, a full 0.14 of luminance — unmissable.
        accent: "#53B1FD",
        accentBase: "#84CAFF",
        // Unchanged: on a near-black page the lime is 16.3:1 and already
        // matches the light-blue resting fill's weight. Only light mode broke.
        // 0.421 against the rest fill's 0.404, matching the light theme's
        // near-zero delta, so the press reads the same way in both.
        accentSuccess: "#32C48D",
        onAccent: "#0D0E11",
        onAccentSuccess: "#0D0E11",
        burst: "#FF9433",
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
