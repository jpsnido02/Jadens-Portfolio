import {
    Fragment,
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type ReactNode,
} from "react"
import { IntroIcon, resolveIntroIcon, type IntroIconName } from "./icons"
import { PALETTES, type Palette } from "./theme"
import { CONTENT_MAX_WIDTH, FONT_FAMILY } from "./tokens"
import ShoppableConfigLoop from "./ShoppableConfigLoop"
import BrandedLayoutsLoop from "./BrandedLayoutsLoop"
import { HeroStage } from "./LoopProgress"
import PartnerAgentLoop from "./PartnerAgentLoop"
import UberAdsLoop from "./UberAdsLoop"
import MacysBagLoop from "./MacysBagLoop"

export interface ProjectData {
    title: string
    image: { src: string; alt: string }
    category: string
    year: string
    description: string
    tags?: string[]
    link?: string
    mediaType?: "image" | "video" | "component"
    videoUrl?: string
    /**
     * "contain" sits the artwork whole on white instead of filling the pane.
     * A landscape mockup cropped to a tall pane is zoomed in past the point
     * of being readable, which is what "cover" does to it.
     */
    imageFit?: "cover" | "contain"
    /**
     * A different crop for a phone. A landscape device mockup contained in a
     * ~343px pane puts the whole UI at about a sixth scale, which no amount of
     * fitting makes readable — the answer is to show less of it, closer.
     */
    imageMobile?: string
    /** Marks the project as still in progress, badged on the card. */
    comingSoon?: boolean
    /** Renders a live component in the hero pane instead of artwork. */
    component?:
        | "uber-loop"
        | "shoppable-config"
        | "branded-shuffle"
        | "partner-agent"
        | "macys-bag"
    /** Fills the card's thumbnail square. Left empty it stays a plain plate. */
    thumb?: { src: string; alt: string }
    /**
     * Gives the thumbnail slot over to the shared partner rotation, so the
     * icon there follows the same brand the hero's carousel is showing. For
     * the project that covered many of them: a row of marks all at once was
     * tiring to look at, where one slot cycling says the same thing and leaves
     * the card's rhythm matching every other card.
     */
}

export interface IntroLink {
    label: string
    url: string
    /** Overrides the icon inferred from the label and URL. */
    icon?: IntroIconName
}

export interface PortfolioScrollProps {
    projects: ProjectData[]
    /** First line of the intro, e.g. "i'm jaden ✌️". */
    introHeadline?: string
    /** The line under it, set in the same heavy face. */
    introRole?: string
    introTagline?: string
    /** Words the inline CTA cycles through on hover. */
    ctaWords?: string[]
    /** Verbs the intro rotates through, one at a time. */
    introVerbs?: string[]
    /** Shown above the headline. Swap the src for a memoji or a photo. */
    introAvatar?: { src: string; alt: string }
    introLinks?: IntroLink[]
    /** Multiplier applied to wheel delta. */
    scrollSpeed?: number
    /** 0–1: how quickly the view catches up to the scroll target. */
    lerpFactor?: number
    /** How many cards are rendered either side of the active one. */
    bufferSize?: number
    maxVelocity?: number
    snapDuration?: number
    palette?: Palette
    titleFont?: CSSProperties
    bodyFont?: CSSProperties
    /** Zoom on the hero media, which the parallax pans within. */
    imageScale?: number
}

const CONFIG = {
    MINIMAP_HEIGHT: 250,
    CARD_GAP: 5,
    /** Gaps from the third card outward are this much tighter. */
    FAR_GAP_TIGHTEN: 16,
    /** How many gaps either side of the focus keep the full pitch. */
    FULL_PITCH_CARDS: 2,
    /** Added to every unfocused card's opacity. */
    UNFOCUSED_OPACITY_LIFT: 0.15,
    /** Slack above the focused card so its hover lift is not clipped. */
    HOVER_HEADROOM: 8,
    /** Room around the focused card on mobile, shown as a neighbour peek. */
    CARD_PEEK: 40,
    /**
     * The same peek on a phone, where the hero is competing for the screen
     * and a neighbour only has to be legible as one, not read. Half of it
     * sits above the focused card, since the card is centred in the track —
     * so this is also half the gap between the hero and the card.
     */
    CARD_PEEK_MOBILE: 16,
    /** How long each intro verb holds before the next slides up. */
    VERB_INTERVAL: 2200,
    /** How long one verb takes to travel. */
    VERB_TRAVEL: 520,
    /** A swipe past this many pixels advances one project. */
    SWIPE_DISTANCE: 44,
    /** …or past this speed, in pixels per millisecond. */
    SWIPE_VELOCITY: 0.28,
    /** Extra travel per mouse-wheel notch, on top of scrollSpeed. */
    WHEEL_NOTCH_GAIN: 2.6,
    /** Softens the mobile track's edges so neighbours fade out of view. */
    TRACK_FADE:
        "linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)",
    /** Superellipse used by the card, the hero and the card thumbnail. */
    CORNER_SHAPE: "superellipse(1.6)",
}

/** Hover key sharing the link indices' state. */
const CTA_HOVER_KEY = -1

/** Hairline around the key's surface. Counted into its height, since it
 * grows the box and the line above has to clear it. */
const CTA_BORDER = 1

/** Lifts the key onto the text's optical centre. */
const CTA_BASELINE_NUDGE = 0.4

/** The burst is parked for now; flip this to bring it back. */
const CLICK_BURST_ENABLED = false

/** Spokes of the click burst, evenly spaced like the reference. */
const BURST_SPOKES = [0, 45, 90, 135, 180, 225, 270, 315]

/** Case studies are pages on this site; only real off-site links get a tab. */
/**
 * Whether a card opens anything.
 *
 * Off for now: the case studies behind the cards are not ready to be read, so
 * nothing should navigate to them. The cards are otherwise untouched — the
 * label and the arrow still say "View Project", because the design is what it
 * is and the only thing missing is the page at the other end. What does go is
 * everything that promises a click: the href, the keyboard stop, the pointer
 * cursor and the hover. Turning them back on is this one line.
 */
const LINKS_ENABLED = false

const isExternal = (href?: string) => Boolean(href && /^[a-z]+:/i.test(href))

const lerp = (start: number, end: number, factor: number) =>
    start + (end - start) * factor

/**
 * Renders `{role}` and `{rokt}` as emphasised inline text and `{clicks}` as the
 * pressable key, so each reads as part of the sentence rather than as chrome.
 */
