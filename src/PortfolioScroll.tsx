import {
    Fragment,
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type ReactNode,
} from "react"
import {
    IntroIcon,
    RoktWordmark,
    resolveIntroIcon,
    type IntroIconName,
} from "./icons"
import { PALETTES, type Palette } from "./theme"

export interface ProjectData {
    title: string
    image: { src: string; alt: string }
    category: string
    year: string
    description: string
    tags?: string[]
    link?: string
    mediaType?: "image" | "video"
    videoUrl?: string
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

/**
 * The layout stops growing here and centres; past it the page background runs
 * to the edges. Beyond this the hero simply becomes the page, and the panel's
 * measure drifts past a comfortable line length.
 */
export const CONTENT_MAX_WIDTH = 1440

/** Depth of the edge the key presses down into. */
const CTA_DEPTH = 3

/** Line-box-to-ink gap for the label, measured against the sentence. */
const CTA_OPTICAL_LIFT = 1.3

/** Clear space under the Rokt glyphs, as a fraction of the mark's height. */
const ROKT_INK_OFFSET = (30 - 28.837) / 30

/** The burst is parked for now; flip this to bring it back. */
const CLICK_BURST_ENABLED = false

/** Spokes of the click burst, evenly spaced like the reference. */
const BURST_SPOKES = [0, 45, 90, 135, 180, 225, 270, 315]

const FONT_FAMILY =
    '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'

const lerp = (start: number, end: number, factor: number) =>
    start + (end - start) * factor

/**
 * Renders `{rokt}` as the wordmark and `{clicks}` as the pressable key, so
 * each reads inline as part of the sentence.
 */
const renderTagline = (
    text: string,
    rokt: ReactNode,
    clicks: ReactNode,
    verb: ReactNode
) =>
    text.split(/(\{rokt\}|\{clicks\}|\{verb\}|\n)/).map((part, i) => {
        if (part === "{rokt}") return <Fragment key={i}>{rokt}</Fragment>
        if (part === "{clicks}") return <Fragment key={i}>{clicks}</Fragment>
        if (part === "{verb}") return <Fragment key={i}>{verb}</Fragment>
        if (part === "\n") return <br key={i} />
        return part
    })

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
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    const [hoveredIntroIcon, setHoveredIntroIcon] = useState<number | null>(
        null
    )
    const [activeCardIndex, setActiveCardIndex] = useState(0)
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

    const cardHeight = isMobile ? 190 : 230
    const taglineSize = isMobile ? 16 : 22
    // Sized against the tagline, so it keeps its ratio if the type changes.
    // Sized to the cap height of the sentence it sits in.
    const roktHeight = taglineSize * 0.727
    const ctaSize = Math.round(taglineSize * 0.66)
    // The key is taller than the type it sits in, so the paragraph's leading
    // has to clear its full height or it collides with the line above.
    const ctaHeight = ctaSize * 0.42 * 2 + ctaSize * 1.1 + CTA_DEPTH
    const taglineLineHeight = Math.max(taglineSize * 1.25 + 2, ctaHeight + 5)

