/**
 * Shared design tokens.
 *
 * These live apart from any component on purpose. They were originally
 * exported from PortfolioScroll, which meant the case study pages imported two
 * constants and pulled the entire scroll engine — React plus ~218kB of
 * virtualised card track — onto a page that renders none of it.
 */

/**
 * The layout stops growing here and centres; past it the page background runs
 * to the edges. Beyond this the hero simply becomes the page, and the panel's
 * measure drifts past a comfortable line length.
 */
export const CONTENT_MAX_WIDTH = 1440

export const FONT_FAMILY =
    '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'

/** Apple's continuous curve, used on every rounded surface on the site. */
export const CORNER_SHAPE = "superellipse(1.6)"
