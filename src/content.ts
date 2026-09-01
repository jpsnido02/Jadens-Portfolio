import type { IntroLink, ProjectData } from "./PortfolioScroll"

/**
 * EDIT EVERYTHING ABOUT THE SITE FROM HERE.
 * Swap the placeholder copy, artwork and links below for real work.
 * Images: drop files in public/projects/ and reference them as "/projects/<file>".
 * Video: set mediaType: "video" and videoUrl instead of image.
 */

export const intro = {
    headline: "Hi, I'm Jaden!",
    // What the inline CTA cycles through on hover — the words a real placement
    // puts on its buttons.
    ctaWords: ["claim", "yes", "no", "decline"],
    // {rokt} renders the Rokt wordmark as a link and {clicks} the pressable
    // key. See renderTagline.
    tagline:
        "A product designer who loves to do all three: research, prototype, and code. Currently, I'm optimizing for {clicks} at {rokt}.",
    // The icon is inferred from the label/URL — mail, linkedin, twitter, x,
    // instagram, github, dribbble, behance, or a globe for anything else.
    // Add `icon: "github"` to a link to force a specific one.
    links: [
        // TODO: replace with the accounts you want publicly listed.
        { label: "Email", url: "mailto:hello@example.com" },
        { label: "LinkedIn", url: "https://www.linkedin.com" },
        { label: "Instagram", url: "https://www.instagram.com" },
    ] satisfies IntroLink[],
}

export const projects: ProjectData[] = [
    {
        title: "Project 01",
        image: { src: "/projects/project-01.jpg", alt: "Project 01 artwork" },
        category: "Category",
        year: "2026",
        description:
            "One or two lines about the work — what it was and what you did on it.",
        tags: ["Product Design", "Prototyping"],
        link: "https://example.com/project-01",
    },
    {
        title: "Project 02",
        image: { src: "/projects/project-02.jpg", alt: "Project 02 artwork" },
        category: "Category",
        year: "2026",
        description:
            "One or two lines about the work — what it was and what you did on it.",
        tags: ["Design Systems", "Figma"],
        link: "https://example.com/project-02",
    },
    {
        title: "Project 03",
        image: { src: "/projects/project-03.jpg", alt: "Project 03 artwork" },
        category: "Category",
        year: "2025",
        description:
            "One or two lines about the work — what it was and what you did on it.",
        tags: ["UI UX", "Frontend"],
        link: "https://example.com/project-03",
    },
    {
        title: "Project 04",
        image: { src: "/projects/project-04.jpg", alt: "Project 04 artwork" },
        category: "Category",
        year: "2025",
        description:
            "One or two lines about the work — what it was and what you did on it.",
        tags: ["Interaction", "Motion"],
        link: "https://example.com/project-04",
    },
    {
        title: "Project 05",
        image: { src: "/projects/project-05.jpg", alt: "Project 05 artwork" },
        category: "Category",
        year: "2025",
        description:
            "One or two lines about the work — what it was and what you did on it.",
        tags: ["Research", "Concept"],
        link: "https://example.com/project-05",
    },
    {
        title: "Project 06",
        image: { src: "/projects/project-06.jpg", alt: "Project 06 artwork" },
        category: "Category",
        year: "2024",
        description:
            "One or two lines about the work — what it was and what you did on it.",
        tags: ["Web", "React"],
        link: "https://example.com/project-06",
    },
    {
        title: "Project 07",
        image: { src: "/projects/project-07.jpg", alt: "Project 07 artwork" },
        category: "Category",
        year: "2024",
        description:
            "One or two lines about the work — what it was and what you did on it.",
        tags: ["Brand", "Art Direction"],
        link: "https://example.com/project-07",
    },
]
