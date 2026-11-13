import VisitorGate from "./VisitorGate"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <VisitorGate><App /></VisitorGate>
    </StrictMode>
)
