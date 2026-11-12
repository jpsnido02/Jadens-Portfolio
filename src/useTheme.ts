import { useEffect, useState } from "react"
import {
    PALETTES,
    preferredTheme,
    readStoredTheme,
    storeTheme,
    type ThemeName,
} from "./theme"

/**
 * Theme state, storage and the document-level side effects. Shared by the home
 * page and the case study pages, which are separate entry points — extracted so
 * the two cannot drift apart.
 */
export const useTheme = () => {
    const [theme, setTheme] = useState<ThemeName>(
        () => readStoredTheme() ?? preferredTheme()
    )
    const palette = PALETTES[theme]

    useEffect(() => {
        storeTheme(theme)
        document.documentElement.dataset.theme = theme
        // Keeps the overscroll gutter and native UI in step with the page.
        document.documentElement.style.colorScheme = theme
        document.body.style.backgroundColor = palette.background
    }, [theme, palette.background])

    const toggle = () =>
        setTheme((current) => (current === "dark" ? "light" : "dark"))

    return { theme, palette, toggle }
}
