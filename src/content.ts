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
    // The job title, set apart from the sentence around it.
    role: "product designer",
    // {role} the title, {verb} the rotating word, {rokt} the employer link and
    // {clicks} the pressable key. A newline becomes a line break; within a
    // line the browser balances the wrap, so no line is left a stub.
    tagline:
        "A {role} who loves to {verb}\nCurrently, I'm {rokt} optimizing advertisements for {clicks}",
    // One word each, all verbs that finish "loves to ___".
    verbs: [
        "design",
        "prototype",
        "research",
        "code",
        "test",
        "ship",
        "automate",
        "iterate",
    ],
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
    // Order matters twice over: it indexes the card palette, and it is the
    // reading order of the case studies. See docs/case-studies/README.md for
    // why these six sit in this sequence — no story shape repeats adjacently.
    {
        title: "Uber Eats Contextual Advertising",
        image: { src: "/projects/project-02.jpg", alt: "Uber Eats" },
        thumb: {
            src: "/projects/icon-ubereats.svg",
            alt: "Uber Eats",
        },
        // The hero pane runs the live placement loop instead of artwork.
        mediaType: "component",
        component: "uber-loop",
        category: "Ad formats",
        year: "2026",
        description:
            "Ad formats in Uber Eats order tracking, tuned to your order and your wait.",
        tags: [],
        link: "work/uber-ads/",
    },
    {
        title: "McDonald's kiosk rewards",
        image: {
            src: "/projects/mcdonalds-kiosk-pair.webp",
            alt: "A customer at a McDonald's kiosk showing a Disney+ offer to scan, beside the notification that follows on their phone",
        },
        // Both halves of it, so neither is cropped away.
        imageFit: "contain",
        // The kiosk's own screen is the point, and it is unreadable at phone
        // width across the full photo, so narrow screens get a crop in on it.
        imageMobile: "/projects/mcdonalds-kiosk-pair-mobile.webp",
        thumb: {
            src: "/projects/icon-mcdonalds.svg",
            alt: "McDonald's",
        },
        category: "In-person",
        // Still in progress, so the card says so.
        comingSoon: true,
        year: "2026",
        description:
            "A kiosk offer after you pay. The sign-up finishes on your own phone.",
        tags: [],
        link: "work/mcdonalds-kiosk/",
    },
    {
        title: "Macy's Bag page",
        image: {
            src: "/projects/macys-bag-laptop.webp",
            alt: "The Macy's bag page on a laptop",
        },
        // The hero replays the prototype itself: a suggested item goes in the
        // bag and the exclusive discount below it comes up out of grey.
        mediaType: "component",
        component: "macys-bag",
        thumb: {
            src: "/projects/icon-macys.svg",
            alt: "Macy's",
        },
        category: "Conversion",
        year: "2026",
        description:
            "In the bag: add cufflinks, unlock the same shirt in blue at half price.",
        tags: [],
        link: "work/macys-bag-page/",
    },
    {
        title: "Agents that build partner mockups",
        image: {
            src: "/projects/project-04.jpg",
            alt: "Agents that build partner mockups",
        },
        thumb: {
            src: "/projects/icon-agent.svg",
            alt: "Generated mockups",
        },
        // The hero pane takes a prompt naming a new partner, then writes out
        // the format library while the phone renders each format in turn.
        mediaType: "component",
        component: "partner-agent",
        category: "Internal tools",
        year: "2026",
        description:
            "Agents draft 80% of a partner's mockups; designers drive the last 20%.",
        tags: [],
        // TODO: still points at the shoppable case study. Needs its own page.
        link: "work/shoppable-pitching-platform/",
    },
    {
        title: "Branded Layouts",
        image: { src: "/projects/project-03.jpg", alt: "Branded Layouts" },
        // The hero pane shuffles one placement through six partners' brands.
        mediaType: "component",
        component: "branded-shuffle",
        category: "Design systems",
        // The card's thumbnail follows the hero's carousel: same partner,
        // same moment, both reading the rotation in src/partners.ts.
        partnerRotation: true,
        year: "2026",
        description:
            "One template wears 50 clients' brands, so the offer fits the moment.",
        tags: [],
        link: "work/branded-layouts/",
    },
    {
        title: "Rapid prototyping tool (config hero)",
        image: {
            src: "/projects/project-04.jpg",
            alt: "Rapid prototyping tool",
        },
        thumb: {
            src: "/projects/icon-rokt-logo.svg",
            alt: "Rokt",
        },
        mediaType: "component",
        component: "shoppable-config",
        category: "Internal tools",
        year: "2026",
        description:
            "A platform so sales ship a live demo within an hour of the first call.",
        tags: [],
        link: "work/shoppable-config/",
    },
    {
        title: "Expedia 1P / 3P",
        image: {
            src: "/projects/expedia-offer.webp",
            alt: "The Expedia offer experience on a laptop and a phone",
        },
        imageFit: "contain",
        // The laptop is unreadable at phone width, so narrow screens get a
        // crop led by the phone with the laptop bleeding off behind it.
        imageMobile: "/projects/expedia-offer-mobile.webp",
        thumb: {
            src: "/projects/icon-expedia.svg",
            alt: "Expedia",
        },
        category: "Marketplace",
        year: "2026",
        description:
            "Upsells that close the trip: a hotel for the flight, a ride from the airport.",
        tags: [],
        link: "work/expedia-1p-3p/",
    },
]
