import { useEffect, useRef, useState, type CSSProperties } from "react"
import useStudySequence from "./useStudySequence"
import "./pantry-notes.css"

/**
 * 00 home · 01 open camera pressed · 02 iPhone camera · 03 shutter · 04 flash · 05 loading
 * 06 photo renders · 07 Post-its drop · 08 notes · 09 tap · 10 note → card · 11 recipe · 12 scrolled · 13 curtain
 */
const TIMING = [1600,260,2200,260,380,1900,700,900,3400,360,850,3500,6500,600]
const POSTER = 8

const icon = { fill:"none", stroke:"currentColor", strokeLinecap:"round", strokeLinejoin:"round" } as const
function CameraIcon({size=18}:{size?:number}) { return <svg width={size} height={size} viewBox="0 0 24 24" {...icon} strokeWidth="1.7" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v13H3Z"/><circle cx="12" cy="13" r="4"/></svg> }
function BookIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" {...icon} strokeWidth="1.6" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></svg> }
function ArrowUpRight({size=11}:{size?:number}) { return <svg width={size} height={size} viewBox="0 0 24 24" {...icon} strokeWidth="2.2" aria-hidden="true"><path d="M7 17 17 7M8.5 7H17v8.5"/></svg> }
function Check() { return <svg width="18" height="18" viewBox="0 0 18 18" {...icon} strokeWidth="1.8" aria-hidden="true"><path d="m5 9.5 2.6 2.5L13 6.5"/></svg> }
function StatusBar() {
    return <div className="pnt-status"><b>9:41</b><svg width="78" height="13" viewBox="0 0 78 13" fill="none" aria-hidden="true"><rect y="8" width="3" height="4" rx="1" fill="#fff"/><rect x="4.5" y="6" width="3" height="6" rx="1" fill="#fff"/><rect x="9" y="3.5" width="3" height="8.5" rx="1" fill="#fff"/><rect x="13.5" y="1" width="3" height="11" rx="1" fill="#fff"/><path d="M29 3.2c2.7 0 5.1 1 6.9 2.7l1.2-1.3C35 2.6 32.1 1.4 29 1.4s-6 1.2-8.1 3.2l1.2 1.3C23.9 4.2 26.3 3.2 29 3.2Zm0 3.6c1.6 0 3 .6 4.1 1.6l1.2-1.3C32.9 5.8 31 5 29 5s-3.9.8-5.3 2.1l1.2 1.3c1.1-1 2.5-1.6 4.1-1.6Zm0 3.6c.6 0 1.1.2 1.5.6L29 12.6l-1.5-1.6c.4-.4.9-.6 1.5-.6Z" fill="#fff"/><rect x="50.5" y="1" width="23" height="11" rx="3.2" stroke="#fff" strokeOpacity=".4"/><rect x="52.5" y="3" width="19" height="7" rx="1.6" fill="#fff"/><path d="M75.5 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="#fff" fillOpacity=".45"/></svg></div>
}
function TabBar() {
    return <nav className="pnt-tabs"><span className="is-active"><CameraIcon/>New groceries</span><span><BookIcon/>Recipe book</span></nav>
}
const NOTES = [
    {id:"beans",title:"Black bean quesadillas",meta:"20 min",x:24,y:262,rotate:-6,fill:"#fff0b1",delay:80},
    {id:"spinach",title:"Spinach & egg skillet",meta:"15 min",x:206,y:206,rotate:5,fill:"#f7df88",delay:280},
    {id:"pasta",title:"Lemony spinach pasta",meta:"20 min · for two",x:172,y:452,rotate:-4,fill:"#ffe487",delay:480},
]
const INGREDIENTS = ["180 g fusilli", "100 g baby spinach", "200 g cherry tomatoes, halved", "1 lemon, zested and juiced", "60 g Pepper Jack, finely grated", "1 tbsp olive oil", "1 tbsp butter", "Salt and freshly ground black pepper"]
const STEPS = [
    "Bring a large pot of generously salted water to a boil. Add the fusilli and cook until just al dente, following the packet timing. Before draining, scoop out a mug of the starchy cooking water and set it aside.",
    "While the pasta cooks, warm the olive oil in a wide skillet over medium heat. Add the halved tomatoes with a pinch of salt. Cook for 5–7 minutes, stirring occasionally, until they soften and begin to release their juices.",
    "Stir the spinach into the tomatoes a handful at a time. Let each handful wilt before adding the next. Add the butter, lemon zest and 2 tablespoons of lemon juice, then turn the heat down low.",
    "Add the drained pasta and a splash of the reserved cooking water. Toss until the juices coat the fusilli, then take the pan off the heat. Stir in the finely grated Pepper Jack a little at a time, adding more pasta water as needed for a glossy sauce.",
    "Taste and adjust with salt, black pepper and more lemon juice if you like. Divide between two bowls and serve straight away, with a little extra lemon zest over the top."
]

export default function PantryNotes({playing}:{playing:boolean}) {
    const phase=useStudySequence(TIMING,playing,POSTER)
    const ref=useRef<HTMLDivElement>(null)
    const [scale,setScale]=useState(0)
    useEffect(()=>{
        const observer=new ResizeObserver(([entry])=>setScale(Math.max(0,Math.min((entry.contentRect.width-28)/473,(entry.contentRect.height-22)/932))))
        observer.observe(ref.current!)
        return()=>observer.disconnect()
    },[])
    const flags = {
        // Home stays mounted under the camera sheet while it slides up.
        "pnt-home": phase<=4 || phase===13,
        "pnt-camera": phase>=2 && phase<=4,
        "pnt-app": phase>=5 && phase<=12,
        "pnt-loading": phase<=5,
        "pnt-heading-in": phase>=6,
        "pnt-notes-in": phase>=7 && phase<=10,
        "pnt-footer-in": phase>=8 && phase<=9,
        "pnt-tabs-in": phase<=1 || phase>=8,
        "pnt-recipe": phase>=10 && phase<=12,
        "pnt-results-gone": phase>=11,
        "pnt-scrolled": phase===12,
        "pnt-curtain": phase===13,
    }
    const className = Object.entries(flags).filter(([,on])=>on).map(([name])=>name).join(" ")
    return <div ref={ref} className={`pantry-phone-study ${className}`} data-pantry-phase={phase}>
        <div className="pnt-device" style={{transform:`translate(-50%,-50%) scale(${scale})`}}>
            {/* The screen bleeds 6 px under the bezel so its corners never show past the frame's curve. */}
            <div className="pnt-screen"><div className="pnt-content">
                {/* 00–01 · Home */}
                <section className="pnt-home-screen">
                    <strong className="pnt-wordmark">pantry notes</strong>
                    <h3 className="pnt-home-title">Capture your<br/>grocery haul.</h3>
                    <p className="pnt-home-body">We’ll gather your ingredients to make something yum for the week.</p>
                    <div className="pnt-capture"><svg className="pnt-capture-corners" width="200" height="150" viewBox="0 0 200 150" fill="none" aria-hidden="true"><path d="M2 26V8a6 6 0 0 1 6-6h18M174 2h18a6 6 0 0 1 6 6v18M198 124v18a6 6 0 0 1-6 6h-18M26 148H8a6 6 0 0 1-6-6v-18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg><CameraIcon size={34}/></div>
                    <div className={`pnt-cta ${phase===1?"is-pressed":""}`}><CameraIcon size={22}/>Open camera<i className="pnt-cta-ring"/></div>
                </section>

                {/* 05–12 · App */}
                <section className="pnt-app-screen">
                    <header className="pnt-app-header"><svg width="24" height="24" viewBox="0 0 24 24" {...icon} strokeWidth="1.8" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><strong>pantry notes</strong></header>

                    <div className="pnt-results">
                        <h3 className="pnt-results-title">Dinner on the board.</h3>
                        <div className="pnt-photo">
                            <img src="/projects/pantry/grocery-haul.jpg" alt="A photographed grocery haul, with recipe notes placed over matching ingredients"/>
                            <div className="pnt-veil"/>
                            <div className="pnt-loader"><span className="pnt-spinner"/><strong>Finding some yummy ideas…</strong></div>
                            
                        </div>
                        {NOTES.map(note=><article key={note.id} className={`pnt-note pnt-note-${note.id} ${note.id==="pasta"&&phase===9?"is-tapped":""}`} style={{left:note.x,top:note.y,background:note.fill,"--note-rotate":`${note.rotate}deg`,"--note-delay":`${note.delay}ms`} as CSSProperties}>
                            <h4>{note.title}</h4><span className="pnt-note-meta">{note.meta}<ArrowUpRight/></span><i className="pnt-fold"/>{note.id==="pasta"&&<i className="pnt-tap-ring"/>}
                        </article>)}
                        <div className="pnt-results-footer"><span>We’ve found possibilities</span><b>Tap a note to make it yours<ArrowUpRight size={13}/></b></div>
                    </div>
                    <div className="pnt-recipe-cards"><article className="pnt-recipe-card"><div className="pnt-recipe-track">
                        <div className="pnt-recipe-hero"><img src="/projects/pantry/lemony-spinach-pasta.jpg" alt="Lemony fusilli with spinach and tomatoes"/><span className="pnt-saved"><svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true"><path d="M1 0h10v16l-5-3-5 3Z"/></svg>Saved</span></div>
                        <div className="pnt-recipe-body"><h3>Lemony spinach pasta</h3><dl className="pnt-recipe-meta"><div><dt>Yield</dt><dd>2 servings</dd></div><div><dt>Time</dt><dd>20 minutes</dd></div></dl><p className="pnt-recipe-intro">A bright, comforting dinner from the groceries already on your counter. Sweet tomatoes and wilted spinach tuck into the pasta, while lemon and a little Pepper Jack make a silky, gently warming sauce.</p><div className="pnt-start-cooking">Start Cooking</div>
                        <h4>Ingredients</h4><ul>{INGREDIENTS.map(item=><li key={item}><i><Check/></i>{item}</li>)}</ul><h4>Preparation</h4><ol>{STEPS.map((step,i)=><li key={step}><b>Step {i+1}</b><p>{step}</p></li>)}</ol></div>
                    </div></article></div>
                </section>

                {/* 02–04 · The system camera slides up over the app */}
                <section className="pnt-camera-screen">
                    <div className="pnt-camera-top"><svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true"><circle cx="17" cy="17" r="16" fill="#1C1C1E"/><path d="M18.5 7.5 11 18.5h5.2L15 26.5l7.6-11h-5.3l1.2-8Z" fill="#fff"/><path d="M9 9l16 16" stroke="#1C1C1E" strokeWidth="3.2"/><path d="M9 9l16 16" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/></svg><svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true"><circle cx="17" cy="17" r="16" fill="#1C1C1E"/><path d="M11.5 19.5 17 14l5.5 5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true"><circle cx="17" cy="17" r="16" fill="#1C1C1E"/><circle cx="17" cy="17" r="3.2" fill="#FFD60A"/><circle cx="17" cy="17" r="6.2" stroke="#FFD60A" strokeWidth="1.5"/><circle cx="17" cy="17" r="9.3" stroke="#FFD60A" strokeWidth="1.4" strokeDasharray="1.6 1.9"/></svg></div>
                    <div className="pnt-viewfinder"><img src="/projects/pantry/grocery-haul.jpg" alt=""/><div className="pnt-zoom"><span>.5</span><span className="is-active">1×</span><span>2</span></div></div>
                    <span className="pnt-mode">PHOTO</span>
                    <div className="pnt-camera-controls"><span className={`pnt-last-photo ${phase===4?"has-photo":""}`}/><span className={`pnt-shutter ${phase===3?"is-pressed":""}`}><i/></span><svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#1C1C1E"/><path d="M15.5 21a9 9 0 0 1 15.6-4.2M32.5 27a9 9 0 0 1-15.6 4.2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M31.6 12.4v4.8h-4.8M16.4 35.6v-4.8h4.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                    <div className="pnt-flash"/>
                </section>

                <TabBar/>
                <StatusBar/>
                <div className="pnt-home-indicator"/>
                <div className="pnt-loop-curtain"/>
            </div></div>
            <img className="pnt-phone-frame" src="/projects/iphone-frame.png" alt=""/>
        </div>
    </div>
}
