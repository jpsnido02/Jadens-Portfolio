// Use the project title verbatim when it already omits the partner name.
export const railProjectTitle: Record<string, string> = {
    "uber-ads": "Contextual Advertising",
    "kalshi-dynamic-ads": "Dynamic Advertising",
    "macys-bag-page": "Bag Page",
    "expedia-1p-3p": "Upsells",
}

const images: Record<string, string> = {
    "uber-ads": "icon-ubereats.svg",
    "agent-design-operations": "icon-rokt-logo.svg",
    "kalshi-dynamic-ads": "icon-kalshi.svg",
    "macys-bag-page": "icon-macys.svg",
    "expedia-1p-3p": "icon-expedia.svg",
}

export default function ProjectRailMark({ slug, title }: { slug: string; title: string }) {
    if (slug === "thought-atlas") {
        return <span className="rail-thought" aria-hidden="true" />
    }
    if (slug === "pantry-notes") {
        return <span className="rail-pantry" aria-hidden="true">pantry<br />notes</span>
    }
    if (slug === "branded-layouts") {
        return <span className="rail-partners" aria-hidden="true">
            {["fanatics", "gap", "bestbuy"].map(brand =>
                <img key={brand} src={`/projects/partners/${brand}-app.jpg`} alt="" />
            )}
        </span>
    }
    return images[slug]
        ? <img className="rail-logo" src={`/projects/${images[slug]}`} alt="" />
        : <span>{title}</span>
}
