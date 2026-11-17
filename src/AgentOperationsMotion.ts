/** Deterministic, DOM-free clock model for the authored Design Agents walkthrough. */
export const TOTAL_MS = 17310
export const MOTION_CURVES = {
    enter: [0.23, 1, 0.32, 1],
    move: [0.77, 0, 0.175, 1],
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
    entrance: [0, 675], firstFocus: [680, 1230], arrival: [700, 1550], arrivedHold: [1550, 1800],
    queuePickup: [1800, 1960], queueTravel: [1940, 2640], buildingLanding: [2640, 2860],
    build: [2860, 6160], buildHold: [6160, 6360], buildingPickup: [6360, 6520],
    reviewTravel: [6500, 7250], reviewLanding: [7250, 7470], reviewHold: [7470, 8070],
    reviewPress: [8070, 8230], pullback: [8150, 8700], modalEnter: [8230, 8450],
    readingHold: [8700, 13280], approvePress: [13280, 13440], approvedHold: [13440, 14240],
    modalExit: [14240, 14420], reviewPickup: [14420, 14580], completeTravel: [14560, 15260],
    completeLanding: [15260, 15480], completeHold: [15480, 16980], exit: [16980, 17230],
    reset: [17230, 17310],
} as const
export const ENTRANCES = {
    side: { start: 0, duration: 460, y: 24 },
    controls: { start: 60, duration: 440, y: 18 },
    queue: { start: 120, duration: 500, y: 40 },
    building: { start: 190, duration: 460, y: 34 },
    review: { start: 240, duration: 420, y: 28 },
    complete: { start: 275, duration: 400, y: 24 },
} as const
export type EntranceName = keyof typeof ENTRANCES
export const clamp = (n: number) => Math.max(0, Math.min(1, n))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const normalized = (t: number, start: number, duration: number) => clamp((t - start) / duration)

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
    { from: 0, pickup: 1800, travel: 1940, impact: 2640, settled: 2860 },
    { from: 1, pickup: 6360, travel: 6500, impact: 7250, settled: 7470 },
    { from: 2, pickup: 14420, travel: 14560, impact: 15260, settled: 15480 },
] as const

