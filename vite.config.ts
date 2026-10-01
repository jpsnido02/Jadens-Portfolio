import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

/** One HTML entry per case study, so each gets a real, shareable URL. */
const caseStudies = [
    "macys-bag-page",
    "uber-ads",
    "branded-layouts",
    "shoppable-pitching-platform",
    "shoppable-config",
    "mcdonalds-kiosk",
    "expedia-1p-3p",
]

export default defineConfig({
    // Relative asset paths, so the build works both at the project-pages
    // subpath (jpsnido02.github.io/Jadens-Portfolio/) and at the apex custom
    // domain. An absolute "/" base 404s on the former. Vite computes the
    // relative prefix per entry, so the nested case study pages reach back up
    // to the shared /assets correctly.
    base: "./",
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                // A multi-page build rather than a router: every case study is
                // a real file on disk, so GitHub Pages serves it with no 404
                // fallback and a crawler gets the page without running any
                // JavaScript. Paths are resolved against the project root,
                // which avoids pulling in @types/node for __dirname.
                home: "index.html",
                ...Object.fromEntries(
                    caseStudies.map((slug) => [slug, `work/${slug}/index.html`])
                ),
            },
        },
    },
})
