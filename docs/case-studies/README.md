# Case study templates

One template per project, in card order. Fill the prompts and delete the
comments; the block order and word budgets are the design.

| # | file | project | shape | ends with |
|---|---|---|---|---|
| 1 | `01-macys-bag-page.md` | Macy's Bag page | Iteration | Numbers |
| 2 | `02-uber-ads.md` | Uber Eats Contextual Advertising | Gallery | Takeaway |
| 3 | `03-branded-layouts.md` | Branded Layouts | System | WIP |
| 4 | `04-shoppable-pitching-platform.md` | Shoppable demo builder | Reframe | SplitOutcome |
| 5 | `05-mcdonalds-kiosk.md` | McDonald's kiosk | Iteration | Numbers |
| 6 | `06-expedia-1p-3p.md` | Expedia 1P/3P | System | SplitOutcome |

No shape repeats adjacently, no shape is used more than twice, and no two pages
open or close the same way. That is what stops the set reading as one filled-in
form. See `../case-study-template.md` for the block library, the shape
definitions and the reasoning.

## Before writing

Two things are unresolved and both affect structure, not just copy:

- **Client naming.** Macy's, Uber, McDonald's and Expedia are named partner
  relationships. If they cannot be named publicly, each masthead falls back to a
  category descriptor (noted in the templates) and more of the set shifts toward
  Gallery.
- ~~Shoppable ad pitching has an inferred shape.~~ Confirmed Reframe: design
  hand-built each demo prototype in Figma at about a week apiece, and the tool
  that removed the week was coded by the designer who noticed.

`src/content.ts` now holds six projects, one per template, and the card palette
was trimmed to six to match.