function evaluateCard(t: number) {
    let pose = rest(0), contact = 0, held = false, dropTarget: number | null = null
    if (t < 1550) pose.y += 16 * (1 - enter(normalized(t, 700, 850)))
    const occupancy = [t >= 700 ? enter(normalized(t, 700, 850)) : 0, 0, 0, 0]
    for (const transfer of TRANSFERS) {
        if (t < transfer.pickup) break
        const { from, pickup, travel, impact, settled } = transfer
        const a = rest(from), b = rest(from + 1)
        if (t < impact) {
            const pickupP = enter(normalized(t, pickup, 160))
            const u = move(normalized(t, travel, impact - travel))
            const inv = 1 - u
            // Grip-space cubic, then convert to top-left. Rotation/scale share this grip origin.
            const p0x = a.x + GEOMETRY.GRIP_X, p3x = b.x + GEOMETRY.GRIP_X
            const p0y = a.y + GEOMETRY.GRIP_Y, p3y = b.y + GEOMETRY.GRIP_Y
            const gripX = inv ** 3 * p0x + 3 * inv ** 2 * u * p0x + 3 * inv * u ** 2 * (p3x - 36) + u ** 3 * p3x
            const gripY = inv ** 3 * p0y + 3 * inv ** 2 * u * (p0y - 24) + 3 * inv * u ** 2 * (p3y - 16) + u ** 3 * p3y
            pose = {
                x: gripX - GEOMETRY.GRIP_X,
                y: gripY - GEOMETRY.GRIP_Y - 5 * pickupP,
                rotation: -3.5 * pickupP * inv - Math.sin(Math.PI * u),
                scale: 1 + 0.025 * pickupP,
            }
            contact = pickupP
            held = true
            dropTarget = t >= travel ? from + 1 : null
            occupancy.fill(0); occupancy[from] = 1 - u; occupancy[from + 1] = u
            break
        }
        occupancy.fill(0); occupancy[from + 1] = 1
        pose = b
        if (t < settled) {
            const landingP = enter(normalized(t, impact, 220))
            pose.y -= 5 * (1 - landingP)
            pose.scale += 0.025 * (1 - landingP)
            contact = 1 - enter(normalized(t, impact, 160))
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
    if (t < 1230) return interpolate(wide, focus(rest(0)), move(normalized(t, 680, 550)))
    if (t < 8150) return focus(pose)
    if (t < 8700) return interpolate(focus(rest(2)), wide, move(normalized(t, 8150, 550)))
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
    const time = reducedMotion ? 7800 : ((Number.isFinite(elapsed) ? elapsed : 0) % TOTAL_MS + TOTAL_MS) % TOTAL_MS
    const resetting = time >= 17230
    const t = resetting ? 0 : time
    const card = evaluateCard(t)
    const stage: Stage = resetting || t < 2640 ? "Queue" : t < 7250 ? "Building" : t < 15260 ? "For review" : "Complete"
    const present = t >= 700 && !resetting
    const buildProgress = clamp((t - 2860) / 3300)
    const made = Math.min(14, Math.floor(14 * buildProgress))
    const workspaceOpacity = resetting ? 0 : 1 - enter(normalized(t, 16980, 250))
    const entrances = Object.fromEntries(Object.entries(ENTRANCES).map(([name, spec]) => [name, {
        y: spec.y * (1 - enter(normalized(t, spec.start, spec.duration))),
        opacity: validViewport ? enter(normalized(t, spec.start, 140)) * workspaceOpacity : 0,
    }])) as Record<EntranceName, { y: number; opacity: number }>
    const arrivalOpacity = enter(normalized(t, 700, 160))
    const visible = validViewport && t >= 8230 && t < 14420
    const modalProgress = t < 14240 ? modalCurve(normalized(t, 8230, 220)) : 1 - enter(normalized(t, 14240, 180))
    const compact = viewport.w > 0 && viewport.w < 500
    const modalScale = validViewport ? Math.max(0.001, compact ? Math.min(1, (viewport.w - 36) / 326, (viewport.h - 36) / 340) : Math.min(0.82, viewport.w * 0.68 / 620, viewport.h * 0.8 / 480)) : 1
    const reviewRippleVisible = !reducedMotion && t >= 8070 && t < 8490
    const approveRippleVisible = !reducedMotion && t >= 13280 && t < 13700
    let beat = "establish"
    for (const [name, interval] of beatOrder) if (time >= interval[0] && time < interval[1]) beat = name
    const modal = {
        visible, opacity: visible ? modalProgress : 0, scaleMultiplier: 0.97 + 0.03 * modalProgress,
        y: 8 * (1 - modalProgress), approved: t >= 13440, scale: modalScale,
        approveScale: press(t, 13280),
    }
    const camera = validViewport ? cameraAt(t, viewport, card.pose) : { s: 1, tx: 0, ty: 0 }
    const renderKey = [beat, stage, made, present, modal.visible, modal.approved, reviewRippleVisible, approveRippleVisible, card.held, card.dropTarget, compact, validViewport].join(":")
    return {
        time, beat, phase: beatOrder.findIndex(([name]) => name === beat), stage, made, buildProgress,
        cardPose: card.pose, cardOpacity: validViewport ? arrivalOpacity * workspaceOpacity : 0,
        cardPressScale: press(t, 8070), camera, contactOpacity: card.contact, shadowOpacity: card.contact,
        columnOccupancy: card.occupancy, entrances, modal, reviewRippleVisible, approveRippleVisible,
        present, compact, held: card.held, dropTarget: card.dropTarget, renderKey,
        sceneOpacity: validViewport ? 1 : 0,
    }
}
export type AgentWalkthroughFrame = ReturnType<typeof evaluateAgentWalkthrough>
