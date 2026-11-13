import { useState, type FormEvent, type ReactNode } from "react"
import "./visitor-gate.css"

const SESSION_KEY = "portfolio-visitor-access-v1"
export default function VisitorGate({ children }: { children: ReactNode }) {
    const [unlocked, setUnlocked] = useState(() => { try { return sessionStorage.getItem(SESSION_KEY) === "unlocked" } catch { return false } })
    const [password, setPassword] = useState("")
    const [error, setError] = useState(false)
    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (password !== "password") { setError(true); return }
        try { sessionStorage.setItem(SESSION_KEY, "unlocked") } catch { /* Access still works when storage is unavailable. */ }
        setUnlocked(true)
    }
    if (unlocked) return children
    return <main className="visitor-gate"><form className="visitor-gate-card" onSubmit={submit}>
        <label htmlFor="visitor-password">Password</label><input autoFocus id="visitor-password" type="password" autoComplete="current-password" value={password} onChange={event => {setPassword(event.target.value);setError(false)}} required aria-invalid={error} aria-describedby={error ? "visitor-password-error" : undefined}/>
        {error && <div id="visitor-password-error" className="visitor-gate-error" role="alert">That password isn’t right. Please try again.</div>}
        <button type="submit">View portfolio</button>
    </form></main>
}
