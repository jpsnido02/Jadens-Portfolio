import { projects as work } from "./content"
import { personalProjects } from "./personalProjects"

export const projectOrder = ["uber-ads", "agent-design-operations", "kalshi-dynamic-ads", "macys-bag-page", "branded-layouts", "expedia-1p-3p", "pantry-notes", "thought-atlas"]
export const projectSlug = (link = "") => link.split("/").filter(Boolean).pop() ?? ""
export const visibleProjects = projectOrder.flatMap(slug => [...work, ...personalProjects].filter(project => projectSlug(project.link) === slug))
export const projectLabels: Record<string, string> = {"uber-ads":"Uber Eats", "agent-design-operations":"Agent Design Operations", "kalshi-dynamic-ads":"Kalshi", "macys-bag-page":"Macy’s", "branded-layouts":"Branded Offers", "expedia-1p-3p":"Expedia", "pantry-notes":"Pantry Notes", "thought-atlas":"Thought Atlas"}
export const nextProjectSlug = (slug: string) => projectOrder[(projectOrder.indexOf(slug) + 1) % projectOrder.length]
