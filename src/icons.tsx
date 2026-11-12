import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { config, type IconDefinition } from "@fortawesome/fontawesome-svg-core"
import { faArrowLeft, faArrowRight, faArrowUpRightFromSquare, faEnvelope, faGlobe, faFileLines, faXmark, faPause, faPlay, faSun, faMoon, faTableCellsLarge, faListCheck, faLayerGroup, faClockRotateLeft, faMagnifyingGlass, faCheck, faTableColumns } from "@fortawesome/free-solid-svg-icons"
import { faLinkedinIn, faTwitter, faXTwitter, faInstagram, faGithub, faDribbble, faBehance } from "@fortawesome/free-brands-svg-icons"
import "@fortawesome/fontawesome-svg-core/styles.css"

config.autoAddCss = false

export type IntroIconName =
    | "mail"
    | "website"
    | "linkedin"
    | "twitter"
    | "x"
    | "instagram"
    | "github"
    | "dribbble"
    | "behance"
    | "resume"

/** Longest match wins, so "linkedin" is not caught by a shorter key. */
const LABEL_MATCHES: [string, IntroIconName][] = [
    ["instagram", "instagram"],
    ["linkedin", "linkedin"],
    ["dribbble", "dribbble"],
    ["behance", "behance"],
    ["twitter", "twitter"],
    ["github", "github"],
    ["resume", "resume"],
    [".pdf", "resume"],
    ["email", "mail"],
    ["mail", "mail"],
    ["x.com", "x"],
]

export const resolveIntroIcon = (label: string, url: string): IntroIconName => {
    const haystack = `${label} ${url}`.toLowerCase()
    for (const [needle, name] of LABEL_MATCHES) {
        if (haystack.includes(needle)) return name
    }
    if (haystack.trim() === "x" || haystack.startsWith("x ")) return "x"
    return "website"
}

const LINK_ICONS: Record<IntroIconName, IconDefinition> = {
    mail: faEnvelope, website: faGlobe, linkedin: faLinkedinIn, twitter: faTwitter,
    x: faXTwitter, instagram: faInstagram, github: faGithub, dribbble: faDribbble,
    behance: faBehance, resume: faFileLines,
}
const UI_ICONS = { external: faArrowUpRightFromSquare, back: faArrowLeft, next: faArrowRight,
    close: faXmark, pause: faPause, play: faPlay, sun: faSun, moon: faMoon,
    overview: faTableCellsLarge, tasks: faListCheck, library: faLayerGroup,
    activity: faClockRotateLeft, search: faMagnifyingGlass, check: faCheck, board: faTableColumns }

export function SiteIcon({ name, size = 14 }: { name: keyof typeof UI_ICONS; size?: number }) {
    return <FontAwesomeIcon icon={UI_ICONS[name]} className="site-icon" aria-hidden="true" focusable="false" style={{ width: size, height: size }} />
}
export function IntroIcon({ name, size }: { name: IntroIconName; size: number }) {
    return <FontAwesomeIcon icon={LINK_ICONS[name]} className="site-icon" aria-hidden="true" focusable="false" style={{ width: size, height: size }} />
}

/**
 * Rokt wordmark, from the SVG served on rokt.com. Filled with currentColor so
 * it takes the colour of the line it sits in, in either theme. The original
 * clip path was a full-bounds rect, so it is dropped.
 */
export function RoktWordmark({ height }: { height: number }) {
    return (
        <svg
            viewBox="0 0 103 30"
            height={height}
            width={(height * 103) / 30}
            role="img"
            aria-label="Rokt"
            style={{ display: "block" }}
        >
            <path
                d="M15.3607 9.83157C15.3607 7.42295 14.165 6.15814 11.2997 6.15814H7.63496V13.5453H11.2954C14.1665 13.5453 15.3607 12.3209 15.3607 9.83157ZM23.3601 9.91224C23.3601 12.874 21.8807 14.9283 19.1047 16.5143L25.2328 28.7591H16.6529L11.755 18.606H7.63496V28.7562H0V1.10178H12.494C19.9748 1.10178 23.3601 4.69741 23.3601 9.91224Z"
                fill="currentColor"
            />
            <path
                d="M80.1571 1.16617L77.1751 7.0134H86.9248V28.8163H94.6059V7.0134H103V1.16617H80.1571Z"
                fill="currentColor"
            />
            <path
                d="M73.4685 1.13583H77.6462L61.2094 14.6036V9.91748L73.4685 1.13583Z"
                fill="currentColor"
            />
            <path
                d="M73.4253 1.13583H77.7902L71.4517 13.4858L64.5371 16.6219L73.4253 1.13583Z"
                fill="currentColor"
            />
            <path
                d="M64.5227 16.6218L71.4373 13.4857L78.9715 28.7341H70.3555L64.5227 16.6218Z"
                fill="currentColor"
            />
            <path
                d="M61.3506 1.15768H53.7085V28.7689H61.3506V1.15768Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M38.3262 0.581451C34.3849 0.581451 31.2012 1.87796 28.8185 4.45368C26.4358 7.0294 25.2373 10.4968 25.2373 14.9597V15.0389C25.2373 19.5046 26.431 23.0206 28.8185 25.5867C31.2084 28.1538 34.3892 29.4186 38.3262 29.4186C42.2633 29.4186 45.4484 28.1538 47.7965 25.5867C50.184 23.0186 51.3777 19.5027 51.3777 15.0389V14.9597C51.3777 10.4939 50.1835 7.02363 47.7965 4.45368C45.4484 1.88516 42.2662 0.581451 38.3262 0.581451ZM38.2888 6.19963C36.6811 6.19963 35.3817 7.01355 34.4079 8.61977C33.4341 10.226 32.9457 12.3955 32.9457 15.1858V15.2348C32.9457 18.0266 33.4331 20.2244 34.4079 21.8283C35.3832 23.433 36.6811 24.2225 38.2888 24.2225C39.8964 24.2225 41.1958 23.433 42.1538 21.8283C43.1118 20.2235 43.616 18.0252 43.616 15.2348V15.1858C43.616 12.3955 43.1291 10.226 42.1538 8.61977C41.1785 7.01355 39.9036 6.2054 38.2888 6.2054V6.19963Z"
                fill="currentColor"
            />
        </svg>
    )
}
