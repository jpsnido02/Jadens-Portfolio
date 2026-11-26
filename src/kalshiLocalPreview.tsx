/// <reference types="vite/client" />

import { createRoot } from "react-dom/client"
import KalshiPreview from "./KalshiPreview"

// This dev-only entry is intentionally excluded from Vite's production inputs.
if (import.meta.env.DEV) {
    const autoplay = new URLSearchParams(window.location.search).get("autoplay") === "1"
    createRoot(document.getElementById("root")!).render(<KalshiPreview playing interactive={!autoplay} />)
}
