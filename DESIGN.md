---
name: Kalshi Scoreboard
description: An illustrative game-winner market in a compact broadcast scoreboard.
colors:
  kalshi-green: "#00d49b"
  touchdown-yellow: "#ffda66"
  touchdown-ink: "#211b0e"
  canvas: "#141d19"
  card: "#0c211a"
  card-line: "#365146"
  field: "#101a16"
  team-row: "#132d24"
  team-hover: "#1a382e"
  team-selected: "#15382c"
  payout-strip: "#061a13"
  text: "#f5faf7"
  muted-text: "#aec4b9"
  promo-mint: "#6ce6c2"
typography:
  display:
    fontFamily: "Kalshi Sans, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Kalshi Sans, sans-serif"
    fontSize: "46px"
    fontWeight: 600
  label:
    fontFamily: "Kalshi Sans, sans-serif"
    fontSize: "24px"
rounded:
  card: "30px"
  compact-card: "22px"
  field-and-row: "12px"
  payout-strip: "14px"
spacing:
  row-gap: "8px"
  inset: "24px"
  compact-inset: "14px"
components:
  scoreboard-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "28px 36px 22px"
  team-row:
    backgroundColor: "{colors.team-row}"
    textColor: "{colors.text}"
    rounded: "{rounded.field-and-row}"
    padding: "10px 24px"
  team-row-hover:
    backgroundColor: "{colors.team-hover}"
  team-row-selected:
    backgroundColor: "{colors.team-selected}"
  touchdown-banner:
    backgroundColor: "{colors.touchdown-yellow}"
    textColor: "{colors.touchdown-ink}"
    rounded: "{rounded.field-and-row}"
  payout-strip:
    backgroundColor: "{colors.payout-strip}"
    rounded: "{rounded.payout-strip}"
    padding: "14px 24px"
---

# Kalshi Scoreboard

## Overview

A single broadcast scoreboard ties a football play to two win chances and one illustrative payout. The field, team rows, and payout remain in a fixed reading order through the play.

## Colors

Kalshi green links the wordmark, selected team border, and potential payout. Yellow marks the touchdown and provides a visible keyboard focus outline. Dark greens distinguish the field, rows, and payout strip. Muted green-gray carries column labels and terms, while mint identifies the promo code.

## Typography

Kalshi Sans carries the entire scoreboard. Team names use semibold, and the score, win chance, and payout use bold tabular figures. Right-align the score and chance to match their column labels, and hold the payout to the right edge as the quote changes.

## Layout

Center the scoreboard within the preview and scale it to the available width and height. The stage switches from 1200 × 700 to 600 × 478 when the preview is narrower than 600px. The compact layout keeps the same three columns and reduces type, team mark size, and insets.

## Elevation & Depth

The card border and changes in surface tone define the layers.

## Shapes

The outer card has the broadest corners. The field, touchdown banner, and team rows share the same radius. The payout strip has a slightly larger radius than the rows.

## Components

- **Field and touchdown banner.** Yard marks establish direction. The San Francisco mark runs to the end zone, then a yellow touchdown banner takes over the field's footprint.
- **Team rows.** Each row carries the team mark, name, score, and win chance. Both rows can be selected in the interactive preview, with Seattle selected initially. The green border indicates the selection and the yellow outline indicates keyboard focus.
- **Payout strip.** The selected team determines the single potential payout. Win chances and payout values roll in place after the touchdown. Reduced motion shows the settled state.
- **Team mark provenance.** The existing `public/projects/kalshi/49ers.png` appears in the San Francisco row and on the field. The existing `public/projects/kalshi/seahawks.png` appears in the Seattle row. [San Francisco mark via ESPN](https://a.espncdn.com/i/teamlogos/nfl/500/sf.png), [Seattle mark via ESPN](https://a.espncdn.com/i/teamlogos/nfl/500/sea.png).
