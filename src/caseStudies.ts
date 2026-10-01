/**
 * CASE STUDY CONTENT — edit everything here.
 *
 * A case study is an ordered list of blocks. The order IS the design: see
 * docs/case-studies/ for the per-project template each of these follows, and
 * docs/case-study-template.md for the block library and the shape rules.
 *
 * Word budgets, which are the whole point:
 *   abstract ≤45 · thesis ≤20 · section body ≤60 · caption ≤25 · takeaway ≤50
 *   whole case study 250–600
 *
 * Every string below is placeholder copy written to the right length, so the
 * layout is honest about how much room you actually have. Numbers are left as
 * `+00%` on purpose — never ship a figure you have not measured.
 */

/** Media width tiers. Varying these is the main pacing device. */
export type FigureWidth = "bleed" | "full" | "half" | "strip"

export type Block =
    /** ≤45 words. Hanging indent, set apart from everything else. */
    | { kind: "abstract"; text: string }
    /** One sentence, ≤20 words. The largest type in the body. */
    | { kind: "thesis"; text: string }
    /** What is simplified, redacted or recreated, and why. */
    | { kind: "confidential"; text: string }
    /** Small label → optional one-line thesis → optional body. */
    | { kind: "section"; label: string; thesis?: string; body?: string }
    | {
          kind: "figure"
          width: FigureWidth
          src?: string
          alt?: string
          caption?: string
      }
    | {
          kind: "figurePair"
          items: { src?: string; alt?: string }[]
          caption?: string
      }
    /** The failure unit: what you tried, and the mechanism that killed it. */
    | {
          kind: "attempt"
          label: string
          body: string
          won?: boolean
          reasons?: string[]
          src?: string
      }
    /** Short noun phrases, not sentences. */
    | { kind: "insights"; items: string[] }
    /** 01/02/03 → one word → a question. */
    | {
          kind: "criteria"
          items: { word: string; question: string }[]
      }
    /** Groups figures under a system name. Turns features into architecture. */
    | {
          kind: "layer"
          name: string
          thesis: string
          figures: { src?: string; alt?: string; caption?: string }[]
      }
    /** One per case study, maximum. Skip the block rather than use a weak one. */
    | { kind: "quote"; text: string; who: string; role: string }
    | { kind: "numbers"; items: { value: string; label: string }[] }
    | { kind: "splitOutcome"; business: string[]; design: string[] }
    | { kind: "takeaway"; title: string; body: string }
    /** Honest note that the work is still moving. */
    | { kind: "wip"; text: string }
    /** The outtake. Ends on a human detail instead of a metric. */
    | { kind: "appendix"; title: string; body: string }
    /** A live component rather than a still. Named so the data stays data. */
    | {
          kind: "animation"
          name: "uber-loop"
          width: FigureWidth
          caption?: string
      }

export interface CaseStudy {
    slug: string
    /** Shown in the masthead and the browser tab. */
    title: string
    /** The client, or a category descriptor if the name cannot be used. */
    client: string
    year: string
    role: string
    duration: string
    /** Named for your own reference; does not render. */
    shape: "Iteration" | "Gallery" | "System" | "Reframe"
    /** Indexes the card palette, so the page is tinted like the card it came from. */
    paletteIndex: number
    /** Continuous figure numbering, like a paper. Off for Gallery. */
    numbered: boolean
    blocks: Block[]
    /** Slug of the next case study, previewed at the foot of the page. */
    next: string
    /** One line previewing this study where it is linked from elsewhere. */
    preview: string
}

/**
 * Case study pages all live at /work/<slug>/, so artwork in public/ is two
 * levels up. Relative rather than root-absolute so the paths survive both the
 * apex domain and the project-pages subpath.
 */
const img = (n: number) => `../../projects/project-0${n}.jpg`

