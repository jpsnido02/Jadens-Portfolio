import { projects as work } from "./content"
import { personalProjects } from "./personalProjects"

export const projectOrder = ["agent-design-operations", "branded-layouts", "uber-ads", "kalshi-dynamic-ads", "macys-bag-page", "expedia-1p-3p", "pantry-notes", "thought-atlas"]
export const projectSlug = (link = "") => link.split("/").filter(Boolean).pop() ?? ""
export const visibleProjects = projectOrder.flatMap(slug => [...work, ...personalProjects].filter(project => projectSlug(project.link) === slug))
export const projectLabels: Record<string, string> = {"uber-ads":"Uber Eats", "agent-design-operations":"Design Agents", "kalshi-dynamic-ads":"Kalshi", "macys-bag-page":"Macy’s", "branded-layouts":"Branded Offers", "expedia-1p-3p":"Expedia", "pantry-notes":"Pantry Notes", "thought-atlas":"Thought Atlas"}
export const nextProjectSlug = (slug: string) => projectOrder[(projectOrder.indexOf(slug) + 1) % projectOrder.length]

/** Homepage summaries explain the work without changing the case-study narratives. */
export const homepageProjectDetails: Record<string, { title: string; description: string; context: string }> = {
    "agent-design-operations": {
        title: "Rokt Design Agents",
        description: "Built an autonomous design agent and a dashboard to monitor and review its work.",
        context: "Internal tools · Design & development",
    },
    "branded-layouts": {
        title: "Branded Offers",
        description: "Offer experiences tailored to each customer’s transaction and the partner’s brand.",
        context: "20% lift in value per transaction in tested accounts",
    },
    "uber-ads": {
        title: "Uber Eats",
        description: "Relevant offers while customers wait for delivery.",
        context: "Contextual advertising · Product design",
    },
    "kalshi-dynamic-ads": {
        title: "Kalshi",
        description: "Showing how live market changes affect an offer’s potential payout.",
        context: "Dynamic advertising · Interaction design",
    },
    "macys-bag-page": {
        title: "Macy’s Bag Page",
        description: "Helping shoppers understand how a second item unlocks an exclusive discount.",
        context: "Commerce · Product design",
    },
    "expedia-1p-3p": {
        title: "Expedia",
        description: "Connecting a confirmed flight to the next useful part of the trip.",
        context: "Travel · Product design",
    },
    "pantry-notes": {
        title: "Pantry Notes",
        description: "Turning a grocery photo into ingredient-linked recipes.",
        context: "Independent interaction study",
    },
    "thought-atlas": {
        title: "Thought Atlas",
        description: "Exploring a spatial way to organize connected thoughts.",
        context: "Independent spatial interface study",
    },
}
