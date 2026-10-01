import PortfolioScroll from "./PortfolioScroll"
import ThemeToggle from "./ThemeToggle"
import { useTheme } from "./useTheme"
import { intro, projects } from "./content"

export default function App() {
    const { theme, palette, toggle } = useTheme()

    return (
        <>
            <PortfolioScroll
                projects={projects}
                introHeadline={intro.headline}
                ctaWords={intro.ctaWords}
                introVerbs={intro.verbs}
                introRole={intro.role}
                introTagline={intro.tagline}
                introLinks={intro.links}
                palette={palette}
            />
            <ThemeToggle theme={theme} palette={palette} onToggle={toggle} />
        </>
    )
}
