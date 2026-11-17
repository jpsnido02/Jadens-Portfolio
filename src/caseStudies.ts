import { personalCaseStudies } from "./personalProjects"

/** Case-study narratives use supplied project facts and clearly scoped portfolio recreations. */

/** Media width tiers. Varying these is the main pacing device. */
export type FigureWidth = "bleed" | "full" | "half" | "strip"

export type Block =
    | { kind: "uxVisual"; variant: "composition" | "detail"; name: "uber" | "agent" | "kalshi" | "macys" | "branded" | "expedia"; caption: string }
    | { kind: "evidence"; name: "uber-context" | "macys-decision" | "agent-review" | "branded-comparison" | "expedia-proof" | "pantry-proof"; caption?: string }
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
    result?: string
    status?: string
    /** Shown in the masthead and the browser tab. */
    title: string
    /** The client, or a category descriptor if the name cannot be used. */
    client: string
    year: string
    role: string
    collaboration?: string
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



export const caseStudies: CaseStudy[] = [
    {
        "slug": "uber-ads",
        "title": "An offer that belongs to the wait.",
        "client": "Uber Eats",
        "year": "2026",
        "role": "Design owner · UX and visual design",
        "collaboration": "Partnered with Uber’s design team on handoff.",
        "duration": "",
        "shape": "Gallery",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "Contextual advertising designed around the moment between placing an order and receiving it.",
        "result": "A contextual offer experience, designed and handed off with Uber’s team.",
        "status": "Final design · portfolio recreation",
        "blocks": [
            {
                "kind": "abstract",
                "text": "After checkout, an Uber Eats customer still has a reason to stay: their order is on its way. I owned the design of contextual offers for that moment and worked with Uber’s design team on handoff."
            },
            {
                "kind": "section",
                "label": "The problem",
                "thesis": "Attention has a purpose.",
                "body": "The delivery wait creates an advertising opportunity, but the customer’s priority is still the order. I approached the placement as part of that journey: an offer should have a clear connection to the moment and leave the delivery experience easy to follow."
            },
            {
                "kind": "section",
                "label": "The approach",
                "thesis": "Let context do the explaining.",
                "body": "A listening offer can complement the time before delivery; a coffee offer can connect to breakfast. Those examples give the placement a reason to exist beyond available screen space. The design brings the order context, partner message, and next action into one readable sequence."
            },
            {
                "kind": "uxVisual",
                "name": "uber",
                "caption": "Final offer components placed side by side to compare time-based and meal-based relevance.",
                "variant": "composition"
            },
            {
                "kind": "section",
                "label": "Design decisions",
                "thesis": "Keep the order as the anchor.",
                "body": "The offer sits within the post-order experience, with a specific action and an understandable way to decline. A consistent container accommodates different partner messages without asking customers to relearn the interaction each time. The contextual copy explains the connection; visual emphasis supports it."
            },
            {
                "kind": "uxVisual",
                "name": "uber",
                "variant": "detail",
                "caption": "The final Spotify offer, annotated to explain the relationship between context, action, and choice."
            },
            {
                "kind": "section",
                "label": "Collaboration",
                "thesis": "Own the design. Carry it through handoff.",
                "body": "I owned the UX and visual design and collaborated with Uber’s design team on handoff. The case study focuses on how the placement fits the customer journey and how its message, hierarchy, and actions work together."
            },
            {
                "kind": "section",
                "label": "Outcome",
                "thesis": "A partner-specific journey.",
                "body": "The resulting experience gives contextual offers a defined place in the delivery wait. It combines partner-specific messaging with a repeatable placement structure, and carries the design through collaboration with Uber’s team."
            },
            {
                "kind": "takeaway",
                "title": "Relevance starts with the customer’s next few minutes.",
                "body": "Designing this placement meant connecting a broader customer journey to a specific moment in the interface. The offer earns its place through what the customer is already doing, then makes its value and next action clear."
            },
            {
                "kind": "confidential",
                "text": "Product screens are simplified portfolio reconstructions. Partner examples illustrate the interaction and do not represent measured campaign results."
            }
        ]
    },
    {
        "slug": "agent-design-operations",
        "title": "Scale the work. Keep the judgment.",
        "client": "Rokt",
        "year": "2026",
        "role": "Independent creator · design and implementation",
        "collaboration": "Created independently, connecting agent production with human review.",
        "duration": "",
        "shape": "System",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "An operating workspace for AI-generated designs, from the first queued task to human approval.",
        "result": "AI design pipeline output scaled from 10–20 to 1,100+ designs per week.",
        "status": "Final design · portfolio recreation",
        "blocks": [
            {
                "kind": "abstract",
                "text": "Generating more designs changes the designer’s job. I independently created Agent Operations to make that work visible: what is waiting, what is building, and what needs my review before it can move forward."
            },
            {
                "kind": "section",
                "label": "The problem",
                "thesis": "Output can outgrow oversight.",
                "body": "As the AI design pipeline grew from 10–20 designs a week to more than 1,100, the challenge extended beyond generation. Work needed an owner, a legible state, and a review step where quality could be assessed. A successful build alone could not stand in for a successful design."
            },
            {
                "kind": "section",
                "label": "Experience behind the work",
                "thesis": "I had already seen the cost of inconsistency.",
                "body": "Before becoming a product designer, I led UX and quality audits across more than 4,000 live ad placements and built automated audit workflows. That experience shaped this project: a production system needs to surface issues in a form a person can act on."
            },
            {
                "kind": "uxVisual",
                "name": "agent",
                "caption": "Final dashboard elements recomposed: a completed task build, review summary, quality checks, and approval controls. Example task data comes from the demo.",
                "variant": "composition"
            },
            {
                "kind": "section",
                "label": "The system",
                "thesis": "Make the next owner obvious.",
                "body": "Queue, Building, For review, and Complete describe what happens next and who needs to act. A ticket carries its account and task through the workflow. The review boundary separates generated output from approved work instead of allowing a successful build to imply a successful design."
            },
            {
                "kind": "uxVisual",
                "name": "agent",
                "variant": "detail",
                "caption": "The dashboard’s four stages, with the feedback path made explicit. This is a workflow explanation, not a record of earlier iterations."
            },
            {
                "kind": "section",
                "label": "Design decisions",
                "thesis": "Make the review actionable.",
                "body": "The review brings together the build summary, links to the output, and quality checks. Brand tokens, responsive layouts, and contrast are explicit review criteria. Request changes and Approve build are distinct paths, so feedback is part of the workflow rather than a separate conversation."
            },
            {
                "kind": "section",
                "label": "Outcome",
                "thesis": "A designer’s operating system for automation.",
                "body": "The workspace gives me a way to monitor builds, inspect output, and direct revisions. The broader AI design pipeline scaled from 10–20 designs a week to more than 1,100. The dashboard makes that volume actionable through visible ownership and a deliberate review boundary."
            },
            {
                "kind": "takeaway",
                "title": "Automation moves the point of design judgment.",
                "body": "My operations background and technical execution meet here. As generation scales, the design responsibility shifts toward defining quality, making exceptions visible, and keeping approval deliberate."
            },
            {
                "kind": "confidential",
                "text": "The portfolio reconstructs the workflow with illustrative accounts and tasks. It does not connect to the production agent or publish designs."
            }
        ]
    },
    {
        "slug": "kalshi-dynamic-ads",
        "title": "Creative that keeps up with the game.",
        "client": "Kalshi",
        "year": "2026",
        "role": "Design collaboration · dynamic creative",
        "collaboration": "Worked with the ads team to develop the design.",
        "duration": "",
        "shape": "Gallery",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "A dynamic ad that makes changing market information understandable in place.",
        "result": "A designed relationship between the live-event context, market chance, and potential payout.",
        "status": "Final design · portfolio recreation",
        "blocks": [
            {
                "kind": "abstract",
                "text": "An ad built around a changing market needs to explain movement clearly. Working with the ads team, I developed a design that keeps the customer’s selection anchored while the market chance and potential payout update."
            },
            {
                "kind": "section",
                "label": "The problem",
                "thesis": "A static message can lose its context.",
                "body": "When the event changes, the information behind the creative changes with it. The design challenge is to communicate what moved without making the entire advertisement feel like a new decision. The selected team and entry amount need to remain easy to track."
            },
            {
                "kind": "section",
                "label": "The approach",
                "thesis": "Separate the event from the choice.",
                "body": "The football sequence supplies context for the update. The offer remains the focal point: team, market chance, entry amount, and potential payout. This lets the creative explain the relationship between an event and changing values while keeping the customer’s selection stable."
            },
            {
                "kind": "uxVisual",
                "name": "kalshi",
                "caption": "The final creative shown in two states. Market values are the illustrative values used in the product demo.",
                "variant": "composition"
            },
            {
                "kind": "section",
                "label": "Design decisions",
                "thesis": "Give motion a job.",
                "body": "In the portfolio example, San Francisco loses five yards. The displayed chance falls from 18% to 16%, while the potential payout changes from $131.16 to $147.56. The values update in place. Keeping their positions stable makes the change easier to compare and gives the motion explanatory value."
            },
            {
                "kind": "uxVisual",
                "name": "kalshi",
                "variant": "detail",
                "caption": "Fixed selection and entry amount are separated from updating market information. This is a design breakdown of the final creative."
            },
            {
                "kind": "section",
                "label": "Collaboration",
                "thesis": "Design within an advertising context.",
                "body": "I worked with the ads team to make the Kalshi design. My contribution focused on the creative: how the event, market information, and customer action fit together visually. The resulting sequence makes that relationship legible within the advertisement."
            },
            {
                "kind": "section",
                "label": "Outcome",
                "thesis": "One coherent update.",
                "body": "The creative presents the event and the information change as a connected sequence. The selected team and entry amount stay stable while the market chance and potential payout change, giving the viewer a reference point throughout."
            },
            {
                "kind": "takeaway",
                "title": "The best motion makes a relationship visible.",
                "body": "A changing value should be easier to understand because it moves. Here, the stable selection and paired updates give the viewer a reference point throughout the sequence."
            },
            {
                "kind": "confidential",
                "text": "The portfolio uses an illustrative football scenario and supplied example values. It is not connected to live market data and does not generate executable quotes."
            }
        ]
    },
    {
        "slug": "macys-bag-page",
        "title": "Make the next addition worth it.",
        "client": "Macy’s",
        "year": "2026",
        "role": "UX and visual design · purchase incentives",
        "collaboration": "Partnered with the product team to develop the optimization.",
        "duration": "",
        "shape": "Iteration",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "A bag-page experience that makes the condition and value of an exclusive discount clear.",
        "result": "A designed flow connecting a second bag addition to an unlocked offer.",
        "status": "Final design · portfolio recreation",
        "blocks": [
            {
                "kind": "abstract",
                "text": "An incentive only helps when customers understand how to earn it. I worked with the product team on a Macy’s bag-page optimization that connects an additional item to an exclusive discount and makes the unlocked state visible."
            },
            {
                "kind": "section",
                "label": "The problem",
                "thesis": "An extra item needs a clear reason.",
                "body": "The bag is a high-intent moment, but another recommendation still asks the customer to spend more. The opportunity was to make the value exchange explicit: what to add, what that action unlocks, and how the new price becomes available."
            },
            {
                "kind": "section",
                "label": "The approach",
                "thesis": "Show the condition beside the reward.",
                "body": "The reconstructed journey starts with a shirt in the bag. A suggested second item appears alongside a locked offer for another product. Showing the two together lets the customer understand the condition before acting, rather than discovering the benefit after a click."
            },
            {
                "kind": "uxVisual",
                "name": "macys",
                "caption": "The final bag interaction explained as three states: condition, unlocked offer, and confirmation. Screens are simplified for comparison.",
                "variant": "composition"
            },
            {
                "kind": "section",
                "label": "Design decisions",
                "thesis": "Explain progress where it happens.",
                "body": "The Add to bag control confirms the second addition. The exclusive offer then changes from unavailable to available in the same location. Keeping the item, condition, and price together reduces the amount of interpretation required to follow the sequence."
            },
            {
                "kind": "uxVisual",
                "name": "macys",
                "variant": "detail",
                "caption": "The offer’s product, price, and unlocked state isolated to explain the incentive hierarchy."
            },
            {
                "kind": "section",
                "label": "Collaboration",
                "thesis": "Develop the optimization with product.",
                "body": "I worked with the product team to shape the Macy’s optimization. We connected the incentive to the customer’s next action: adding the suggested item makes an exclusive price available. My design contribution made that condition, action, and state change visible in the bag."
            },
            {
                "kind": "section",
                "label": "Outcome",
                "thesis": "Close the loop in the bag.",
                "body": "The demonstration ends with the discounted item added and the bag updated, making the benefit of the sequence visible. The final flow explains the value before the customer acts and confirms the consequence afterward."
            },
            {
                "kind": "takeaway",
                "title": "An incentive is an interaction, not just a message.",
                "body": "The condition, action, and reward form one experience. Designing those states together makes the offer understandable before the customer commits and confirms its value afterward."
            },
            {
                "kind": "confidential",
                "text": "Product views reproduce the final bag design. State and incentive breakdowns simplify the interface for explanation; no earlier design versions are implied."
            }
        ]
    },
    {
        "slug": "branded-layouts",
        "title": "One system. Many brand voices.",
        "client": "Rokt",
        "year": "2026",
        "role": "Originator · branded UX and visual system",
        "collaboration": "Conceived the branded UX approach.",
        "duration": "",
        "shape": "System",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "A shared offer experience that adapts to each partner’s identity without losing its underlying structure.",
        "result": "An adaptable branded offer approach, conceived across partner experiences.",
        "status": "Final design · portfolio recreation",
        "blocks": [
            {
                "kind": "abstract",
                "text": "A shared advertising platform appears inside many different brands. I came up with a branded UX approach that adapts the visual language to the partner while preserving a consistent structure for the customer’s decision."
            },
            {
                "kind": "section",
                "label": "The problem",
                "thesis": "A generic placement can feel disconnected.",
                "body": "Typography, color, controls, and language all signal whose experience a customer is in. An offer that ignores those signals can feel separate from the transaction around it. The challenge was to support brand expression without rebuilding the interaction for every account."
            },
            {
                "kind": "section",
                "label": "The approach",
                "thesis": "Define what stays and what adapts.",
                "body": "The greeting, offer, primary action, and decline action retain clear roles. Typography, palette, button treatment, and partner language adapt. This creates a reusable relationship between elements while allowing each placement to belong visually to its host experience."
            },
            {
                "kind": "uxVisual",
                "name": "branded",
                "caption": "The same offer anatomy across Gap, Best Buy, and Depop treatments. Reconstructed from the final branded approach for comparison.",
                "variant": "composition"
            },
            {
                "kind": "section",
                "label": "Design decisions",
                "thesis": "Preserve the decision beneath the styling.",
                "body": "A change of brand should not change the customer’s ability to understand the offer. I treated hierarchy and action clarity as the shared foundation, then used visual treatments to express identity. The comparison makes those two responsibilities visible side by side."
            },
            {
                "kind": "uxVisual",
                "name": "branded",
                "variant": "detail",
                "caption": "The system separates consistent interaction roles from adaptable brand expression."
            },
            {
                "kind": "section",
                "label": "Experience behind the work",
                "thesis": "Design for the network, then respect the account.",
                "body": "At Rokt, I designed across more than 30 client pages and contributed three ad formats across more than 80 clients. That breadth informed a system that could repeat across accounts while retaining each partner’s identity. The branded UX approach brings those two scales together."
            },
            {
                "kind": "section",
                "label": "Outcome",
                "thesis": "A repeatable approach to partner expression.",
                "body": "The result is a repeatable approach to branded offers: a shared interaction structure with room for partner-specific expression. I originated the concept, connecting the craft of each placement with the needs of a platform serving many different brands."
            },
            {
                "kind": "takeaway",
                "title": "The reusable unit is a relationship.",
                "body": "A strong system gives brands room to be recognizable while keeping the customer’s task stable. That is the connection between visual craft at the placement level and product design at network scale."
            },
            {
                "kind": "confidential",
                "text": "Product views reproduce the final design. Interface comparisons and system breakdowns are explanatory compositions. Project-specific revenue and lift figures are omitted pending confirmed attribution."
            }
        ]
    },
    {
        "slug": "expedia-1p-3p",
        "title": "The booking is the beginning.",
        "client": "Expedia",
        "year": "2026",
        "role": "Design owner · post-booking UX",
        "collaboration": "Designed Expedia’s new UX.",
        "duration": "",
        "shape": "Gallery",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "An optional next step that connects a confirmed flight to the rest of the traveler’s trip.",
        "result": "A redesigned post-booking experience for hotel and onward-travel offers.",
        "status": "Final design · portfolio recreation",
        "blocks": [
            {
                "kind": "abstract",
                "text": "Booking a flight resolves one part of a trip and creates the next set of needs. I designed Expedia’s new UX to connect the completed booking with relevant hotel and onward-travel offers while keeping confirmation clear."
            },
            {
                "kind": "section",
                "label": "The problem",
                "thesis": "The transaction ends before the journey does.",
                "body": "A traveler who has booked a flight may still need somewhere to stay or a way out of the airport. The opportunity is to introduce that next step in context, while respecting the immediate need to know the original booking is complete."
            },
            {
                "kind": "section",
                "label": "The approach",
                "thesis": "Start with the confirmed trip.",
                "body": "The booking confirmation remains the anchor. The offer follows as an optional continuation, with language that names its purpose and an action that describes what happens next. The trip itself supplies the relevance; the interface does not need to manufacture urgency."
            },
            {
                "kind": "uxVisual",
                "name": "expedia",
                "caption": "The final post-booking experience translated into a journey model. Both accepting an offer and continuing without it remain possible.",
                "variant": "composition"
            },
            {
                "kind": "section",
                "label": "Design decisions",
                "thesis": "Keep the next step optional.",
                "body": "The composition distinguishes confirmation from the offer and leaves a clear way to continue without accepting. Across desktop and mobile, the priority is the same: understand the completed booking, recognize the next opportunity, and choose whether to explore it."
            },
            {
                "kind": "uxVisual",
                "name": "expedia",
                "variant": "detail",
                "caption": "The final mobile composition alongside the three priorities that govern its hierarchy."
            },
            {
                "kind": "section",
                "label": "My contribution",
                "thesis": "Design the experience around the journey.",
                "body": "I designed Expedia’s new UX, connecting placement design with the larger customer journey. The design carries the same priorities across desktop and mobile: confirmation first, a relevant next offer, and a clear choice about whether to continue."
            },
            {
                "kind": "section",
                "label": "Outcome",
                "thesis": "A relevant continuation after booking.",
                "body": "The experience connects hotel and onward-travel offers to the completed flight booking. It makes the next step relevant to the trip, while preserving confirmation and the option to continue without taking another offer."
            },
            {
                "kind": "takeaway",
                "title": "Completion can reveal the next useful question.",
                "body": "The value of a post-booking offer comes from understanding what the traveler still needs. Clear confirmation and optional continuation can work together in the same experience."
            },
            {
                "kind": "confidential",
                "text": "Product views reproduce the final design. Journey and hierarchy breakdowns rearrange it for explanation; no earlier design versions are implied."
            }
        ]
    }
]
caseStudies.push(...personalCaseStudies)

export const bySlug = (slug: string) => caseStudies.find(study => study.slug === slug)
