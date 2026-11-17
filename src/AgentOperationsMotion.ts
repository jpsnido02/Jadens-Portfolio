/** Deterministic, DOM-free clock model for the authored Design Agents walkthrough. */
export const MOTION_CURVES = {
    enter: [0.23, 1, 0.32, 1],
    move: [0.77, 0, 0.175, 1],
    carry: [0.42, 0, 0.32, 1],
    autoComplete: [0.65, 0, 0.35, 1],
    modal: [0.32, 0.72, 0, 1],
} as const
export const GEOMETRY = {
    W: 1440, H: 1000, BOARD_X: 310, BOARD_Y: 228, COL_W: 267.5,
    COL_STEP: 281.5, CARD_W: 251.5, CARD_H: 148, ROW_STEP: 157, CARD_Y: 278,
    GRIP_X: 218.5, GRIP_Y: 96,
} as const
export const COLUMNS = ["Queue", "Building", "For review", "Complete"] as const
export type Stage = typeof COLUMNS[number]
export type Viewport = { w: number; h: number }
export type CardPose = { x: number; y: number; rotation: number; scale: number }
export type Camera = { s: number; tx: number; ty: number }
export const BEATS = {
    entrance: [0, 945], firstFocus: [930, 1630], focusHold: [1630, 2180],
    arrival: [2180, 3380], queueMakeRoom: [2180, 2780], queueReveal: [2780, 3380], arrivedHold: [3380, 3930],
    queuePickup: [3930, 4150], queueTravel: [4110, 4940], buildingLanding: [4940, 5260],
    build: [5260, 8560], buildHold: [8560, 8760], buildingPickup: [8760, 8980],
    reviewTravel: [8940, 9800], reviewLanding: [9800, 10120], reviewHold: [10120, 10720],
    reviewPress: [10720, 10880], pullback: [10800, 11350], modalEnter: [10880, 11100],
    readingHold: [11350, 15930], approveHover: [15930, 16330], approvePress: [16330, 16490],
    approvedHold: [16490, 17850], lifecycleAdvance: [16810, 17490], modalExit: [17850, 18030], reviewPickup: [18030, 18250],
    completeTravel: [18210, 19040], completeLanding: [19040, 19360], completeHold: [19360, 20860],
    exit: [20860, 21110], reset: [21110, 21190],
} as const
export const TOTAL_MS = BEATS.reset[1]
export const ENTRANCES = {
    side: { start: 0, duration: 560, y: 24 },
    controls: { start: 80, duration: 540, y: 18 },
    queue: { start: 130, duration: 680, y: 40 },
    building: { start: 220, duration: 630, y: 34 },
    review: { start: 305, duration: 595, y: 28 },
    complete: { start: 385, duration: 560, y: 24 },
} as const
export type EntranceName = keyof typeof ENTRANCES
export const clamp = (n: number) => Math.max(0, Math.min(1, n))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const normalized = (t: number, start: number, duration: number) => clamp((t - start) / duration)

type Interval = readonly [number, number]
const fraction = (t: number, [start, end]: Interval) => normalized(t, start, end - start)
// Zero velocity at each end lets the lifted card touch down without a position or speed cut.
const smooth = (x: number) => x * x * (3 - 2 * x)

/** Solve the bezier's X coordinate before evaluating Y, just like CSS easing. */
export function cubicBezier(t: number, points: readonly [number, number, number, number]) {
    if (t <= 0) return 0
    if (t >= 1) return 1
    const cubic = (v: number, a: number, b: number) => 3 * (1 - v) ** 2 * v * a + 3 * (1 - v) * v ** 2 * b + v ** 3
    let low = 0, high = 1
    for (let i = 0; i < 24; i++) {
        const mid = (low + high) / 2
        if (cubic(mid, points[0], points[2]) < t) low = mid
        else high = mid
    }
    return cubic((low + high) / 2, points[1], points[3])
}
const enter = (t: number) => cubicBezier(t, MOTION_CURVES.enter)
const move = (t: number) => cubicBezier(t, MOTION_CURVES.move)
const modalCurve = (t: number) => cubicBezier(t, MOTION_CURVES.modal)
const rest = (column: number): CardPose => ({ x: 318 + 281.5 * column, y: 278, rotation: 0, scale: 1 })
const TRANSFERS = [
    { from: 0, pickup: BEATS.queuePickup, travel: BEATS.queueTravel, landing: BEATS.buildingLanding },
    { from: 1, pickup: BEATS.buildingPickup, travel: BEATS.reviewTravel, landing: BEATS.reviewLanding },
    { from: 2, pickup: BEATS.reviewPickup, travel: BEATS.completeTravel, landing: BEATS.completeLanding },
] as const

