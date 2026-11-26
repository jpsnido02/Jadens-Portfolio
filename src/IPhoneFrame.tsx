/**
 * Natural Titanium iPhone 16 Pro from the supplied Figma component (1:26).
 * Its frame is 450 × 920; the screen is 402 × 874 at (24, 23).
 * Normalize uniformly to the demos' existing 393-point content width so their
 * layouts and animation targets stay in the same coordinate system.
 */
const DESIGN_SCALE = 393 / 402
export const FRAME_W = 450 * DESIGN_SCALE
export const FRAME_H = 920 * DESIGN_SCALE
export const SCREEN_X = 24 * DESIGN_SCALE
export const SCREEN_Y = 23 * DESIGN_SCALE
export const SCREEN_W = 393
export const SCREEN_H = 874 * DESIGN_SCALE
export const SCREEN_R = 44 * DESIGN_SCALE
export const FRAME_SRC = "/projects/iphone-16-pro/natural-titanium.png"

export default function IPhoneBezel() {
    return <img
        data-iphone-bezel="natural-titanium"
        src={FRAME_SRC}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
    />
}
