import { useState } from "react"
import { SiteIcon } from "./icons"
import { CONTENT_MAX_WIDTH } from "./tokens"
import type { Palette, ThemeName } from "./theme"

interface ThemeToggleProps {
    theme: ThemeName
    palette: Palette
    onToggle: () => void
}

/**
 * The only control on the site that floats above the content layer, which is
 * why it is the only thing wearing Liquid Glass. Shared by the home page and
 * the case study pages.
 */
export default function ThemeToggle({
    theme,
    palette,
    onToggle,
}: ThemeToggleProps) {
    const [hovered, setHovered] = useState(false)
    const [pressed, setPressed] = useState(false)

    return (
        <button
            type="button"
            onClick={onToggle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false)
                setPressed(false)
            }}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            aria-pressed={theme === "dark"}
            className="glass"
            style={{
                position: "fixed",
                // Clears the status bar and Dynamic Island; the page opts into
                // the full screen with viewport-fit=cover.
                top: "calc(16px + env(safe-area-inset-top))",
                // Tracks the centred content's right edge rather than the
                // viewport's, so the toggle does not drift off on a wide
                // display. Falls back to 16px once the layout is capped.
                right: `max(calc(16px + env(safe-area-inset-right)), calc((100vw - ${CONTENT_MAX_WIDTH}px) / 2 + 16px))`,
                zIndex: 50,
                width: 44,
                // 44x44 is the hit region a control needs; it was 44x36.
                height: 44,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                borderRadius: 999,
                // Surface, blur and rim all come from .glass — inline styles
                // would beat the class and the material has to respond to the
                // reduced-transparency media query.
                color: palette.text,
                cursor: "pointer",
                transition: "transform 160ms ease, background-color 160ms ease",
                transform: pressed
                    ? "scale(0.92)"
                    : hovered
                      ? "translateY(-1px)"
                      : "translateY(0px)",
            }}
        >
            <SiteIcon name={theme === "dark" ? "sun" : "moon"} size={17} />
        </button>
    )
}
