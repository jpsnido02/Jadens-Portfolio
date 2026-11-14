import { personalCaseStudies } from "./personalProjects"

/** Case-study narratives use supplied project facts and clearly scoped portfolio recreations. */

/** Media width tiers. Varying these is the main pacing device. */
export type FigureWidth = "bleed" | "full" | "half" | "strip"

export type Block =
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
    {
        "slug": "uber-ads",
        "title": "Uber Eats Contextual Advertising",
        "client": "Uber Eats",
        "year": "2026",
        "role": "Contextual offer UX and visual design",
        "duration": "",
        "shape": "Gallery",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "Relevant offers during the wait between ordering and delivery.",
        "result": "One placement connects order context to a relevant next action.",
        "status": "Recreated prototype",
        "blocks": [
            {
                "kind": "abstract",
                "text": "The wait after an Uber Eats order is a distinct moment: the purchase is complete, but the customer is still in the app. I designed contextual offers around that moment rather than treating it as an interchangeable ad slot."
            },
            {
                "kind": "section",
                "label": "Context",
                "thesis": "An offer that belongs to the wait.",
                "body": "Keep the order visible and give the offer a specific reason to be there. The Spotify example connects listening to the delivery wait; the coffee example connects the offer to breakfast."
            },
            {
                "kind": "evidence",
                "name": "uber-context",
                "caption": "Order context, offer, and customer action remain connected. These are recreated portfolio examples."
            },
            {
                "kind": "section",
                "label": "Design decision",
                "thesis": "One placement, different kinds of relevance.",
                "body": "A consistent container holds different partner assets, messages, and actions. The primary action names what happens next, and the secondary action lets the customer continue without accepting."
            },
            {
                "kind": "takeaway",
                "title": "Reflection",
                "body": "The contextual message matters as much as the placement. Showing why an offer belongs in this moment makes the interaction easier to understand than adding more visual emphasis."
            },
            {
                "kind": "confidential",
                "text": "Screens are recreated and simplified for this portfolio. The demo does not represent a production data connection or a measured campaign result."
            }
        ]
    },
    {
        "slug": "macys-bag-page",
        "title": "A second item. An exclusive discount.",
        "client": "Macy’s",
        "year": "2026",
        "role": "Bag-page offer UX and visual design",
        "duration": "",
        "shape": "Iteration",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "Give customers a clear incentive to add a second item to their bag.",
        "result": "The second addition unlocks an exclusive price on a third item.",
        "status": "Recreated bag-page flow",
        "blocks": [
            {
                "kind": "abstract",
                "text": "The bag already contains a shirt. The design introduces a simple next step: add another suggested item to unlock an exclusive discount. The incentive needs to be understood before the customer acts, and its unlocked state needs to be clear afterward."
            },
            {
                "kind": "section",
                "label": "The constraint",
                "thesis": "Make the condition visible before the reward.",
                "body": "The suggested item and the locked discount are shown together. Customers can see what they need to add and the price that action will unlock, without leaving the bag."
            },
            {
                "kind": "evidence",
                "name": "macys-decision",
                "caption": "The two states isolate the decision: add a second item, then see the exclusive discount become available."
            },
            {
                "kind": "section",
                "label": "The decision",
                "thesis": "Keep the change where the customer is looking.",
                "body": "Confirmation stays on the Add to bag control. The exclusive discount then changes from unavailable to available, keeping the product and its new price in the same location."
            },
            {
                "kind": "section",
                "label": "The result",
                "thesis": "Show the updated bag, not just a successful click.",
                "body": "The demonstration ends with the discounted item added and the bag state updated. This makes the benefit of the sequence visible. No conversion lift is claimed here."
            },
            {
                "kind": "takeaway",
                "title": "Reflection",
                "body": "An incentive is only useful when its condition and reward are equally clear. The locked and unlocked states carry that explanation more effectively than an additional promotional banner."
            }
        ]
    },
    {
        "slug": "agent-design-operations",
        "title": "Agent Design Operations",
        "client": "Rokt",
        "year": "2026",
        "role": "Agent workflow, review UX, and interface design",
        "duration": "",
        "shape": "System",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "A workspace for an autonomous designer managing UX across over 5,000 active account pages.",
        "result": "A clear human review and feedback step before work is approved.",
        "status": "Workflow prototype · illustrative tasks",
        "blocks": [
            {
                "kind": "abstract",
                "text": "An autonomous designer needs more than a way to start tasks. It needs a visible queue, a readable build state, and a deliberate handoff where I can inspect its work, give feedback, or approve it."
            },
            {
                "kind": "section",
                "label": "The system",
                "thesis": "Four stages, one clear owner.",
                "body": "Queue, Building, For review, and Complete separate work waiting for the agent from work waiting for me. A ticket carries the same account and design task through each stage."
            },
            {
                "kind": "section",
                "label": "The handoff",
                "thesis": "Review the output before the build metadata.",
                "body": "A representative generated design sits beside the review criteria. Brand treatment, responsive layout, and the customer action are visible together so the decision is grounded in the proposed experience."
            },
            {
                "kind": "evidence",
                "name": "agent-review",
                "caption": "A recreated example of the review handoff. The generated output and review criteria lead; ticket metadata stays secondary."
            },
            {
                "kind": "section",
                "label": "The decision",
                "thesis": "Feedback is part of the workflow.",
                "body": "Requesting changes sends the ticket back to Building with the reviewer’s feedback. Approval sends it to Complete. These are distinct decisions, rather than a generic done state."
            },
            {
                "kind": "takeaway",
                "title": "Reflection",
                "body": "Autonomy makes the review boundary more important. The system should make the proposed output easy to inspect and leave the final approval unmistakably human."
            },
            {
                "kind": "confidential",
                "text": "Account names and tasks illustrate the workflow. The portfolio animation cannot edit accounts, run a production agent, or publish designs."
            }
        ]
    },
    {
        "slug": "branded-layouts",
        "title": "Branded Offers",
        "client": "Rokt",
        "year": "2026",
        "role": "Branded offer system and scaling workflow",
        "duration": "",
        "shape": "System",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "One offer system adapted to the identity of the partner showing it.",
        "result": "20% value-per-transaction lift in tested accounts.",
        "status": "Verified test result",
        "blocks": [
            {
                "kind": "abstract",
                "text": "A shared offer needs to feel at home across different partner experiences. I designed branded treatments that preserve the underlying offer structure while adapting typography, color, and controls to the partner."
            },
            {
                "kind": "section",
                "label": "The system",
                "thesis": "Keep the offer stable. Let the brand change.",
                "body": "The greeting, offer content, primary action, and decline action keep their roles. Brand tokens change how those elements look without changing what the customer needs to do."
            },
            {
                "kind": "evidence",
                "name": "branded-comparison",
                "caption": "Recreated offer anatomy held side by side for comparison. The demo above shows the supplied partner screens."
            },
            {
                "kind": "section",
                "label": "The outcome",
                "thesis": "20% more value per transaction.",
                "body": "The branded treatments delivered a verified 20% value-per-transaction lift in the accounts tested. That result is scoped to those tests; it is not presented as a network-wide result."
            },
            {
                "kind": "takeaway",
                "title": "Reflection",
                "body": "A scalable brand system preserves the customer’s understanding while changing the visual language. The reusable part is the relationship between the elements, not a single frozen skin."
            }
        ]
    },
    {
        "slug": "expedia-1p-3p",
        "title": "Expedia Upsell Experience",
        "client": "Expedia",
        "year": "2026",
        "role": "Post-booking offer UX and visual design",
        "duration": "",
        "shape": "Gallery",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "Connect a completed flight booking to the next part of the trip.",
        "result": "Hotel and onward-travel offers presented inside the booking flow.",
        "status": "Recreated interface",
        "blocks": [
            {
                "kind": "abstract",
                "text": "A confirmed flight creates a relevant next question: where will the traveler stay, or how will they get there? The placement connects those offers to the trip the customer has just booked."
            },
            {
                "kind": "section",
                "label": "The context",
                "thesis": "Continue the trip, not the checkout.",
                "body": "Booking confirmation remains the anchor. The hotel or onward-travel offer follows as an optional next action, with a clear way to continue without taking it."
            },
            {
                "kind": "evidence",
                "name": "expedia-proof",
                "caption": "The supplied desktop and mobile composition, displayed in full rather than cropped into a generic media box."
            },
            {
                "kind": "section",
                "label": "The design decision",
                "thesis": "Keep source and next action understandable.",
                "body": "The offer explains what it is for and gives the customer a specific action. The surrounding confirmation maintains the connection to the original booking."
            },
            {
                "kind": "takeaway",
                "title": "Reflection",
                "body": "The next offer feels more coherent when it follows a need created by the completed booking. The trip supplies the context; the interface should not have to manufacture urgency."
            }
        ]
    },
    {
        "slug": "kalshi-dynamic-ads",
        "title": "Kalshi Dynamic Advertising",
        "client": "Kalshi",
        "year": "2026",
        "role": "Dynamic creative and motion design",
        "duration": "",
        "shape": "Gallery",
        "paletteIndex": 0,
        "numbered": false,
        "next": "",
        "preview": "An advertisement that responds when the market changes.",
        "result": "A five-yard loss precedes a lower SF chance and higher potential payout.",
        "status": "Illustrative market animation",
        "blocks": [
            {
                "kind": "abstract",
                "text": "The ad keeps the selected team and $25 amount anchored while the market chance and potential payout update. A short football sequence gives the change a visible context."
            },
            {
                "kind": "section",
                "label": "The interaction",
                "thesis": "One event. Two connected values.",
                "body": "San Francisco loses five yards. The illustrative win chance falls from 18% to 16%, while the potential payout rises from $131.16 to $147.56. Both values change in place so their relationship is easy to follow."
            },
            {
                "kind": "section",
                "label": "The hierarchy",
                "thesis": "Keep the decision in the foreground.",
                "body": "The selected team, market chance, entry amount, and potential payout carry the most weight. The field sequence supports the change; it does not compete with the offer."
            },
            {
                "kind": "takeaway",
                "title": "Reflection",
                "body": "The motion is clearest when it explains a relationship. Keeping both values anchored makes the change legible without animating the entire advertisement."
            },
            {
                "kind": "confidential",
                "text": "The scenario and quotes are illustrative. The animation is not connected to live market data and does not calculate an executable quote."
            }
        ]
    }
]
caseStudies.push(...personalCaseStudies)

export const bySlug = (slug: string) => caseStudies.find(study => study.slug === slug)
