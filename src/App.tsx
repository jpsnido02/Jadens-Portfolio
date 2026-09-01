import { useEffect, useState } from "react"
import PortfolioScroll from "./PortfolioScroll"
import { intro, projects } from "./content"
import {
    PALETTES,
    preferredTheme,
    readStoredTheme,
    storeTheme,
    type ThemeName,
} from "./theme"

export default function App() {
    const [theme, setTheme] = useState<ThemeName>(
        () => readStoredTheme() ?? preferredTheme()
    )
    const [toggleHovered, setToggleHovered] = useState(false)
    const palette = PALETTES[theme]

    useEffect(() => {
        storeTheme(theme)
        document.documentElement.dataset.theme = theme
        // Keeps the overscroll gutter and native UI in step with the page.
        document.documentElement.style.colorScheme = theme
        document.body.style.backgroundColor = palette.background
    }, [theme, palette.background])

    return (
        <>
            <PortfolioScroll
                projects={projects}
                introHeadline={intro.headline}
                ctaWords={intro.ctaWords}
                introTagline={intro.tagline}
                introLinks={intro.links}
                palette={palette}
            />
            <button
                type="button"
                onClick={() =>
                    setTheme((current) =>
                        current === "dark" ? "light" : "dark"
                    )
                }
                onMouseEnter={() => setToggleHovered(true)}
                onMouseLeave={() => setToggleHovered(false)}
                aria-label={
                    theme === "dark"
                        ? "Switch to light mode"
                        : "Switch to dark mode"
                }
                aria-pressed={theme === "dark"}
                style={{
                    position: "fixed",
                    // Clears the status bar and Dynamic Island; the page opts
                    // into the full screen with viewport-fit=cover.
                    top: "calc(16px + env(safe-area-inset-top))",
                    right: "calc(16px + env(safe-area-inset-right))",
                    zIndex: 50,
                    width: 44,
                    height: 36,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    borderRadius: 999,
                    // The toggle floats over the hero on mobile, so it needs a
                    // surface of its own rather than the panel colour.
                    backgroundColor: palette.floatingSurface,
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: `1px solid ${palette.floatingBorder}`,
                    color: palette.text,
                    cursor: "pointer",
                    transition:
                        "transform 160ms ease, background-color 160ms ease",
                    transform: toggleHovered
                        ? "translateY(-1px)"
                        : "translateY(0px)",
                }}
            >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
        </>
    )
}

function SunIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ display: "block" }}
        >
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M6.5 6.5 4.9 4.9M19.1 19.1l-1.6-1.6M17.5 6.5l1.6-1.6M4.9 19.1l1.6-1.6" />
        </svg>
    )
}

function MoonIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "block" }}
        >
            <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.4 8.4 0 1 0 9.4 9.4Z" />
        </svg>
    )
}