function evaluateCard(t: number) {
    let pose = rest(0), contact = 0, held = false, dropTarget: number | null = null
    // Reserve the top slot first, then reveal the request in that space.
    // Compensate for the drag grip origin so expansion stays anchored at the top.
    const arrival = cubicBezier(fraction(t, BEATS.queueMakeRoom), MOTION_CURVES.carry)
    const reveal = enter(fraction(t, BEATS.queueReveal))
    pose.scale = mix(0.97, 1, reveal)
    pose.x -= (1 - pose.scale) * (GEOMETRY.GRIP_X - GEOMETRY.CARD_W / 2)
    pose.y -= (1 - pose.scale) * GEOMETRY.GRIP_Y
    const occupancy = [arrival, 0, 0, 0]
    for (const transfer of TRANSFERS) {
        if (t < transfer.pickup[0]) break
        const { from, pickup, travel, landing } = transfer
        const a = rest(from), b = rest(from + 1)
        if (from === 2) {
            // Approval routes the request automatically, without a drag gesture.
            const u = cubicBezier(fraction(t, travel), MOTION_CURVES.autoComplete)
            pose = { ...a, x: mix(a.x, b.x, u) }
            occupancy.fill(0); occupancy[from] = 1 - u; occupancy[from + 1] = u
            break
        }
        if (t < landing[0]) {
            const pickupP = smooth(fraction(t, pickup))
            const u = cubicBezier(fraction(t, travel), MOTION_CURVES.carry)
            const inv = 1 - u
            // Grip-space cubic, then convert to top-left. Rotation/scale share this grip origin.
            const p0x = a.x + GEOMETRY.GRIP_X, p3x = b.x + GEOMETRY.GRIP_X
            const p0y = a.y + GEOMETRY.GRIP_Y, p3y = b.y + GEOMETRY.GRIP_Y
            const gripX = inv ** 3 * p0x + 3 * inv ** 2 * u * p0x + 3 * inv * u ** 2 * (p3x - 36) + u ** 3 * p3x
            const gripY = inv ** 3 * p0y + 3 * inv ** 2 * u * (p0y - 24) + 3 * inv * u ** 2 * (p3y - 16) + u ** 3 * p3y
            pose = {
                x: gripX - GEOMETRY.GRIP_X,
                y: gripY - GEOMETRY.GRIP_Y - 11 * pickupP,
                rotation: -3.5 * pickupP * inv - Math.sin(Math.PI * u),
                scale: 1 + 0.06 * pickupP,
            }
            contact = pickupP
            held = true
            dropTarget = t >= travel[0] ? from + 1 : null
            occupancy.fill(0); occupancy[from] = 1 - u; occupancy[from + 1] = u
            break
        }
        occupancy.fill(0); occupancy[from + 1] = 1
        pose = b
        if (t < landing[1]) {
            const landingP = smooth(fraction(t, landing))
            pose.y -= 11 * (1 - landingP)
            pose.scale += 0.06 * (1 - landingP)
            contact = 1 - landingP
            break
        }
    }
    return { pose, contact, held, dropTarget, occupancy }
}

function visualCenterX(pose: CardPose) {
    const theta = pose.rotation * Math.PI / 180
    const dx = GEOMETRY.CARD_W / 2 - GEOMETRY.GRIP_X
    const dy = GEOMETRY.CARD_H / 2 - GEOMETRY.GRIP_Y
    return pose.x + GEOMETRY.GRIP_X + pose.scale * (Math.cos(theta) * dx - Math.sin(theta) * dy)
}
function cameraAt(t: number, viewport: Viewport, pose: CardPose): Camera {
    const { w, h } = viewport
    if (w < 500) {
        const s = Math.max(0.001, Math.min((w - 44) / 251.5, (h - 148) / (148 + 48)))
        return { s, tx: w / 2 - (pose.x + 251.5 / 2) * s, ty: 110 - 278 * s }
    }
    const sWide = Math.max(0.001, Math.min((w - 48) / 1440, (h - 48) / 1000))
    const wide = { s: sWide, tx: (w - 1440 * sWide) / 2, ty: (h - 1000 * sWide) / 2 }
    const sFocus = Math.max(0.001, Math.min(Math.min(0.36 * w, 420) / 251.5, (h - 128) / (148 + 88)))
    const focus = (card: CardPose): Camera => ({ s: sFocus, tx: 0.54 * w - visualCenterX(card) * sFocus, ty: 0.5 * h - 352 * sFocus })
    const interpolate = (a: Camera, b: Camera, u: number): Camera => ({ s: mix(a.s, b.s, u), tx: mix(a.tx, b.tx, u), ty: mix(a.ty, b.ty, u) })
    if (t < BEATS.firstFocus[1]) return interpolate(wide, focus(rest(0)), move(fraction(t, BEATS.firstFocus)))
    if (t < BEATS.pullback[0]) return focus(pose)
    if (t < BEATS.pullback[1]) return interpolate(focus(rest(2)), wide, move(fraction(t, BEATS.pullback)))
    return wide
}
function press(t: number, start: number) {
    if (t < start || t >= start + 160) return 1
    const elapsed = t - start
    return elapsed < 80 ? 1 - 0.03 * enter(elapsed / 80) : 0.97 + 0.03 * enter((elapsed - 80) / 80)
}
const beatOrder = Object.entries(BEATS).sort((a, b) => a[1][0] - b[1][0])

