import type { ReactNode } from "react"

/**
 * One outline language for every link glyph, so no single icon out-weighs its
 * neighbours. Brand marks are Lucide's stroked versions (lucide.dev, ISC);
 * mail and website are drawn to match. Every glyph is a 24x24 viewBox with no
 * fill — IntroIcon supplies the shared stroke.
 */

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

const LINE_ICONS: Partial<Record<IntroIconName, ReactNode>> = {
    mail: (
        <>
            <rect x="2.75" y="5" width="18.5" height="14" rx="2.5" />
            <path d="m3.5 7.5 8.5 6 8.5-6" />
        </>
    ),
    website: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
        </>
    ),
    linkedin: (
        <>
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect width="4" height="12" x="2" y="9" />
            <circle cx="4" cy="4" r="2" />
        </>
    ),
    instagram: (
        <>
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </>
    ),
    github: (
        <>
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
        </>
    ),
    twitter: (
        <>
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </>
    ),
    dribbble: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
            <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
            <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72" />
        </>
    ),
}

/**
 * The only filled marks left. Lucide carries no X or Behance glyph, so these
 * stay as the official Simple Icons single paths (CC0). Neither is in use by
 * default; if you add one, expect it to read heavier than the outline set.
 */
const SOLID_PATHS: Partial<Record<IntroIconName, string>> = {
    x: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
    behance:
        "M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Zm-.235 12.9c.308.004.616-.029.916-.099a2.18 2.18 0 0 0 .766-.332c.228-.158.411-.371.534-.619.142-.317.208-.663.191-1.009a2.08 2.08 0 0 0-.642-1.715 2.618 2.618 0 0 0-1.696-.505h-3.54v4.279h3.471Zm13.635-5.967a2.13 2.13 0 0 0-1.654-.619 2.336 2.336 0 0 0-1.163.259 2.474 2.474 0 0 0-.738.62 2.359 2.359 0 0 0-.396.792c-.074.239-.12.485-.137.734h4.769a3.239 3.239 0 0 0-.679-1.785l-.002-.001Zm-13.813-.648a2.254 2.254 0 0 0 1.423-.433c.399-.355.607-.88.56-1.413a1.916 1.916 0 0 0-.178-.891 1.298 1.298 0 0 0-.495-.533 1.851 1.851 0 0 0-.711-.274 3.966 3.966 0 0 0-.835-.073H3.241v3.631h3.293v-.014ZM21.62 5.122h-5.976v1.527h5.976V5.122Z",
}

/** Longest match wins, so "linkedin" is not caught by a shorter key. */
const LABEL_MATCHES: [string, IntroIconName][] = [
    ["instagram", "instagram"],
    ["linkedin", "linkedin"],
    ["dribbble", "dribbble"],
    ["behance", "behance"],
    ["twitter", "twitter"],
    ["github", "github"],
    ["email", "mail"],
    ["mail", "mail"],
    ["x.com", "x"],
]

export const resolveIntroIcon = (
    label: string,
    url: string
): IntroIconName => {
    const haystack = `${label} ${url}`.toLowerCase()
    for (const [needle, name] of LABEL_MATCHES) {
        if (haystack.includes(needle)) return name
    }
    if (haystack.trim() === "x" || haystack.startsWith("x ")) return "x"
    return "website"
}

export function IntroIcon({
    name,
    size,
}: {
    name: IntroIconName
    size: number
}) {
    const shapes = LINE_ICONS[name]

    if (shapes) {
        return (
            <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: "block" }}
            >
                {shapes}
            </svg>
        )
    }

    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            aria-hidden="true"
            style={{ display: "block" }}
        >
            <path d={SOLID_PATHS[name]} fill="currentColor" />
        </svg>
    )
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
