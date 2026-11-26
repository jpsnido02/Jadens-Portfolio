import type { CSSProperties } from "react"
import "./pantry-editorial.css"

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const

function Arrow() {
    return <svg viewBox="0 0 24 24" {...stroke}><path d="M7 17 17 7M7 7h10v10"/></svg>
}

function ScreenHeader() {
    return <><div className="pantry-plate-status"><span>9:41</span><svg viewBox="0 0 54 14" fill="currentColor"><path d="M0 9h3v4H0zm5-3h3v7H5zm5-3h3v10h-3zm5-3h3v13h-3z"/><rect x="29" y="2" width="21" height="10" rx="2" fill="none" stroke="currentColor"/><rect x="31" y="4" width="17" height="6" rx="1"/><path d="M52 5h2v4h-2z"/></svg></div><div className="pantry-plate-header"><svg viewBox="0 0 24 24" {...stroke}><path d="m14 5-7 7 7 7"/></svg><span>pantry notes</span></div></>
}

function Note({ kind, title, time }: { kind: string; title: string; time: string }) {
    return <div className={`pantry-lifted-note pantry-lifted-note--${kind}`}><strong>{title}</strong><span>{time}<Arrow/></span><i/></div>
}

/** An art-directed view of the existing UI, built from separate live elements.
 * The original autoplay demo remains below the introduction, unchanged. */
export default function PantryEditorial({ playing }: { playing: boolean }) {
    return <figure id="pantry-notes-opening" className="pantry-editorial-stage" role="img" aria-label="Pantry Notes: a grocery photograph with handwritten recipe suggestions lifting off the screen. The Lemony spinach pasta note leads to its opened recipe, with a raised dish photograph, Saved badge, yield, time, and Start Cooking action." style={{ "--pantry-editorial-play": playing ? "running" : "paused" } as CSSProperties}>
        <div className="pantry-editorial-scene" aria-hidden="true">
            <div className="pantry-editorial-ground"/>
            <div className="pantry-screen-plane pantry-screen-plane--groceries">
                <ScreenHeader/>
                <h3>Dinner on<br/>the board.</h3>
                <div className="pantry-plate-groceries"><img src="/projects/pantry/grocery-haul.jpg" alt="" width="1200" height="948"/></div>
                <div className="pantry-screen-note"><strong>Spinach &amp;<br/>egg skillet</strong><span>15 min <Arrow/></span></div>
                <div className="pantry-plate-prompt">Tap a note to make it yours <Arrow/></div>
                <div className="pantry-plate-tabs"><span>New groceries</span><span>Recipe book</span></div>
                <div className="pantry-plate-home"/>
            </div>
            <div className="pantry-screen-plane pantry-screen-plane--recipe">
                <ScreenHeader/>
                <div className="pantry-plate-recipe-paper">
                    <div className="pantry-plate-photo-space"/>
                    <div className="pantry-plate-recipe-copy">
                        <h3>Lemony<br/>spinach pasta</h3>
                        <dl><div><dt>Yield</dt><dd>2 servings</dd></div><div><dt>Time</dt><dd>20 minutes</dd></div></dl>
                        <p>A bright, comforting dinner from the groceries already on your counter.</p>
                        <div className="pantry-plate-cook">Start Cooking</div>
                        <h4>Ingredients</h4>
                        <ul><li>180 g fusilli</li><li>100 g baby spinach</li><li>200 g cherry tomatoes, halved</li></ul>
                    </div>
                </div>
                <div className="pantry-plate-home"/>
            </div>
            <Note kind="beans" title="Black bean quesadillas" time="20 min"/>
            <Note kind="pasta" title="Lemony spinach pasta" time="20 min · for two"/>
            <div className="pantry-lifted-dish"><img src="/projects/pantry/lemony-spinach-pasta.jpg" alt="" width="1200" height="675"/><span className="pantry-lifted-saved"><svg viewBox="0 0 12 16" fill="currentColor"><path d="M1 0h10v16l-5-3-5 3Z"/></svg>Saved</span></div>
        </div>
    </figure>
}