export function evaluateAgentWalkthrough(elapsed: number, viewport: Viewport, reducedMotion = false) {
    const validViewport = Number.isFinite(viewport.w) && Number.isFinite(viewport.h) && viewport.w > 0 && viewport.h > 0
    const time = reducedMotion ? BEATS.reviewHold[0] : ((Number.isFinite(elapsed) ? elapsed : 0) % TOTAL_MS + TOTAL_MS) % TOTAL_MS
    const resetting = time >= BEATS.reset[0]
    const t = resetting ? 0 : time
    const card = evaluateCard(t)
    const stage: Stage = resetting || t < BEATS.buildingLanding[0] ? "Queue" : t < BEATS.reviewLanding[0] ? "Building" : t < BEATS.completeLanding[0] ? "For review" : "Complete"
    const present = t >= BEATS.queueReveal[0] && !resetting
    const buildProgress = fraction(t, BEATS.build)
    const made = Math.min(14, Math.floor(14 * buildProgress))
    const bestBuyMade = 8 + Math.min(3, Math.floor(3 * buildProgress))
    const bestBuyProgress = (8 + 3 * buildProgress) / 18
    const workspaceOpacity = resetting ? 0 : 1 - enter(fraction(t, BEATS.exit))
    const entrances = Object.fromEntries(Object.entries(ENTRANCES).map(([name, spec]) => [name, {
        y: spec.y * (1 - cubicBezier(normalized(t, spec.start, spec.duration), MOTION_CURVES.carry)),
        opacity: validViewport ? smooth(normalized(t, spec.start, 270)) * workspaceOpacity : 0,
    }])) as Record<EntranceName, { y: number; opacity: number }>
    const arrivalOpacity = smooth(fraction(t, BEATS.queueReveal))
    const visible = validViewport && t >= BEATS.modalEnter[0] && t < BEATS.modalExit[1]
    const modalProgress = t < BEATS.modalExit[0] ? modalCurve(fraction(t, BEATS.modalEnter)) : 1 - enter(fraction(t, BEATS.modalExit))
    const compact = viewport.w > 0 && viewport.w < 500
    const modalScale = validViewport ? Math.max(0.001, compact ? Math.min(1, (viewport.w - 36) / 326, (viewport.h - 36) / 340) : Math.min(0.82, viewport.w * 0.68 / 620, viewport.h * 0.8 / 480)) : 1
    const reviewRippleVisible = !reducedMotion && t >= BEATS.reviewPress[0] && t < BEATS.reviewPress[0] + 420
    const approveRippleVisible = !reducedMotion && t >= BEATS.approvePress[0] && t < BEATS.approvePress[0] + 420
    let beat = "establish"
    for (const [name, interval] of beatOrder) if (time >= interval[0] && time < interval[1]) beat = name
    const hover = smooth(normalized(t, BEATS.approveHover[0], 190))
    const pressDepth = smooth(normalized(t, BEATS.approvePress[0], 115))
    const release = smooth(normalized(t, BEATS.approvedHold[0], 225))
    const confirmation = smooth(normalized(t, BEATS.approvedHold[0], 240))
    const lifecycleProgress = enter(fraction(t, BEATS.lifecycleAdvance))
    const modal = {
        visible, opacity: visible ? modalProgress : 0, scaleMultiplier: 0.97 + 0.03 * modalProgress,
        y: 8 * (1 - modalProgress), approved: t >= BEATS.approvedHold[0], scale: modalScale,
        approveHover: hover * (1 - confirmation),
        approveScale: 1 + 0.035 * hover * (1 - release) - 0.10 * pressDepth * (1 - release),
        confirmation, lifecycleProgress, lifecycleComplete: t >= BEATS.lifecycleAdvance[1],
    }
    const camera = validViewport ? cameraAt(t, viewport, card.pose) : { s: 1, tx: 0, ty: 0 }
    const renderKey = [beat, stage, made, bestBuyMade, present, modal.visible, modal.approved, modal.lifecycleComplete, reviewRippleVisible, approveRippleVisible, card.held, card.dropTarget, compact, validViewport].join(":")
    return {
        time, beat, phase: beatOrder.findIndex(([name]) => name === beat), stage, made, buildProgress, bestBuyMade, bestBuyProgress,
        cardPose: card.pose, cardOpacity: validViewport ? arrivalOpacity * workspaceOpacity : 0,
        cardPressScale: press(t, BEATS.reviewPress[0]), camera, contactOpacity: card.contact, shadowOpacity: card.contact,
        columnOccupancy: card.occupancy, entrances, modal, reviewRippleVisible, approveRippleVisible,
        present, compact, held: card.held, dropTarget: card.dropTarget, renderKey,
        sceneOpacity: validViewport ? 1 : 0,
    }
}
export type AgentWalkthroughFrame = ReturnType<typeof evaluateAgentWalkthrough>
