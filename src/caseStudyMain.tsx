import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import CaseStudyPage from "./CaseStudyPage"
import "./index.css"

const root = document.getElementById("root")!
// Each case study is its own HTML entry, and names itself on the mount node.
// Read from the element rather than from location.pathname so the page works
// unchanged at the apex domain, at the project-pages subpath and in dev.
const slug = root.dataset.slug ?? ""

createRoot(root).render(
    <StrictMode>
        <CaseStudyPage slug={slug} />
    </StrictMode>
)
