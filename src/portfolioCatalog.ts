import { projects as work } from "./content"
import { personalProjects } from "./personalProjects"

export const projectOrder = ["uber-ads", "agent-design-operations", "macys-bag-page", "kalshi-dynamic-ads", "branded-layouts", "rokt-catalog", "expedia-1p-3p", "pantry-notes", "thought-atlas"]
export const projectSlug = (link = "") => link.split("/").filter(Boolean).pop() ?? ""
export const visibleProjects = projectOrder.flatMap(slug => [...work, ...personalProjects].filter(project => projectSlug(project.link) === slug))
export const projectLabels: Record<string, string> = {"uber-ads":"Uber Eats", "agent-design-operations":"Design Agents", "kalshi-dynamic-ads":"Kalshi", "macys-bag-page":"Macy’s", "branded-layouts":"Branded Offers", "expedia-1p-3p":"Expedia", "pantry-notes":"Pantry Notes", "thought-atlas":"Thought Atlas"}
// External showcases belong in the gallery, but have no internal study to open.
const studyOrder = visibleProjects.filter(project => !/^https?:/.test(project.link ?? "")).map(project => projectSlug(project.link))
export const nextProjectSlug = (slug: string) => studyOrder[(studyOrder.indexOf(slug) + 1) % studyOrder.length]

export const projectBadges: Record<string, { brand: string; description: string }> = {
    "uber-ads": { brand: "Uber Eats", description: "Contextual offers" },
    "agent-design-operations": { brand: "Rokt", description: "Design agents" },
    "macys-bag-page": { brand: "Macy’s", description: "Bag incentives" },
    "kalshi-dynamic-ads": { brand: "Kalshi", description: "Live market offers" },
    "rokt-catalog": { brand: "eBay", description: "Direct product ads" },
    "branded-layouts": { brand: "Rokt", description: "Branded offers" },
    "expedia-1p-3p": { brand: "Expedia", description: "Post-booking offers" },
    "pantry-notes": { brand: "Pantry Notes", description: "Photo-to-recipe notes" },
    "thought-atlas": { brand: "Thought Atlas", description: "Connected notes" },
}