export const caseStudies: CaseStudy[] = [
    // ---------------------------------------------------------------- 1 of 6
    {
        slug: "macys-bag-page",
        title: "Where intent goes to die",
        client: "Macy's",
        year: "2025",
        role: "Product Designer",
        duration: "4 months",
        shape: "Iteration",
        paletteIndex: 0,
        numbered: true,
        preview: "Three variants, two of which lost.",
        next: "uber-ads",
        blocks: [
            {
                kind: "abstract",
                text: "The bag page is the last screen before someone commits. It is also the least defended surface on the site. This project tested whether a placement could sit there without costing the sale it was standing next to.",
            },
            {
                kind: "thesis",
                text: "The highest-intent moment on the site was also the worst protected.",
            },
            {
                kind: "confidential",
                text: "Screens are recreated and simplified. Figures are directional.",
            },
            {
                kind: "figurePair",
                items: [
                    { src: img(1), alt: "Bag page before" },
                    { src: img(2), alt: "Bag page after" },
                ],
                caption:
                    "Before and after. The subtotal stays above the fold in both.",
            },
            {
                kind: "section",
                label: "The attempts",
                thesis: "Two formats failed before one worked.",
                body: "Each variant shipped to a slice of traffic. The two that lost are the interesting ones — they failed for different reasons, and the second failure is what pointed at the answer.",
            },
            {
                kind: "attempt",
                label: "Attempt 1 — inline above the subtotal",
                body: "Put the offer where the eye already was. It pushed the subtotal below the fold on a 375px viewport, and bag abandonment moved the wrong way.",
                src: img(3),
            },
            {
                kind: "attempt",
                label: "Attempt 2 — interstitial on bag entry",
                body: "Move it out of the layout entirely. No layout cost, but it interrupted a decision already in progress and was dismissed before it rendered fully.",
                src: img(4),
            },
            {
                kind: "attempt",
                label: "Attempt 3 — after the commit, before the receipt",
                won: true,
                body: "A session replay showed people scrolling back to the bag to re-check the total rather than to reconsider. The hesitation was arithmetic, not doubt — so the offer belonged after the decision, not inside it.",
                reasons: [
                    "Nothing competes with the subtotal",
                    "The decision is already made, so there is nothing to interrupt",
                    "Attention is unoccupied for the first time in the flow",
                ],
                src: img(5),
            },
            {
                kind: "quote",
                text: "Placeholder — a line from the partner or PM about what changed. Replace or delete the block; a weak quote is worse than none.",
                who: "Name",
                role: "Role, Macy's",
            },
            {
                kind: "numbers",
                items: [
                    { value: "+00%", label: "Placement engagement" },
                    { value: "+00%", label: "Revenue per session" },
                    { value: "00%", label: "Change in bag abandonment" },
                ],
            },
            {
                kind: "takeaway",
                title: "Takeaway: a losing variant is the cheapest research you will ever run",
                body: "Two failures cost one sprint each and told us more about the page than the preceding month of discovery.",
            },
            {
                kind: "takeaway",
                title: "Takeaway: read hesitation before you design for it",
                body: "We assumed scrolling back meant doubt. It meant arithmetic. The whole solution turned on that one distinction.",
            },
        ],
    },

    // ---------------------------------------------------------------- 2 of 6
    {
        slug: "uber-ads",
        title: "Uber Eats Contextual Advertising",
        client: "Uber Eats",
        year: "2025",
        role: "Product Designer",
        duration: "6 months",
        shape: "Gallery",
        paletteIndex: 1,
        numbered: false,
        preview:
            "Design that understands your order, and what to do while you wait.",
        next: "branded-layouts",
        blocks: [
            {
                kind: "abstract",
                text: "Contextual offers inside the Uber Eats order screen — the window between placing an order and it arriving. Four offers share one placement, each written against what was ordered and how long the wait will be.",
            },
            {
                kind: "confidential",
                text: "Conceptual and simplified throughout. Nothing here reflects shipped production UI.",
            },
            {
                kind: "animation",
                name: "uber-loop",
                width: "full",
                caption:
                    "Four offers, one placement. The Disney+ offer opens the App Store.",
            },
            {
                kind: "figure",
                width: "strip",
                src: img(3),
                alt: "States",
                caption: "States, left to right.",
            },
            {
                kind: "figure",
                width: "full",
                src: img(4),
                alt: "In context",
                caption: "In context.",
            },
            {
                kind: "figurePair",
                items: [
                    { src: img(5), alt: "Compact variant" },
                    { src: img(6), alt: "Expanded variant" },
                ],
                caption: "Compact and expanded.",
            },
            {
                kind: "figure",
                width: "strip",
                src: img(1),
                alt: "Type specimen",
                caption: "Type at the smallest size that survives sunlight.",
            },
            {
                kind: "figure",
                width: "bleed",
                src: img(2),
                alt: "Final format",
            },
            {
                kind: "takeaway",
                title: "Takeaway: one piece of reflection, earning its place",
                body: "Everything else on this page is visual, so the single written thought has to be worth stopping for. Replace this with yours.",
            },
        ],
    },

    // ---------------------------------------------------------------- 3 of 6
    {
        slug: "branded-layouts",
        title: "One system, every brand",
        client: "Rokt",
        year: "2026",
        role: "Product Designer",
        duration: "Ongoing",
        shape: "System",
        paletteIndex: 2,
        numbered: true,
        preview: "A placement that inherits a partner's brand automatically.",
        next: "shoppable-pitching-platform",
        blocks: [
            {
                kind: "abstract",
                text: "Partners want placements that look like their own product, not like an ad network. Designing each one by hand does not scale past a handful. This is the system that reads a brand and applies it without a designer in the loop.",
            },
            {
                kind: "thesis",
                text: "A placement should inherit a partner's brand, not be redrawn for it.",
            },
            {
                kind: "figure",
                width: "strip",
                src: img(3),
                alt: "Many partner treatments side by side",
                caption:
                    "One template, many partners. Scale before a word is read.",
            },
            {
                kind: "insights",
                items: [
                    "Bespoke design per partner",
                    "Brand drift between placement and site",
                    "No way to preview before launch",
                ],
            },
            {
                kind: "layer",
                name: "Token extraction",
                thesis: "Read the brand off the surface the partner already ships.",
                figures: [
                    {
                        src: img(4),
                        alt: "Scraped tokens",
                        caption: "Colour, type, radii, button shape.",
                    },
                    {
                        src: img(5),
                        alt: "Token review",
                        caption: "Where automatic extraction needs a human.",
                    },
                ],
            },
            {
                kind: "layer",
                name: "Templating",
                thesis: "Tokens drive the layout; the layout is never touched.",
                figures: [
                    {
                        src: img(6),
                        alt: "Template under brand A",
                        caption:
                            "The same template under two brands — the proof the system works.",
                    },
                    { src: img(1), alt: "Template under brand B" },
                ],
            },
            {
                kind: "layer",
                name: "Rollout",
                thesis: "Ranked by revenue, batched, reviewed before launch.",
                figures: [
                    {
                        src: img(2),
                        alt: "Rollout queue",
                        caption: "Highest-revenue partners first.",
                    },
                ],
            },
            {
                kind: "wip",
                text: "Metrics for this one are still landing. We are measuring placement engagement and partner-reported brand lift against the unbranded baseline, with first numbers expected next quarter.",
            },
            {
                kind: "takeaway",
                title: "Takeaway: the system is the deliverable, not the layouts",
                body: "The output that mattered was not any single partner's placement. It was the rule that made the next hundred of them cost nothing.",
            },
            {
                kind: "takeaway",
                title: "Takeaway: automate the extraction, keep the judgement",
                body: "Tokens can be read mechanically. Deciding which of a brand's six blues is the one it actually uses still needs a person.",
            },
        ],
    },

    // ---------------------------------------------------------------- 4 of 6
    {
        slug: "shoppable-pitching-platform",
        title: "From a week to minutes",
        client: "Rokt",
        year: "2025",
        role: "Product Designer",
        duration: "5 months",
        shape: "Reframe",
        paletteIndex: 3,
        numbered: false,
        preview:
            "Sales shipped their own demos. Design stopped being the queue.",
        next: "mcdonalds-kiosk",
        blocks: [
            {
                kind: "abstract",
                text: "A shoppable ad lets someone buy a product directly from the ad itself. It was a brand-new format, so every sales pitch needed a custom working demo — hand-built in Figma, about a week each. I built a tool that made them in minutes.",
            },
            {
                kind: "insights",
                items: [
                    "A week of hand-building, per demo",
                    "Every pitch queued behind the design team",
                    "A brand-new format nobody could picture",
                ],
            },
            {
                kind: "thesis",
                text: "Nobody can sell a format they cannot show, and nobody could hand-build one demo per deal.",
            },
            {
                kind: "figurePair",
                items: [
                    { src: img(4), alt: "A prototype hand-built in Figma" },
                    { src: img(5), alt: "The same demo, built by sales" },
                ],
                caption:
                    "A week of someone's craft, and the thing that replaced it.",
            },
            {
                kind: "figure",
                width: "full",
                src: img(6),
                alt: "The builder in use",
                caption:
                    "Sales assembling a live demo against a real catalogue.",
            },
            {
                kind: "section",
                label: "Building it",
                thesis: "I wrote it myself, in Cursor.",
                body: "A spec would have joined a backlog behind revenue work, which is how the week kept surviving. Writing it meant it shipped in weeks and I could change it the same afternoon an account manager told me what was wrong.",
            },
            {
                kind: "splitOutcome",
                business: [
                    "Sales self-serve a demo for every pitch",
                    "About a week of turnaround down to a working session",
                    "A new vertical pitchable at volume, not per deal",
                ],
                design: [
                    "Design removed from the critical path, deliberately",
                    "One shared definition of what a shoppable ad is",
                    "Delivered as working code rather than a specification",
                ],
            },
            {
                kind: "takeaway",
                title: "Takeaway: the best design work here was not designing",
                body: "That week of hand-building was real craft, and it was waste. The win was deleting it rather than getting faster at it — which meant arguing my own team out of a job it was proud of.",
            },
            {
                kind: "takeaway",
                title: "Takeaway: being able to ship it is what made it exist",
                body: "I could not have handed this over as a request. The gap between noticing the problem and removing it was only short because the person who noticed could also build it.",
            },
        ],
    },

    // DUPLICATE for comparing hero treatments — see src/content.ts.
    {
        slug: "shoppable-config",
        title: "From a week to minutes",
        client: "Rokt",
        year: "2025",
        role: "Product Designer",
        duration: "5 months",
        shape: "Reframe",
        paletteIndex: 3,
        numbered: false,
        preview:
            "Sales shipped their own demos. Design stopped being the queue.",
        next: "mcdonalds-kiosk",
        blocks: [
            {
                kind: "abstract",
                text: "A shoppable ad lets someone buy a product directly from the ad itself. It was a brand-new format, so every sales pitch needed a custom working demo — hand-built in Figma, about a week each. I built a tool that made them in minutes.",
            },
            {
                kind: "insights",
                items: [
                    "A week of hand-building, per demo",
                    "Every pitch queued behind the design team",
                    "A brand-new format nobody could picture",
                ],
            },
            {
                kind: "thesis",
                text: "Nobody can sell a format they cannot show, and nobody could hand-build one demo per deal.",
            },
            {
                kind: "figurePair",
                items: [
                    { src: img(4), alt: "A prototype hand-built in Figma" },
                    { src: img(5), alt: "The same demo, built by sales" },
                ],
                caption:
                    "A week of someone's craft, and the thing that replaced it.",
            },
            {
                kind: "figure",
                width: "full",
                src: img(6),
                alt: "The builder in use",
                caption:
                    "Sales assembling a live demo against a real catalogue.",
            },
            {
                kind: "section",
                label: "Building it",
                thesis: "I wrote it myself, in Cursor.",
                body: "A spec would have joined a backlog behind revenue work, which is how the week kept surviving. Writing it meant it shipped in weeks and I could change it the same afternoon an account manager told me what was wrong.",
            },
            {
                kind: "splitOutcome",
                business: [
                    "Sales self-serve a demo for every pitch",
                    "About a week of turnaround down to a working session",
                    "A new vertical pitchable at volume, not per deal",
                ],
                design: [
                    "Design removed from the critical path, deliberately",
                    "One shared definition of what a shoppable ad is",
                    "Delivered as working code rather than a specification",
                ],
            },
            {
                kind: "takeaway",
                title: "Takeaway: the best design work here was not designing",
                body: "That week of hand-building was real craft, and it was waste. The win was deleting it rather than getting faster at it — which meant arguing my own team out of a job it was proud of.",
            },
            {
                kind: "takeaway",
                title: "Takeaway: being able to ship it is what made it exist",
                body: "I could not have handed this over as a request. The gap between noticing the problem and removing it was only short because the person who noticed could also build it.",
            },
        ],
    },

    // ---------------------------------------------------------------- 5 of 6
    {
        slug: "mcdonalds-kiosk",
        title: "Advertising to someone in a queue",
        client: "McDonald's",
        year: "2025",
        role: "Product Designer",
        duration: "3 months",
        shape: "Iteration",
        paletteIndex: 4,
        numbered: true,
        preview:
            "A placement on a screen you do not own, in a room full of people.",
        next: "expedia-1p-3p",
        blocks: [
            {
                kind: "abstract",
                text: "A placement on an in-restaurant ordering kiosk. Not a phone, not a browser: a shared screen, bolted down, mid-order, with someone waiting behind you.",
            },
            {
                kind: "thesis",
                text: "Every assumption a web placement makes about privacy and time is wrong here.",
            },
            {
                kind: "figure",
                width: "bleed",
                src: img(5),
                alt: "Kiosk in a restaurant",
                caption: "The real thing, in a real restaurant. Not a mockup.",
            },
            {
                kind: "section",
                label: "The constraints",
                thesis: "The constraint set is the brief.",
            },
            {
                kind: "criteria",
                items: [
                    {
                        word: "Dwell",
                        question:
                            "How many seconds does the screen actually have?",
                    },
                    {
                        word: "Privacy",
                        question: "Who else in the queue can read this?",
                    },
                    {
                        word: "Input",
                        question:
                            "What can someone do with full hands and no phone?",
                    },
                ],
            },
            {
                kind: "attempt",
                label: "Attempt 1 — the web format, ported",
                body: "The existing placement, dropped onto the kiosk. It assumed a reader with time and privacy, and had neither. Nobody finished reading it.",
                src: img(6),
            },
            {
                kind: "attempt",
                label: "Attempt 2 — email capture on screen",
                body: "Technically possible, socially impossible. Typing a personal address on a shared screen with a queue behind you is not something people will do.",
                src: img(1),
            },
            {
                kind: "attempt",
                label: "Attempt 3 — claim now, deliver to the receipt",
                won: true,
                body: "Staff told us people photograph their receipt to remember the order number. The receipt was already a thing customers kept — so the offer moved onto it, and the screen only had to carry a yes.",
                reasons: [
                    "Dwell — one tap fits in the time available",
                    "Privacy — nothing personal appears on the shared screen",
                    "Input — no typing, no device",
                ],
                src: img(2),
            },
            {
                kind: "numbers",
                items: [
                    { value: "+00%", label: "Claim rate vs ported format" },
                    { value: "00s", label: "Median time on placement" },
                ],
            },
            {
                kind: "takeaway",
                title: "Takeaway: the room is part of the interface",
                body: "A queue behind the user changed more about this design than any device constraint did. Nothing in our web patterns accounted for being watched.",
            },
            {
                kind: "takeaway",
                title: "Takeaway: ask the staff first",
                body: "The receipt insight came from a shift manager in ten minutes, after we had spent two weeks on formats that could not work.",
            },
            {
                kind: "appendix",
                title: "Appendix: things people did to the kiosk",
                body: "One person tried to swipe it like a phone, repeatedly, then told us it was broken. Another held their receipt up to the camera that was not there. Replace with your own outtakes — this is the block people remember.",
            },
        ],
    },

    // ---------------------------------------------------------------- 6 of 6
    {
        slug: "expedia-1p-3p",
        title: "Expedia 1P / 3P offer experience",
        client: "Expedia",
        year: "2024",
        role: "Product Designer",
        duration: "7 months",
        shape: "System",
        paletteIndex: 5,
        numbered: true,
        preview:
            "Whether a traveller should be able to tell whose offer it is.",
        next: "macys-bag-page",
        blocks: [
            {
                kind: "abstract",
                text: "Two kinds of offer appear in the same place: Expedia's own, and a third party's. They are bought differently, earn differently, and until this project they looked identical to the person deciding.",
            },
            {
                kind: "thesis",
                text: "The question was whether a traveller should be able to tell whose offer it is.",
            },
            {
                kind: "figurePair",
                items: [
                    { src: img(6), alt: "First-party offer" },
                    { src: img(1), alt: "Third-party offer" },
                ],
                caption:
                    "First-party and third-party, as they arrived. The whole problem in one image.",
            },
            {
                kind: "insights",
                items: [
                    "Travellers assumed every offer was Expedia's",
                    "The two types could not be ranked on the same scale",
                ],
            },
            {
                kind: "layer",
                name: "Distinction",
                thesis: "Make the source legible without making it loud.",
                figures: [
                    {
                        src: img(2),
                        alt: "Source treatment",
                        caption:
                            "Enough signal to be honest, not enough to look like a warning.",
                    },
                ],
            },
            {
                kind: "layer",
                name: "Ranking",
                thesis: "One scale, stated openly.",
                figures: [
                    {
                        src: img(3),
                        alt: "Ranking model",
                        caption: "What decides the order.",
                    },
                    { src: img(4), alt: "Edge cases" },
                ],
            },
            {
                kind: "layer",
                name: "Surfaces",
                thesis: "The same rules across every place it appears.",
                figures: [
                    {
                        src: img(5),
                        alt: "Across surfaces",
                        caption: "Confirmation, itinerary, email.",
                    },
                ],
            },
            {
                kind: "splitOutcome",
                business: [
                    "Third-party attach rate, without first-party cannibalisation",
                    "A ranking model partnerships could explain to advertisers",
                ],
                design: [
                    "A shared definition of 1P and 3P the whole team used",
                    "Decision rules handed to teams that were not in the room",
                    "A pattern that outlived the project",
                ],
            },
            {
                kind: "takeaway",
                title: "Takeaway: disclosure is a design problem, not a legal one",
                body: "The requirement was a sentence long. Making it readable without making it feel like a disclaimer took most of the project.",
            },
            {
                kind: "takeaway",
                title: "Takeaway: a commercial model you cannot explain is a design constraint",
                body: "We could not design the ranking until someone could say out loud why one offer should beat another. Writing that sentence was the work.",
            },
        ],
    },
]

export const bySlug = (slug: string) =>
    caseStudies.find((study) => study.slug === slug)