    const updateParallax = (
        element: HTMLImageElement | HTMLVideoElement | null,
        offset: number,
        scale: number
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
            startTransition(() => setIsMobile(width < 768))
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
                const media = el.querySelector("img, video")
                updateParallax(
                    media as HTMLImageElement | HTMLVideoElement,
                    y,
                    // A 1.5x zoom on top of an already tight phone crop throws
                    // most of the photo away.
                    isMobile ? 1.15 : imageScale
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
                    CONFIG.HOVER_HEADROOM
                const scale = Math.max(0.66, 1 - absRelative * 0.21)
                const baseOpacity = Math.max(0.12, 1 - absRelative * 0.68)
                const opacity =
                    absRelative < 0.02
                        ? 1
                        : Math.min(
                              1,
                              Math.max(0.08, baseOpacity * 0.62) +
                                  CONFIG.UNFOCUSED_OPACITY_LIFT
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
                1
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
                -maxVelocity
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
                    start - s.projectHeight
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

    // Sits inline in the tagline; the baseline of an inline-block lands on its
    // bottom margin edge, so it is nudged by the wordmark's own ink offset.
    const roktWordmark = (
        // Full contrast, so the employer reads out of the grey sentence.
        <a
            href="https://www.rokt.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Rokt"
            style={{
                display: "inline-block",
                verticalAlign: "baseline",
                marginLeft: 2,
                color: palette.text,
                textDecoration: "none",
                // An inline-block baselines on its bottom margin edge, so the
                // mark is nudged by its own clear space to sit on the text
                // baseline rather than floating above it.
                transform: `translateY(${roktHeight * ROKT_INK_OFFSET}px)`,
            }}
        >
            <RoktWordmark height={roktHeight} />
        </a>
    )

    useEffect(
        () => () => {
            window.clearTimeout(confirmTimer.current)
            window.clearTimeout(settleTimer.current)
        },
        []
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
            560
        )
    }

    const ctaHovered = hoveredIntroIcon === CTA_HOVER_KEY
    // rest -> hover -> pressed -> confirmed, each with its own fill.
    const ctaFace = ctaConfirmed
        ? {
              fill: palette.accentSuccess,
              base: palette.accentSuccessBase,
              // White on the mint green is 1.9:1 — unreadable. Dark ink is 8.4.
              ink: "#1F2129",
          }
        : {
              // Hover only lifts the key; the fill stays put until the press
              // is confirmed, so colour means "done" rather than "hovered".
              fill: palette.accent,
              base: palette.accentBase,
              ink: palette.onAccent,
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
                240
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
            className="cta"
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
                fontWeight: 700,
                lineHeight: 1.1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: ctaSize * 0.28,
                padding: `${ctaSize * 0.42}px ${ctaSize * 0.6 - 2}px`,
                margin: "0 2px",
                border: "none",
                cursor: "pointer",
                borderRadius: 8,
                ...({ cornerShape: CONFIG.CORNER_SHAPE } as object),
                backgroundColor: ctaFace.fill,
                color: ctaFace.ink,
                verticalAlign: "baseline",
                // The base edge and the travel are one gesture: pressed, the
                // face drops by exactly the depth it loses, so the key bottoms
                // out rather than merely shrinking.
                boxShadow: ctaPressed
                    ? `0 0 0 ${ctaFace.base}`
                    : ctaSettling
                      ? `0 1px 0 ${ctaFace.base}`
                      : `0 ${ctaHovered || ctaConfirmed ? CTA_DEPTH + 1 : CTA_DEPTH}px 0 ${ctaFace.base}`,
                // Two corrections stacked: half the base edge, which hangs
                // below the face and drags the visual mass down, plus the
                // usual gap between a line box's centre and its ink.
                transform: ctaPressed
                    ? `translateY(${CTA_DEPTH / 2 - CTA_OPTICAL_LIFT}px)`
                    : ctaSettling
                      ? `translateY(${1 - CTA_DEPTH / 2 - CTA_OPTICAL_LIFT}px) scale(0.985)`
                      : ctaHovered || ctaConfirmed
                        ? `translateY(${-1 - CTA_DEPTH / 2 - CTA_OPTICAL_LIFT}px)`
                        : `translateY(${-CTA_DEPTH / 2 - CTA_OPTICAL_LIFT}px)`,
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
                height: taglineLineHeight,
                overflow: "hidden",
                color: palette.text,
            }}
        >
            <span
                aria-hidden="true"
                style={{
                    display: "block",
                    transform: `translateY(${-verbIndex * taglineLineHeight}px)`,
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
                            height: taglineLineHeight,
                            lineHeight: `${taglineLineHeight}px`,
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
                        gap: isMobile ? 6 : 8,
                        flexShrink: 0,
                        // Outside the panel on mobile, so it carries its own
                        // horizontal padding to stay aligned with the hero.
                        paddingLeft: isMobile ? 16 : undefined,
                        paddingRight: isMobile ? 16 : undefined,
                        marginBottom: 0,
                        paddingTop: isMobile ? 40 : 48,
                        paddingBottom: isMobile ? 10 : 32,
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
                            fontSize: isMobile ? 24 : 36,
                            color: palette.text,
                            margin: 0,
                            lineHeight: 1.08,
                            letterSpacing: "-0.03em",
                            fontWeight: 800,
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
                            lineHeight: `${taglineLineHeight}px`,
                            letterSpacing: "-0.015em",
                            fontWeight: 600,
                            fontFamily: FONT_FAMILY,
                        }}
                    >
                        {renderTagline(
                            introTagline,
                            roktWordmark,
                            clicksCta,
                            verbShifter
                        )}
                    </p>
                    {introLinks.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 8,
                                marginTop: 12,
                            }}
                        >
                            {introLinks.map((item, idx) => {
                                const isMailto = item.url.startsWith("mailto:")
                                const isHovered = hoveredIntroIcon === idx
                                return (
                                    <a
                                        key={`${item.label}-${idx}`}
                                        href={item.url}
                                        target={isMailto ? undefined : "_blank"}
                                        rel={
                                            isMailto
                                                ? undefined
                                                : "noopener noreferrer"
                                        }
                                        aria-label={item.label}
                                        onMouseEnter={() =>
                                            startTransition(() =>
                                                setHoveredIntroIcon(idx)
                                            )
                                        }
                                        onMouseLeave={() =>
                                            startTransition(() =>
                                                setHoveredIntroIcon(null)
                                            )
                                        }
                                        style={{
                                            textDecoration: "none",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: isMobile ? 34 : 32,
                                            height: isMobile ? 34 : 32,
                                            borderRadius: 4,
                                            backgroundColor: isHovered
                                                ? palette.pillHover
                                                : palette.pill,
                                            color: isHovered
                                                ? palette.text
                                                : palette.textMuted,
                                            transition:
                                                "transform 160ms ease, color 160ms ease, background-color 160ms ease",
                                            transform: isHovered
                                                ? "translateY(-1px)"
                                                : "translateY(0px)",
                                        }}
                                    >
                                        <IntroIcon
                                            name={
                                                item.icon ??
                                                resolveIntroIcon(
                                                    item.label,
                                                    item.url
                                                )
                                            }
                                            size={16}
                                        />
                                    </a>
                                )
                            })}
                        </div>
                    )}
                    {introLinks.length > 0 && (
                        <div
                            aria-hidden="true"
                            style={{
                                height: 1,
                                backgroundColor: palette.divider,
                                // The header's own flex gap is 8, so this tops
                                // the space above the rule up to 16px.
                                marginTop: 8,
                            }}
                        />
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
                        ? "8px max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left))"
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
                        const isVideo =
                            data.mediaType === "video" && data.videoUrl
                        const hasMediaLink = Boolean(data.link)

                        const media = isVideo ? (
                            <video
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
                        ) : (
                            <img
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
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Open project: ${data.title}`}
                                        tabIndex={-1}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            cursor: "pointer",
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
                        ? "12px 16px calc(12px + env(safe-area-inset-bottom)) 16px"
                        : "20px 20px 16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobile ? 10 : 14,
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
                        height: isMobile ? cardHeight + CONFIG.CARD_PEEK : undefined,
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
                        const cardBackground =
                            backgrounds[
                                ((Math.abs(i) % backgrounds.length) +
                                    backgrounds.length) %
                                    backgrounds.length
                            ]
                        const isHovered = hoveredCard === i
                        const isActive = i === activeCardIndex
                        const isInteractive = isActive && Boolean(data.link)

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
                                    href={isInteractive ? data.link : undefined}
                                    target={isInteractive ? "_blank" : undefined}
                                    rel={
                                        isInteractive
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    aria-label={`Open project: ${data.title}`}
                                    aria-hidden={!isInteractive}
                                    tabIndex={isInteractive ? 0 : -1}
                                    onMouseEnter={() => {
                                        if (!isInteractive) return
                                        startTransition(() => setHoveredCard(i))
                                    }}
                                    onMouseLeave={() =>
                                        startTransition(() =>
                                            setHoveredCard(null)
                                        )
                                    }
                                    onClick={(event) => {
                                        if (!isInteractive)
                                            event.preventDefault()
                                    }}
                                    style={{
                                        position: "relative",
                                        overflow: "hidden",
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: cardRadius,
                                        ...({
                                            cornerShape: CONFIG.CORNER_SHAPE,
                                        } as object),
                                        padding: cardPadding,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        textDecoration: "none",
                                        color: "inherit",
                                        cursor: isInteractive
                                            ? "pointer"
                                            : "default",
                                        pointerEvents: isInteractive
                                            ? "auto"
                                            : "none",
                                        transform:
                                            isInteractive && isHovered
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
                                                isInteractive && isHovered
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
                                                marginBottom: isMobile
                                                    ? 10
                                                    : 14,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: isMobile ? 56 : 68,
                                                    height: isMobile ? 56 : 68,
                                                    borderRadius: thumbRadius,
                                                    ...({
                                                        cornerShape:
                                                            CONFIG.CORNER_SHAPE,
                                                    } as object),
                                                    overflow: "hidden",
                                                    border: `1px solid ${palette.cardBorder}`,
                                                    backgroundColor:
                                                        palette.cardThumbBackground,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    ...bodyFont,
                                                    fontSize: isMobile
                                                        ? 10
                                                        : 11,
                                                    color: palette.cardTextMuted,
                                                    opacity: 0.65,
                                                    textAlign: "right",
                                                    marginTop: 2,
                                                    fontWeight: 700,
                                                    fontFamily: FONT_FAMILY,
                                                }}
                                            >
                                                {data.year}
                                            </span>
                                        </div>
                                        <h2
                                            style={{
                                                ...titleFont,
                                                fontSize: isMobile ? 17 : 20,
                                                color: palette.cardText,
                                                marginTop: 0,
                                                marginRight: 0,
                                                marginLeft: 0,
                                                marginBottom: 4,
                                                fontWeight: 700,
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
                                                color: palette.cardTextMuted,
                                                opacity: 0.78,
                                                margin: 0,
                                                lineHeight: 1.45,
                                                fontWeight: 500,
                                                fontFamily: FONT_FAMILY,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {data.description}
                                        </p>
                                    </div>

                                    {/* Card Footer — the click affordance */}
                                    <div
                                        style={{
                                            ...bodyFont,
                                            position: "relative",
                                            zIndex: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            fontSize: isMobile ? 12 : 14,
                                            fontWeight: 700,
                                            color: palette.cardText,
                                            fontFamily: FONT_FAMILY,
                                        }}
                                    >
                                        View Project
                                        <svg
                                            viewBox="0 0 24 24"
                                            width={isMobile ? 14 : 16}
                                            height={isMobile ? 14 : 16}
                                            aria-hidden="true"
                                            style={{
                                                display: "block",
                                                transform:
                                                    isInteractive && isHovered
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
                                    </div>
                                </a>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