const renderTagline = (
    text: string,
    role: ReactNode,
    rokt: ReactNode,
    clicks: ReactNode,
    verb: ReactNode,
    textLineHeight: number,
    keyLineHeight: number,
) =>
    text.split("\n").map((line, li) => (
        <span
            key={li}
            style={{
                display: "block",
                // Evens out the wrap rather than filling line one and leaving
                // a stub. Safe here because the key's label sits in a grid
                // stack sized to its widest word, so it never changes width
                // and cannot re-trigger the balance mid-hover.
                ...({ textWrap: "balance" } as object),
                // Only the line carrying the key pays for its height.
                lineHeight: `${
                    line.includes("{clicks}") ? keyLineHeight : textLineHeight
                }px`,
            }}
        >
            {line
                .split(/(\{role\}|\{rokt\}|\{clicks\}|\{verb\})/)
                .map((part, i) => {
                    if (part === "{role}")
                        return <Fragment key={i}>{role}</Fragment>
                    if (part === "{rokt}")
                        return <Fragment key={i}>{rokt}</Fragment>
                    if (part === "{clicks}")
                        return <Fragment key={i}>{clicks}</Fragment>
                    if (part === "{verb}")
                        return <Fragment key={i}>{verb}</Fragment>
                    return part
                })}
        </span>
    ))

/** Wraps any index — positive or negative — into the projects array. */
const getProjectData = (index: number, projects: ProjectData[]) => {
    const i =
        ((Math.abs(index) % projects.length) + projects.length) %
        projects.length
    return projects[i]
}

export default function PortfolioScroll({
    projects,
    introAvatar,
    ctaWords = ["claim", "yes", "no", "decline"],
    introVerbs = ["design"],
    introHeadline = "",
    introRole = "",
    introTagline = "",
    introLinks = [],
    scrollSpeed = 0.75,
    lerpFactor = 0.05,
    bufferSize = 5,
    maxVelocity = 240,
    snapDuration = 500,
    palette = PALETTES.light,
    titleFont,
    bodyFont,
    imageScale = 1.5,
}: PortfolioScrollProps) {
    const [visibleRange, setVisibleRange] = useState({
        min: -bufferSize,
        max: bufferSize,
    })

    const [isMobile, setIsMobile] = useState(false)
    /**
     * A small phone, by either measure. At 320x568 the card's title wraps to
     * two lines and the intro, the card and the pager together leave the hero
     * less than a third of the screen, so both ends give up a little more.
     */
    const [isTight, setIsTight] = useState(false)
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [hoveredIntroIcon, setHoveredIntroIcon] = useState<number | null>(
        null,
    )
    const [activeCardIndex, setActiveCardIndex] = useState(0)
    // HIG: "Always include a press state for a custom button." These are
    // custom buttons carrying inline transforms, so the pressed flag has to
    // compose into that transform — a CSS :active rule would lose to it.
    const [pressedKey, setPressedKey] = useState<string | null>(null)
    const pressProps = (key: string) => ({
        onPointerDown: () => setPressedKey(key),
        onPointerUp: () => setPressedKey(null),
        onPointerLeave: () => setPressedKey(null),
        onPointerCancel: () => setPressedKey(null),
    })
    const [cardWidth, setCardWidth] = useState(0)
    const [ctaPressed, setCtaPressed] = useState(false)
    const [verbIndex, setVerbIndex] = useState(0)
    const [verbAnimated, setVerbAnimated] = useState(true)
    const [ctaConfirmed, setCtaConfirmed] = useState(false)
    // A brief phase between "Thanks!" and rest, so the key condenses back down
    // instead of dissolving in place.
    const [ctaSettling, setCtaSettling] = useState(false)
    const confirmTimer = useRef<number | undefined>(undefined)
    const settleTimer = useRef<number | undefined>(undefined)
    const [bursts, setBursts] = useState<
        { id: number; x: number; y: number }[]
    >([])
    const burstId = useRef(0)

    const state = useRef({
        currentY: 0,
        targetY: 0,
        isDragging: false,
        isSnapping: false,
        snapStart: { time: 0, y: 0, target: 0 },
        lastScrollTime: Date.now(),
        dragStart: { y: 0, scrollY: 0, time: 0, index: 0 },
        projectHeight: 0,
        heroHeight: 0,
        minimapHeight: CONFIG.MINIMAP_HEIGHT,
    })

    const projectsRef = useRef<Map<number, HTMLDivElement>>(new Map())
    const infoRef = useRef<Map<number, HTMLDivElement>>(new Map())
    const requestRef = useRef<number | undefined>(undefined)
    const renderedRange = useRef({ min: -bufferSize, max: bufferSize })
    const activeIndexRef = useRef(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const cardsViewportRef = useRef<HTMLDivElement>(null)
    const heroRef = useRef<HTMLDivElement>(null)

    /**
     * The slot a card sits in, not the card's own height — the card hugs its
     * content and this is only the step the stack advances by. Sized to the
     * tallest card, which is a two-line title over a four-line description.
     *
     * It stays one number because the scroll engine steps by it and keys the
     * minimap off it; giving each card its own slot would mean replacing that
     * step with cumulative offsets.
     */
    const cardHeight = isMobile ? (isTight ? 188 : 176) : 270
    const taglineSize = isMobile ? 14 : 18
    // Sized against the tagline, so it keeps its ratio if the type changes.
    // Sized to the cap height of the sentence it sits in.
    const ctaSize = Math.round(taglineSize * 0.75)
    // The key is taller than the type it sits in, so the paragraph's leading
    // has to clear its full height or it collides with the line above.
    const ctaHeight = ctaSize * 0.42 * 2 + ctaSize * 1.1 + CTA_BORDER * 2
    // Two leadings, not one. Sizing the whole paragraph to clear the key made
    // every line 39% looser than the type wanted, which is what left the key
    // floating in a band of space of its own making.
    const textLineHeight = taglineSize * 1.25 + 2
    const keyLineHeight = Math.max(textLineHeight, ctaHeight + 5)

    const updateParallax = (
        element: HTMLImageElement | HTMLVideoElement | null,
        offset: number,
        scale: number,
    ) => {
        if (!element) return

        if (!element.dataset.parallaxCurrent) {
            element.dataset.parallaxCurrent = "0"
        }

        let current = parseFloat(element.dataset.parallaxCurrent)
        const target = -offset * 0.2
        current = lerp(current, target, 0.1)

        if (Math.abs(current - target) > 0.01) {
            element.style.transform = `translateY(${current}px) scale(${scale})`
            element.dataset.parallaxCurrent = current.toString()
        }
    }

    useEffect(() => {
        const containerEl = containerRef.current
        if (!containerEl) return

        const s = state.current
        s.minimapHeight = cardHeight
        s.projectHeight = containerEl.clientHeight
        s.heroHeight = heroRef.current?.clientHeight || containerEl.clientHeight

        const checkMobile = () => {
            const width = containerEl.clientWidth
            const height = containerEl.clientHeight
            startTransition(() => {
                setIsMobile(width < 768)
                setIsTight(width < 360 || height < 640)
            })
        }
        const initialCheck = setTimeout(checkMobile, 0)

        const updatePositions = () => {
            if (s.projectHeight <= 0) return

            const currentFloat = -s.currentY / s.projectHeight
            const pitch = s.minimapHeight + CONFIG.CARD_GAP
            const cardsViewportHeight =
                cardsViewportRef.current?.clientHeight || s.minimapHeight
            const centeredOffsetY = isMobile
                ? (cardsViewportHeight - s.minimapHeight) / 2
                : 0

            projectsRef.current.forEach((el, index) => {
                // The scroll unit is the container, but the hero is its own
                // box — on mobile a fraction of it. Spacing the slides by the
                // container's height leaves the photo adrift in its frame.
                const y = (index - currentFloat) * s.heroHeight
                el.style.transform = `translateY(${y}px)`
                // Explicit target: a component hero contains images of
                // its own, and transforming one of them in isolation would
                // pull the composition apart.
                const media = el.querySelector('[data-parallax="true"]')
                updateParallax(
                    media as HTMLImageElement | HTMLVideoElement,
                    y,
                    // A 1.5x zoom on top of an already tight phone crop throws
                    // most of the photo away.
                    isMobile ? 1.15 : imageScale,
                )
            })

            infoRef.current.forEach((el, index) => {
                const relativeIndex = index - currentFloat
                const absRelative = Math.abs(relativeIndex)
                // The first two gaps either side of the focused card keep the
                // full pitch; every gap beyond that is CONFIG.FAR_GAP_TIGHTEN
                // tighter, so the stack compresses as it recedes.
                const tighten =
                    Math.sign(relativeIndex) *
                    CONFIG.FAR_GAP_TIGHTEN *
                    Math.max(0, absRelative - CONFIG.FULL_PITCH_CARDS)
                const y =
                    relativeIndex * pitch -
                    tighten +
                    centeredOffsetY +
                    (isMobile ? 0 : CONFIG.HOVER_HEADROOM)
                const scale = Math.max(0.66, 1 - absRelative * 0.21)
                const baseOpacity = Math.max(0.12, 1 - absRelative * 0.68)
                const opacity =
                    absRelative < 0.02
                        ? 1
                        : Math.min(
                              1,
                              Math.max(0.08, baseOpacity * 0.62) +
                                  CONFIG.UNFOCUSED_OPACITY_LIFT,
                          )
                const blur = Math.min(8, absRelative * 2.8)
                el.style.transform = `translate3d(${isMobile ? "-50%" : "0%"}, ${y}px, 0) scale(${scale})`
                el.style.opacity = opacity.toString()
                el.style.filter = `blur(${blur}px)`
                el.style.zIndex = `${1000 - Math.round(absRelative * 100)}`
            })
        }

        const snapToProject = () => {
            if (s.projectHeight <= 0) return
            const current = Math.round(-s.targetY / s.projectHeight)
            s.isSnapping = true
            s.snapStart = {
                time: Date.now(),
                y: s.targetY,
                target: -current * s.projectHeight,
            }
        }

        const updateSnap = () => {
            const progress = Math.min(
                (Date.now() - s.snapStart.time) / snapDuration,
                1,
            )
            const eased = 1 - Math.pow(1 - progress, 3)
            s.targetY =
                s.snapStart.y + (s.snapStart.target - s.snapStart.y) * eased
            if (progress >= 1) s.isSnapping = false
        }

        const animationLoop = () => {
            if (s.projectHeight > 0) {
                const now = Date.now()

                if (
                    !s.isSnapping &&
                    !s.isDragging &&
                    now - s.lastScrollTime > 100
                ) {
                    const snapPoint =
                        -Math.round(-s.targetY / s.projectHeight) *
                        s.projectHeight
                    if (Math.abs(s.targetY - snapPoint) > 1) snapToProject()
                }

                if (s.isSnapping) updateSnap()

                // Track the target even mid-drag, so a touch drag moves live
                // rather than jumping into place on release.
                const factor = s.isDragging
                    ? Math.max(lerpFactor, 0.2)
                    : lerpFactor
                s.currentY += (s.targetY - s.currentY) * factor

                updatePositions()

                const currentIndex = Math.round(-s.targetY / s.projectHeight)
                const focusedIndex = Math.round(-s.currentY / s.projectHeight)
                const min = currentIndex - bufferSize
                const max = currentIndex + bufferSize

                if (
                    min !== renderedRange.current.min ||
                    max !== renderedRange.current.max
                ) {
                    renderedRange.current = { min, max }
                    startTransition(() => setVisibleRange({ min, max }))
                }
                if (focusedIndex !== activeIndexRef.current) {
                    activeIndexRef.current = focusedIndex
                    startTransition(() => {
                        setActiveCardIndex(focusedIndex)
                        setHoveredCard(null)
                    })
                }
            }

            requestRef.current = requestAnimationFrame(animationLoop)
        }

        // Wheel and touch anywhere in the component drive the one scroller, so
        // the card track and the hero always move together.
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            s.isSnapping = false
            s.lastScrollTime = Date.now()
            // Firefox reports lines, and some mice report pages.
            const unit =
                e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? s.projectHeight : 1
            const raw = e.deltaY * unit
            // A trackpad streams many small deltas; a mouse wheel fires a few
            // big notches. Treated the same, a wheel needs about eleven clicks
            // to cross one project, so notches get their own gain.
            const isNotch = e.deltaMode !== 0 || Math.abs(raw) >= 50
            const gain = scrollSpeed * (isNotch ? CONFIG.WHEEL_NOTCH_GAIN : 1)
            const delta = Math.max(
                Math.min(raw * gain, maxVelocity),
                -maxVelocity,
            )
            s.targetY -= delta
        }

        const onTouchStart = (e: TouchEvent) => {
            s.isDragging = true
            s.isSnapping = false
            s.dragStart = {
                y: e.touches[0].clientY,
                scrollY: s.targetY,
                time: Date.now(),
                index:
                    s.projectHeight > 0
                        ? Math.round(-s.targetY / s.projectHeight)
                        : 0,
            }
            s.lastScrollTime = Date.now()
        }

        const onTouchMove = (e: TouchEvent) => {
            if (!s.isDragging) return
            e.preventDefault()
            const dragged =
                s.dragStart.scrollY +
                (e.touches[0].clientY - s.dragStart.y) * 1.5
            // The finger can only ever reach the neighbouring project, so a
            // long drag cannot fling past several at once.
            if (s.projectHeight > 0) {
                const start = -s.dragStart.index * s.projectHeight
                s.targetY = Math.max(
                    Math.min(dragged, start + s.projectHeight),
                    start - s.projectHeight,
                )
            } else {
                s.targetY = dragged
            }
            s.lastScrollTime = Date.now()
        }

        const onTouchEnd = (e: TouchEvent) => {
            s.isDragging = false
            s.lastScrollTime = Date.now()
            if (s.projectHeight <= 0) return

            const endY = e.changedTouches[0]?.clientY ?? s.dragStart.y
            const dy = endY - s.dragStart.y
            const dt = Math.max(1, Date.now() - s.dragStart.time)
            // One swipe moves one project. Distance OR speed can carry it, so
            // a short flick counts as much as a slow deliberate drag — waiting
            // for the halfway point makes a natural flick feel ignored.
            const committed =
                Math.abs(dy) > CONFIG.SWIPE_DISTANCE ||
                Math.abs(dy / dt) > CONFIG.SWIPE_VELOCITY
            const direction = committed ? (dy < 0 ? 1 : -1) : 0
            snapTo(s.dragStart.index + direction)
        }

        const snapTo = (index: number) => {
            if (s.projectHeight <= 0) return
            s.isSnapping = true
            s.lastScrollTime = Date.now()
            s.snapStart = {
                time: Date.now(),
                y: s.targetY,
                target: -index * s.projectHeight,
            }
        }

        // An interrupted gesture returns to where it started rather than
        // leaving the scroller mid-drag.
        const onTouchCancel = () => {
            s.isDragging = false
            s.lastScrollTime = Date.now()
            snapTo(s.dragStart.index)
        }

        // Scroll-jacked pages are unusable by keyboard otherwise.
        const step = (direction: number) =>
            snapTo(Math.round(-s.targetY / s.projectHeight) + direction)

        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null
            if (
                target &&
                (target.isContentEditable ||
                    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
            ) {
                return
            }
            const key = e.key
            if (key === "ArrowDown" || key === "PageDown" || key === " ") {
                e.preventDefault()
                step(1)
            } else if (key === "ArrowUp" || key === "PageUp") {
                e.preventDefault()
                step(-1)
            }
        }

        const resizeObserver = new ResizeObserver(() => {
            checkMobile()
            s.projectHeight = containerEl.clientHeight
            s.heroHeight =
                heroRef.current?.clientHeight || containerEl.clientHeight
            const track = cardsViewportRef.current
            if (track) {
                const width = track.clientWidth * (isMobile ? 0.96 : 1)
                startTransition(() => setCardWidth(width))
            }
        })
        resizeObserver.observe(containerEl)
        if (cardsViewportRef.current)
            resizeObserver.observe(cardsViewportRef.current)
        if (heroRef.current) resizeObserver.observe(heroRef.current)

        containerEl.addEventListener("wheel", onWheel, { passive: false })
        containerEl.addEventListener("touchstart", onTouchStart, {
            passive: true,
        })
        containerEl.addEventListener("touchmove", onTouchMove, {
            passive: false,
        })
        containerEl.addEventListener("touchend", onTouchEnd, { passive: true })
        containerEl.addEventListener("touchcancel", onTouchCancel, {
            passive: true,
        })
        window.addEventListener("keydown", onKeyDown)

        requestRef.current = requestAnimationFrame(animationLoop)

        return () => {
            clearTimeout(initialCheck)
            resizeObserver.disconnect()
            containerEl.removeEventListener("wheel", onWheel)
            containerEl.removeEventListener("touchstart", onTouchStart)
            containerEl.removeEventListener("touchmove", onTouchMove)
            containerEl.removeEventListener("touchend", onTouchEnd)
            containerEl.removeEventListener("touchcancel", onTouchCancel)
            window.removeEventListener("keydown", onKeyDown)
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [
        scrollSpeed,
        lerpFactor,
        bufferSize,
        maxVelocity,
        snapDuration,
        imageScale,
        isMobile,
        cardHeight,
    ])

    // The three words the sentence is actually about — title, verb, employer —
    // share one treatment so they read as a set, not three separate accents.
    // Medium, not semibold: full-contrast ink already separates them from the
    // grey around them, so the weight only has to confirm that, not carry it.
    const emphasis = { color: palette.text, fontWeight: 500 }

    const roleToken = <span style={emphasis}>{introRole}</span>

    // Plain text now, so it needs none of the baseline correction an inline
    // SVG did — it simply sits on the line like the words around it.
    const roktWordmark = (
        // Full contrast, so the employer reads out of the grey sentence.
        <a
            href="https://www.rokt.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...emphasis, textDecoration: "none" }}
        >
            @Rokt
        </a>
    )

    useEffect(
        () => () => {
            window.clearTimeout(confirmTimer.current)
            window.clearTimeout(settleTimer.current)
        },
        [],
    )

    // The stack ends with a copy of the first word, so the last step still
    // travels upward; on landing there the transition is cut and the index
    // reset to 0, which is the same frame visually.
    useEffect(() => {
        if (introVerbs.length < 2) return
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
            return
        }
        const id = window.setInterval(() => {
            setVerbAnimated(true)
            setVerbIndex((i) => i + 1)
        }, CONFIG.VERB_INTERVAL)
        return () => window.clearInterval(id)
    }, [introVerbs.length])

    useEffect(() => {
        if (verbIndex !== introVerbs.length) return
        const id = window.setTimeout(() => {
            setVerbAnimated(false)
            setVerbIndex(0)
        }, CONFIG.VERB_TRAVEL)
        return () => window.clearTimeout(id)
    }, [verbIndex, introVerbs.length])

    const spawnBurst = (x: number, y: number) => {
        if (!CLICK_BURST_ENABLED) return
        const id = burstId.current++
        setBursts((current) => [...current, { id, x, y }])
        // Matches the burst-line animation; the node is inert before this.
        window.setTimeout(
            () => setBursts((current) => current.filter((b) => b.id !== id)),
            560,
        )
    }

    const ctaHovered = hoveredIntroIcon === CTA_HOVER_KEY
    // rest -> hover -> pressed -> confirmed. Flat: a fill, a darker fill for
    // hover, and ink. No rim, no lit edge, no ambient shadow — depth here is
    // carried by colour and hierarchy rather than by shading.
    // A surface, not a coloured slab. Hover deepens the border and floats the
    // shadow without touching the fill; the fill only moves on the press, so
    // pressing reads as the surface settling back onto the page.
    const k = palette.key
    const face = ctaConfirmed
        ? {
              fill: palette.accentSuccess,
              // Transparent rather than absent, so the box never changes size
              // between states.
              border: "transparent",
              ink: palette.onAccentSuccess,
              shadow: k.shadow,
          }
        : {
              fill: ctaPressed ? k.fillPressed : k.fill,
              border: ctaHovered || ctaPressed ? k.borderHover : k.border,
              ink: ctaHovered || ctaPressed ? k.inkHover : k.ink,
              shadow: ctaPressed
                  ? k.shadowPressed
                  : ctaHovered
                    ? k.shadowHover
                    : k.shadow,
          }

    // Dragging off the key cancels rather than confirms, so only a release on
    // the button counts.
    const confirm = () => {
        setCtaConfirmed(true)
        window.clearTimeout(confirmTimer.current)
        confirmTimer.current = window.setTimeout(() => {
            // Reverse of the press: the key drops out of its raised confirmed
            // state on the same sharp curve the press used, then settles.
            setCtaConfirmed(false)
            setCtaSettling(true)
            window.clearTimeout(settleTimer.current)
            settleTimer.current = window.setTimeout(
                () => setCtaSettling(false),
                240,
            )
        }, 1600)
    }
    const ctaLabels = [
        { key: "rest", text: "Clicks", shown: !ctaHovered && !ctaConfirmed },
        { key: "hover", text: "Click?", shown: ctaHovered && !ctaConfirmed },
        { key: "done", text: "Thanks!", shown: ctaConfirmed },
    ]
    const clicksCta = (
        <button
            type="button"
            className="cta hit44"
            // The label swaps between states; the name stays put for anyone
            // not looking at it.
            aria-label="clicks"
            // The press state drives the timing swap in CSS: fast in, springy
            // out. It starts on pointerdown, not click — waiting for the full
            // click is the single most common reason a button feels sluggish.
            data-pressed={ctaPressed ? "true" : "false"}
            data-settling={ctaSettling ? "true" : "false"}
            onPointerDown={() => setCtaPressed(true)}
            // Confirmation lands on the release, so the key travels down
            // first and the check arrives with the bounce back up.
            onPointerUp={() => {
                setCtaPressed(false)
                confirm()
            }}
            onPointerLeave={() => {
                setCtaPressed(false)
                startTransition(() => setHoveredIntroIcon(null))
            }}
            onPointerCancel={() => setCtaPressed(false)}
            // Keyboard users get the same press, not just the click.
            onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                    setCtaPressed(true)
                }
            }}
            onKeyUp={(event) => {
                if (event.key === " " || event.key === "Enter") confirm()
                setCtaPressed(false)
            }}
            onBlur={() => setCtaPressed(false)}
            onMouseEnter={() =>
                startTransition(() => setHoveredIntroIcon(CTA_HOVER_KEY))
            }
            style={{
                // Longhands, not the `font` shorthand: mixing the two on one
                // element makes React warn and the cascade order unreliable.
                fontFamily: FONT_FAMILY,
                fontSize: ctaSize,
                fontWeight: 600,
                lineHeight: 1.1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: ctaSize * 0.28,
                // Roughly 2.2:1 horizontal to vertical. Near-square padding
                // is what makes a filled box read as a highlighted word
                // rather than a control.
                padding: `${ctaSize * 0.42}px ${ctaSize * 0.95}px`,
                margin: "0 2px",
                border: `${CTA_BORDER}px solid ${face.border}`,
                cursor: "pointer",
                borderRadius: 10,
                ...({ cornerShape: CONFIG.CORNER_SHAPE } as object),
                backgroundColor: face.fill,
                color: face.ink,
                verticalAlign: "baseline",
                boxShadow: face.shadow,
                // Hover floats it a pixel; the press puts it back down. The
                // lift and the shadow are one gesture, so pressing lands the
                // surface rather than shrinking it.
                transform:
                    !ctaConfirmed && ctaHovered && !ctaPressed
                        ? `translateY(${-1 - CTA_BASELINE_NUDGE}px)`
                        : `translateY(${-CTA_BASELINE_NUDGE}px)`,
            }}
        >
            <span className="cta-label">
                {ctaLabels.map((label) => (
                    <span
                        key={label.key}
                        aria-hidden={!label.shown}
                        style={{
                            opacity: label.shown ? 1 : 0,
                            transform: label.shown
                                ? "translateY(0px)"
                                : "translateY(4px)",
                        }}
                    >
                        {label.text}
                    </span>
                ))}
            </span>
        </button>
    )

    // A window one line tall with the words stacked inside it; the stack
    // slides up by exactly one line each time. Sits at the end of its line so
    // a change of word width cannot reflow the text after it.
    const verbShifter = (
        <span
            style={{
                display: "inline-block",
                verticalAlign: "top",
                height: textLineHeight,
                overflow: "hidden",
                ...emphasis,
            }}
        >
            <span
                aria-hidden="true"
                style={{
                    display: "block",
                    transform: `translateY(${-verbIndex * textLineHeight}px)`,
                    transition: verbAnimated
                        ? `transform ${CONFIG.VERB_TRAVEL}ms cubic-bezier(0.65, 0, 0.35, 1)`
                        : "none",
                }}
            >
                {[...introVerbs, introVerbs[0]].map((word, i) => (
                    <span
                        key={`${word}-${i}`}
                        style={{
                            display: "block",
                            height: textLineHeight,
                            lineHeight: `${textLineHeight}px`,
                        }}
                    >
                        {word}
                    </span>
                ))}
            </span>
            {/* The animation is decorative; the sentence still reads as one
                thing to a screen reader. */}
            <span
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                }}
            >
                {introVerbs.join(", ")}
            </span>
        </span>
    )

    const indices: number[] = []
    for (let i = visibleRange.min; i <= visibleRange.max; i++) indices.push(i)

    const heroRadius = isMobile ? "13px" : "clamp(17px, 9%, 26px)"
    const cardPadding = isMobile ? 14 : 20
    // Same rule the hero radius uses, resolved against the measured card so the
    // thumbnail can nest concentrically inside it.
    const cardRadius = isMobile
        ? 13
        : Math.min(26, Math.max(17, cardWidth * 0.09))
    // Concentric nesting: inner radius = outer radius - the gap between them.
    const thumbRadius = Math.max(4, cardRadius - cardPadding)

    // On a phone the intro leads the page, above the hero; on desktop it
    // heads the right-hand panel. Same markup, two positions.
    const introBlock = (
        <header
            style={{
                display: "flex",
                flexDirection: "column",
                gap: isMobile ? (isTight ? 2 : 4) : 8,
                flexShrink: 0,
                // Outside the panel on mobile, so it carries its own
                // horizontal padding to stay aligned with the hero.
                paddingLeft: isMobile ? 16 : undefined,
                // The theme toggle is fixed at the top right, 44 wide. On a
                // small phone the tagline's rotating verb reaches far enough
                // across to run underneath it, so the text stops short of
                // its column there.
                paddingRight: isMobile ? (isTight ? 60 : 16) : undefined,
                marginBottom: 0,
                // Viewport-relative on desktop rather than a fixed 48: on a
                // laptop the headline sat too close to the top edge, and a
                // constant offset that looks right at 1080 looks cramped at
                // 768. The track below takes flex: 1, so it absorbs whatever
                // this gives away instead of overflowing.
                paddingTop: isMobile
                    ? isTight
                        ? 10
                        : 16
                    : "clamp(64px, 11vh, 140px)",
                paddingBottom: isMobile ? (isTight ? 4 : 6) : 24,
            }}
        >
            {introAvatar && (
                <img
                    src={introAvatar.src}
                    alt={introAvatar.alt}
                    width={isMobile ? 40 : 56}
                    height={isMobile ? 40 : 56}
                    style={{
                        display: "block",
                        objectFit: "cover",
                        borderRadius: isMobile ? 12 : 16,
                        ...({
                            cornerShape: CONFIG.CORNER_SHAPE,
                        } as object),
                        marginBottom: isMobile ? 2 : 4,
                    }}
                />
            )}
            <h1
                style={{
                    ...titleFont,
                    fontSize: isMobile ? 22 : 36,
                    color: palette.text,
                    margin: 0,
                    lineHeight: 1.08,
                    letterSpacing: "-0.03em",
                    fontWeight: 600,
                    fontFamily: FONT_FAMILY,
                }}
            >
                {introHeadline}
            </h1>
            <p
                style={{
                    ...bodyFont,
                    fontSize: taglineSize,
                    // Grey rather than black-at-85%: the muted token
                    // holds its weight in both themes, where an opacity
                    // knock-down just thins the ink.
                    color: palette.textMuted,
                    margin: 0,
                    lineHeight: `${textLineHeight}px`,
                    letterSpacing: "-0.015em",
                    fontWeight: 400,
                    fontFamily: FONT_FAMILY,
                }}
            >
                {renderTagline(
                    introTagline,
                    roleToken,
                    roktWordmark,
                    clicksCta,
                    verbShifter,
                    textLineHeight,
                    keyLineHeight,
                )}
            </p>
            {introLinks.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 10,
                        marginTop: 12,
                        marginLeft: -6,
                    }}
                >
                    {introLinks.map((item, idx) => {
                        const isMailto = item.url.startsWith("mailto:")
                        const isHovered = hoveredIntroIcon === idx
                        return (
                            <Fragment key={`${item.label}-${idx}`}>
                                {idx > 0 && (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            ...bodyFont,
                                            fontFamily: FONT_FAMILY,
                                            fontSize: 15,
                                            color: palette.textMuted,
                                            opacity: 0.5,
                                            userSelect: "none",
                                        }}
                                    >
                                        /
                                    </span>
                                )}
                                <a
                                    href={item.url}
                                    target={isMailto ? undefined : "_blank"}
                                    rel={
                                        isMailto
                                            ? undefined
                                            : "noopener noreferrer"
                                    }
                                    aria-label={item.label}
                                    className="hit44"
                                    {...pressProps(`link-${idx}`)}
                                    onMouseEnter={() =>
                                        startTransition(() =>
                                            setHoveredIntroIcon(idx),
                                        )
                                    }
                                    onMouseLeave={() =>
                                        startTransition(() =>
                                            setHoveredIntroIcon(null),
                                        )
                                    }
                                    style={{
                                        textDecoration: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        // The visual inset only. The 44px
                                        // target comes from .hit44::after,
                                        // which has its own min-size and is
                                        // unaffected by this — so a small
                                        // phone can tighten the row without
                                        // shrinking anything to aim at.
                                        padding: isMobile
                                            ? isTight
                                                ? 5
                                                : 9
                                            : 6,
                                        color: isHovered
                                            ? palette.text
                                            : palette.textMuted,
                                        transition:
                                            "transform 160ms ease, color 160ms ease",
                                        transform:
                                            pressedKey === `link-${idx}`
                                                ? "scale(0.88)"
                                                : isHovered
                                                  ? "translateY(-1px)"
                                                  : "translateY(0px)",
                                    }}
                                >
                                    <IntroIcon
                                        name={
                                            item.icon ??
                                            resolveIntroIcon(
                                                item.label,
                                                item.url,
                                            )
                                        }
                                        size={18}
                                    />
                                </a>
                            </Fragment>
                        )
                    })}
                </div>
            )}
        </header>
    )

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label="Project scroller — use the arrow keys to move between projects"
            style={{
                position: "relative",
                width: "100%",
                maxWidth: CONTENT_MAX_WIDTH,
                marginInline: "auto",
                height: "100%",
                backgroundColor: palette.background,
                overflow: "hidden",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
            }}
        >
            {bursts.map((burst) => (
                <span
                    key={burst.id}
                    aria-hidden="true"
                    className="burst"
                    style={{
                        left: burst.x,
                        top: burst.y,
                        color: palette.burst,
                    }}
                >
                    {BURST_SPOKES.map((angle) => (
                        <span
                            key={angle}
                            style={{ transform: `rotate(${angle}deg)` }}
                        >
                            <i />
                        </span>
                    ))}
                </span>
            ))}

            {isMobile && introBlock}

            {/* Main Image Display - Left Side / Top on Mobile */}
            <div
                ref={heroRef}
                style={{
                    position: "relative",
                    width: isMobile ? "100%" : "60%",
                    // The hero absorbs whatever the panel leaves rather than
                    // claiming a fixed share, so a taller intro shortens the
                    // photo instead of clipping the card below it.
                    height: isMobile ? undefined : "100%",
                    flex: isMobile ? "1 1 auto" : undefined,
                    minHeight: isMobile ? 160 : undefined,
                    padding: isMobile
                        ? "6px max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left))"
                        : "16px",
                    boxSizing: "border-box",
                    backgroundColor: palette.background,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        borderRadius: heroRadius,
                        ...({ cornerShape: CONFIG.CORNER_SHAPE } as object),
                    }}
                >
                    {indices.map((i) => {
                        const data = getProjectData(i, projects)
                        // The stage is the same surface this project's card
                        // is, resolved the same way, so the two read as one
                        // material lifted off the page rather than the hero
                        // dissolving into it.
                        const heroSurface =
                            palette.cardBackgrounds[
                                ((Math.abs(i) %
                                    palette.cardBackgrounds.length) +
                                    palette.cardBackgrounds.length) %
                                    palette.cardBackgrounds.length
                            ]
                        const isVideo =
                            data.mediaType === "video" && data.videoUrl
                        // The hero is its own anchor, so it has to respect
                        // the same rule: nothing to open yet, nothing to click.
                        const hasMediaLink =
                            LINKS_ENABLED &&
                            Boolean(data.link) &&
                            !data.comingSoon

                        const media =
                            data.mediaType === "component" ? (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        // The card's surface, not the page's.
                                        // The artwork on it is transparent, so
                                        // it takes whichever this resolves to
                                        // rather than carrying a ground of its
                                        // own.
                                        backgroundColor: heroSurface,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        // The loop indicator hangs off this.
                                        position: "relative",
                                        // Nothing on mobile: each loop sets
                                        // its own pad off its measured box,
                                        // so a wrapper inset here was a
                                        // second one, and 32 of the 408 the
                                        // pane has to give.
                                        padding: isMobile ? 0 : 32,
                                    }}
                                >
                                    <HeroStage
                                        // Branded Layouts draws its own, with
                                        // a segment per partner; the stills
                                        // get none, which is the point — a
                                        // hero with no line is a picture.
                                        indicate={
                                            data.component !== "branded-shuffle"
                                        }
                                        muted={palette.textMuted}
                                        accent={palette.accent}
                                        inset={isMobile ? 12 : 18}
                                    >
                                        {(report) =>
                                            data.component === "macys-bag" ? (
                                                <MacysBagLoop
                                                    onProgress={report}
                                                />
                                            ) : data.component ===
                                              "partner-agent" ? (
                                                <PartnerAgentLoop
                                                    onProgress={report}
                                                />
                                            ) : data.component ===
                                              "branded-shuffle" ? (
                                                <BrandedLayoutsLoop
                                                    // The hero's brand bar
                                                    // sits on the card's own
                                                    // surface, which is white
                                                    // in one theme and
                                                    // near-black in the
                                                    // other, so its ink has
                                                    // to come from the
                                                    // palette rather than be
                                                    // picked to survive both.
                                                    ink={palette.text}
                                                    muted={palette.textMuted}
                                                    accent={palette.accent}
                                                />
                                            ) : data.component ===
                                              "shoppable-config" ? (
                                                <ShoppableConfigLoop
                                                    onProgress={report}
                                                />
                                            ) : (
                                                <UberAdsLoop
                                                    fit="contain"
                                                    onProgress={report}
                                                />
                                            )
                                        }
                                    </HeroStage>
                                </div>
                            ) : isVideo ? (
                                <video
                                    data-parallax="true"
                                    src={data.videoUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        willChange: "transform",
                                    }}
                                />
                            ) : data.imageFit === "contain" ? (
                                // Whole, on white, and deliberately not
                                // parallaxed: shifting a contained image
                                // inside its pane walks its edges away from
                                // where they were placed.
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        // The card's surface, not the page's.
                                        // The artwork on it is transparent, so
                                        // it takes whichever this resolves to
                                        // rather than carrying a ground of its
                                        // own.
                                        backgroundColor: heroSurface,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: isMobile ? 16 : 32,
                                        boxSizing: "border-box",
                                    }}
                                >
                                    {/* display: contents, so the img is the
                                        flex item. As a box of its own the
                                        picture took its height from the
                                        image, and the image's max-height
                                        then resolved against that — which is
                                        itself, so it never constrained
                                        anything and a tall crop ran out of
                                        the pane at both ends. */}
                                    <picture style={{ display: "contents" }}>
                                        {data.imageMobile && (
                                            <source
                                                media="(max-width: 640px)"
                                                srcSet={data.imageMobile}
                                            />
                                        )}
                                        <img
                                            src={data.image.src}
                                            alt={data.image.alt}
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "100%",
                                                objectFit: "contain",
                                                display: "block",
                                            }}
                                        />
                                    </picture>
                                </div>
                            ) : (
                                <img
                                    data-parallax="true"
                                    src={data.image.src}
                                    alt={data.image.alt}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        willChange: "transform",
                                    }}
                                />
                            )

                        return (
                            <div
                                key={i}
                                ref={(el) => {
                                    if (el) projectsRef.current.set(i, el)
                                    else projectsRef.current.delete(i)
                                }}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    overflow: "hidden",
                                    willChange: "transform",
                                }}
                            >
                                {hasMediaLink ? (
                                    <a
                                        href={data.link}
                                        target={
                                            isExternal(data.link)
                                                ? "_blank"
                                                : undefined
                                        }
                                        rel={
                                            isExternal(data.link)
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        aria-label={
                                            data.comingSoon
                                                ? `${data.title} — case study in progress`
                                                : `Open project: ${data.title}`
                                        }
                                        tabIndex={-1}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            cursor: "pointer",
                                            // An anchor's underline propagates
                                            // to its descendants and cannot be
                                            // cancelled from inside, so it has
                                            // to be cleared here. It never
                                            // showed while every hero was an
                                            // image; the code hero is the
                                            // first one made of type.
                                            textDecoration: "none",
                                        }}
                                        onClick={(event) => {
                                            if (state.current.isDragging) {
                                                event.preventDefault()
                                            }
                                        }}
                                    >
                                        {media}
                                    </a>
                                ) : (
                                    media
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Right Panel - Project Cards / Bottom on Mobile */}
            <div
                style={{
                    position: "relative",
                    width: isMobile ? "100%" : "40%",
                    height: isMobile ? undefined : "100%",
                    flexShrink: 0,
                    backgroundColor: palette.panel,
                    padding: isMobile
                        ? "6px 16px calc(6px + env(safe-area-inset-bottom)) 16px"
                        : "20px 20px 16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobile ? 8 : 14,
                    overflow: isMobile ? "hidden" : "visible",
                    zIndex: isMobile ? "auto" : 2,
                }}
            >
                {!isMobile && introBlock}

                {/* Project Cards */}
                <div
                    ref={cardsViewportRef}
                    style={{
                        position: "relative",
                        // On a phone the track claims its space first: a card
                        // plus CARD_PEEK, so the neighbours show as a
                        // deliberate peek and can never clip the focused card.
                        height: isMobile
                            ? cardHeight +
                              (isTight ? 12 : CONFIG.CARD_PEEK_MOBILE)
                            : undefined,
                        flex: isMobile ? "0 0 auto" : 1,
                        minHeight: 0,
                        overflow: isMobile ? "hidden" : "visible",
                        clipPath: isMobile
                            ? undefined
                            : "inset(0 -100vw 0 -100vw)",
                        // A hard clip turns the neighbouring card into a bar of
                        // colour at the track edge. Fading the last 18px makes
                        // the stack read as continuing past the boundary.
                        ...(isMobile
                            ? {
                                  maskImage: CONFIG.TRACK_FADE,
                                  WebkitMaskImage: CONFIG.TRACK_FADE,
                              }
                            : {}),
                    }}
                >
                    {indices.map((i) => {
                        const data = getProjectData(i, projects)
                        const backgrounds = palette.cardBackgrounds
                        const paletteIndex =
                            ((Math.abs(i) % backgrounds.length) +
                                backgrounds.length) %
                            backgrounds.length
                        const cardBackground = backgrounds[paletteIndex]
                        const cardInk =
                            palette.cardInks[paletteIndex] ?? palette.cardText
                        const cardEdge =
                            palette.cardCardBorders[paletteIndex] ??
                            palette.cardBorder
                        const cardAccent =
                            palette.cardAccents[paletteIndex] ?? cardInk
                        const isHovered = hoveredCard === i
                        const isActive = i === activeCardIndex
                        const isInteractive = isActive && Boolean(data.link)
                        const isLinked =
                            LINKS_ENABLED && isInteractive && !data.comingSoon

                        return (
                            <div
                                key={i}
                                ref={(el) => {
                                    if (el) infoRef.current.set(i, el)
                                    else infoRef.current.delete(i)
                                }}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: isMobile ? "50%" : "0",
                                    width: isMobile ? "96%" : "100%",
                                    height: cardHeight,
                                    willChange: "transform, opacity, filter",
                                    transformOrigin: "center center",
                                    transition:
                                        "opacity 0.3s ease, filter 0.3s ease",
                                }}
                            >
                                <a
                                    href={isLinked ? data.link : undefined}
                                    target={
                                        isLinked && isExternal(data.link)
                                            ? "_blank"
                                            : undefined
                                    }
                                    rel={
                                        isLinked && isExternal(data.link)
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    aria-label={
                                        data.comingSoon
                                            ? `${data.title} — case study in progress`
                                            : isLinked
                                              ? `Open project: ${data.title}`
                                              : data.title
                                    }
                                    aria-hidden={!isInteractive}
                                    tabIndex={isLinked ? 0 : -1}
                                    {...pressProps(`card-${i}`)}
                                    onMouseEnter={() => {
                                        if (!isLinked) return
                                        startTransition(() => setHoveredCard(i))
                                    }}
                                    onMouseLeave={() =>
                                        startTransition(() =>
                                            setHoveredCard(null),
                                        )
                                    }
                                    onClick={(event) => {
                                        if (!isLinked) event.preventDefault()
                                    }}
                                    style={{
                                        position: "relative",
                                        overflow: "hidden",
                                        width: "100%",
                                        // The card hugs its own content rather
                                        // than filling the slot. With the
                                        // footer gone, a card whose title fits
                                        // one line and whose description runs
                                        // short was holding its old full
                                        // height as empty space under the
                                        // text. The slot stays a fixed height,
                                        // because the scroll engine steps the
                                        // stack by that and keys the minimap
                                        // off it; what changes is that the
                                        // card no longer stretches to meet it.
                                        height: "auto",
                                        borderRadius: cardRadius,
                                        ...({
                                            cornerShape: CONFIG.CORNER_SHAPE,
                                        } as object),
                                        // The edge belongs to the card, which
                                        // already owns the radius and the
                                        // corner shape. On the inset plate
                                        // inside it, a border sat 1px outside
                                        // its own box and the card's rounded
                                        // clip cut it off.
                                        border: `1px solid ${cardEdge}`,
                                        boxSizing: "border-box",
                                        padding: cardPadding,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        textDecoration: "none",
                                        color: "inherit",
                                        cursor: isLinked
                                            ? "pointer"
                                            : "default",
                                        pointerEvents: isLinked
                                            ? "auto"
                                            : "none",
                                        transform:
                                            isLinked &&
                                            pressedKey === `card-${i}`
                                                ? "translateY(-1px) scale(0.99)"
                                                : isLinked && isHovered
                                                  ? "translateY(-4px)"
                                                  : "translateY(0px)",
                                        transition: "transform 180ms ease",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: cardBackground,
                                            opacity:
                                                isLinked && isHovered
                                                    ? 0.85
                                                    : 1,
                                            transition: "opacity 180ms ease",
                                            pointerEvents: "none",
                                        }}
                                    />
                                    {/* Card Header */}
                                    <div
                                        style={{
                                            position: "relative",
                                            zIndex: 1,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: isMobile ? 8 : 14,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: isMobile
                                                        ? isTight
                                                            ? 40
                                                            : 46
                                                        : 68,
                                                    height: isMobile
                                                        ? isTight
                                                            ? 40
                                                            : 46
                                                        : 68,
                                                    borderRadius: thumbRadius,
                                                    ...({
                                                        cornerShape:
                                                            CONFIG.CORNER_SHAPE,
                                                    } as object),
                                                    overflow: "hidden",
                                                    backgroundColor:
                                                        palette.cardThumbBackground,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {data.thumb && (
                                                    <img
                                                        src={data.thumb.src}
                                                        alt={data.thumb.alt}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            display: "block",
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <span
                                                style={{
                                                    ...bodyFont,
                                                    // HIG's floor is 11pt on
                                                    // iOS, and it asks for
                                                    // more than the minimum
                                                    // with a custom face.
                                                    fontSize: 12,
                                                    color: cardInk,
                                                    // 0.85, not 0.65: below
                                                    // this the 12px year label
                                                    // drops under 4.5:1 on
                                                    // every card in the set.
                                                    opacity: 0.85,
                                                    textAlign: "right",
                                                    marginTop: 2,
                                                    fontWeight: 500,
                                                    fontFamily: FONT_FAMILY,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-end",
                                                    gap: 6,
                                                }}
                                            >
                                                {data.comingSoon ? (
                                                    // The pill replaces the
                                                    // year rather than
                                                    // stacking under it: a
                                                    // project still in
                                                    // progress has no year to
                                                    // give, and two labels in
                                                    // the corner read as
                                                    // clutter.
                                                    //
                                                    // Neutral rather than the
                                                    // card's accent: this is a
                                                    // status, and the accent
                                                    // is the click
                                                    // affordance's job.
                                                    <span
                                                        style={{
                                                            fontSize: 9.5,
                                                            fontWeight: 600,
                                                            letterSpacing:
                                                                "0.08em",
                                                            textTransform:
                                                                "uppercase",
                                                            color: palette
                                                                .cardChip.ink,
                                                            background:
                                                                palette.cardChip
                                                                    .background,
                                                            border: `1px solid ${palette.cardChip.border}`,
                                                            borderRadius: 999,
                                                            padding: "3px 8px",
                                                            whiteSpace:
                                                                "nowrap",
                                                            opacity: 1,
                                                        }}
                                                    >
                                                        In progress
                                                    </span>
                                                ) : (
                                                    <span>{data.year}</span>
                                                )}
                                            </span>
                                        </div>
                                        <h2
                                            style={{
                                                ...titleFont,
                                                fontSize: isMobile
                                                    ? isTight
                                                        ? 15
                                                        : 17
                                                    : 20,
                                                color: cardInk,
                                                marginTop: 0,
                                                marginRight: 0,
                                                marginLeft: 0,
                                                marginBottom: 4,
                                                fontWeight: 500,
                                                lineHeight: 1.2,
                                                fontFamily: FONT_FAMILY,
                                            }}
                                        >
                                            {data.title}
                                        </h2>
                                        <p
                                            style={{
                                                ...bodyFont,
                                                fontSize: isMobile ? 12 : 16,
                                                color: cardInk,
                                                opacity: 0.85,
                                                margin: 0,
                                                lineHeight: 1.45,
                                                fontWeight: 500,
                                                fontFamily: FONT_FAMILY,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 4,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {data.description}
                                        </p>
                                    </div>

                                    {/* Card Footer — the click
                                        affordance. Hidden entirely while
                                        links are off: with nothing to
                                        open, an arrow and the words "View
                                        Project" are an instruction the
                                        card cannot honour. A project still
                                        in progress keeps saying so — that
                                        is the pill in the corner, not
                                        this. */}
                                    {LINKS_ENABLED && (
                                        <div
                                            style={{
                                                ...bodyFont,
                                                position: "relative",
                                                zIndex: 1,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                fontSize: isMobile ? 12 : 14,
                                                fontWeight: 600,
                                                // The partner's own brand colour,
                                                // and the only place one appears
                                                // on an otherwise white card. A
                                                // project with nothing to open
                                                // takes the muted ink instead, so
                                                // the accent never promises a
                                                // click that does nothing.
                                                color: data.comingSoon
                                                    ? palette.cardInkDead
                                                    : cardAccent,
                                                fontFamily: FONT_FAMILY,
                                            }}
                                        >
                                            {data.comingSoon
                                                ? "Case study in progress"
                                                : "View Project"}
                                            {!data.comingSoon && (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    width={isMobile ? 14 : 16}
                                                    height={isMobile ? 14 : 16}
                                                    aria-hidden="true"
                                                    style={{
                                                        display: "block",
                                                        transform:
                                                            isInteractive &&
                                                            isHovered
                                                                ? "translateX(3px)"
                                                                : "translateX(0px)",
                                                        transition:
                                                            "transform 180ms ease",
                                                    }}
                                                >
                                                    <path
                                                        d="M4 12h14m0 0-5.5-5.5M18 12l-5.5 5.5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    )}
                                </a>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
