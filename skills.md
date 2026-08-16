---
name: jiandae-design-taste
description: Recreate Jiandae's premium career-platform visual language: warm paper surfaces, deep emerald branding, restrained gold accents, confident editorial typography, rounded workspace panels, and calm product-led motion. Use when designing or rebuilding a marketing page, dashboard, interview room, jobs marketplace, or career-product UI that should feel like Jiandae.
---

# Jiandae Design Taste

Use this guide as the visual north star. The goal is to make career tools feel focused, trustworthy, warm, and quietly premium—not like a generic SaaS dashboard.

## Core point of view

- Make the interface feel like a calm career studio: practical, optimistic, and human.
- Let content and the next action lead. Decoration should support orientation, not compete with it.
- Combine editorial landing-page composition with a highly usable product workspace.
- Use generous breathing room, clear hierarchy, and meaningful grouping instead of dense borders everywhere.
- Prefer polished restraint over visual novelty. A small number of strong decisions should carry the page.

## Color system

Use these as the default palette:

| Role | Color | Use |
| --- | --- | --- |
| Brand emerald | `#00533A` | Primary actions, navigation rails, hero background, active states |
| Deep emerald | `#02271F` | Dark marketing hero and high-contrast sections |
| Ink | `#1B2430` | Headlines, body text, dark surfaces |
| Gold | `#D8A12E` | Main accent, positive emphasis, high-value CTA moments |
| Paper | `#FCFCFA` | Default page background; never use stark white as the main canvas |
| Soft emerald | `#EAF4EF` | Selected states, supportive panels, success context |
| Raised white | `#FFFFFF` | Cards, forms, dialogs, product surfaces |
| Soft surface | `#F4F7F5` | Secondary panels and quiet grouped areas |
| Muted text | `#53605A` | Supporting copy |
| Subtle text | `#748079` | Metadata, helper text, low-priority labels |
| Border | `#DCE4DF` | Hairline separators and card outlines |

Color behavior:

- Use emerald for trust, navigation, action, and product identity.
- Use gold sparingly. It should signal opportunity, warmth, or a standout action—not become a generic decoration color.
- Keep most surfaces paper, white, or soft neutral. Avoid rainbow palettes and large saturated gradients.
- Use semantic colors only for meaning: success green, warning amber, danger red, information blue.
- On dark emerald backgrounds, use paper-white text and gold for the primary contrast.

## Typography

- Use one modern sans family throughout. Geist Sans, Inter, or a similar clean grotesk is appropriate.
- Use weight and scale for hierarchy rather than switching between many typefaces.
- Headlines should feel confident and compact: `font-weight: 700–800`, tight tracking around `-0.04em` to `-0.06em`.
- Body copy should remain readable and relaxed: `14–16px`, line-height around `1.5–1.7`.
- Small labels may use uppercase styling with generous tracking (`0.14–0.20em`), but do not turn every label into a badge.
- Keep display headlines short. Prefer one strong sentence over a paragraph-sized hero heading.
- Use mono only for technical identifiers, timestamps, or data where it improves scanning.

Suggested scale:

| Use | Size | Weight | Line height |
| --- | ---: | ---: | ---: |
| Hero display | `56–76px` desktop / `36–48px` mobile | `800` | `0.95–1.05` |
| Section heading | `32–48px` | `700–800` | `1.05–1.15` |
| Page heading | `24–30px` | `700–800` | `1.1–1.2` |
| Card heading | `16–20px` | `700` | `1.2–1.3` |
| Body | `14–16px` | `400–500` | `1.5–1.7` |
| Eyebrow / metadata | `10–12px` | `700` | `1.3` |

## Layout and composition

- Use a wide centered container, typically `1200–1536px`, with responsive side padding.
- Build pages from clear horizontal bands rather than an endless grid of identical cards.
- Use asymmetry in marketing sections: a strong text column paired with a visual proof/product surface.
- Keep the first viewport legible on a small laptop. The primary promise, CTA, and main visual should appear without excessive scrolling.
- Use large vertical spacing between major sections (`80–128px` desktop; `56–80px` mobile).
- Within cards, use compact spacing (`16–24px`) and strong alignment.
- Use a 4px base rhythm, with common gaps of `8`, `12`, `16`, `24`, `32`, and `48px`.
- Avoid filling every area. Empty paper space is part of the brand.

## Surfaces, shapes, and depth

- Default canvas: paper `#FCFCFA`.
- Lift important content onto white cards with a subtle border and restrained shadow.
- Prefer large, soft shadows over sharp black shadows:
  `0 18px 45px rgba(27, 36, 48, 0.10)`.
- Use rounded corners consistently:
  - `8–12px` for controls and compact cards
  - `16–20px` for panels and feature cards
  - `24–32px` for hero shells and large product compositions
  - full round only for avatars, icon buttons, and status dots
- Do not use excessive glassmorphism, neon glows, heavy gradients, or tightly nested cards.
- A bordered white panel should feel like a useful object, not a decorative tile.

## Marketing page pattern

1. Start with a dark emerald hero or a strong paper hero with one clear promise.
2. Pair the promise with a real product visual, interview scene, job proof, or report preview.
3. Use gold for the main conversion action and small moments of emphasis.
4. Follow with proof: employers, outcomes, testimonials, workflow steps, or product screenshots.
5. Use alternating paper and soft-surface sections to create rhythm without introducing many colors.
6. Close with a decisive CTA panel, not a cluttered feature wall.

Marketing navigation should be calm and spacious. Keep links readable, keep the primary CTA obvious, and collapse to a simple menu below desktop widths. On dark hero pages, use reversed wordmark and light navigation text; once the page leaves the hero, transition to paper/ink styling.

## Workspace and dashboard pattern

- Use paper as the application background and white for working surfaces.
- Anchor the experience with an emerald sidebar or focus rail; it should provide orientation without dominating the content.
- Use a sticky top bar for page context, the current task, notifications, and account access.
- Represent progress with rings, bars, and compact metric cards. Keep labels explicit and numbers easy to scan.
- Use rounded panels, clear section headings, and generous internal padding.
- Keep primary action buttons emerald with white text. Use gold for an important opportunity or upgrade, not every button.
- Use soft emerald surfaces for selected navigation and positive readiness states.
- Make interview rooms feel focused: fewer controls, stronger contrast, minimal chrome, clear status feedback.

## Components

### Primary button

Emerald background, white text, `10–14px` vertical padding, `20–28px` horizontal padding, `8–12px` radius, bold label, subtle lift on hover.

### Accent button

Gold background with ink text. Reserve for the most important marketing conversion or a clearly differentiated opportunity.

### Secondary button

White or paper background, ink text, 1px border, same radius and height as the primary button.

### Card

White background, hairline border, `16–24px` padding, `16–20px` radius, restrained shadow only when the card must float above the page.

### Metric card

Small eyebrow, large number, one-line interpretation, and—when useful—a progress bar or trend indicator. Never make the user decode the metric.

### Status chip

Use compact rounded chips with a muted tinted background. Pair color with text or an icon so meaning is never color-only.

### Product mockup

Show realistic interface content in a white rounded frame. Use actual product hierarchy, believable data, and generous framing; do not use an abstract gradient blob as a substitute for product proof.

## Motion

- Animate with purpose: reveal content upward, ease panels into place, and gently lift interactive cards.
- Use a soft easing curve such as `cubic-bezier(0.32, 0.72, 0, 1)`.
- Keep transitions around `200–700ms`; avoid constant movement and distracting parallax.
- Hover states may translate a card by `-2px` to `-4px` and deepen its shadow slightly.
- Respect `prefers-reduced-motion`; remove reveals, marquees, and transform-based motion when requested.
- Loading states should feel calm and informative. Use a restrained shimmer or skeleton, not a spinner for every region.

## Responsive behavior

- Desktop: use asymmetric editorial layouts, wide product visuals, and 2–3 column card groups.
- Tablet: reduce columns and preserve hierarchy; do not merely shrink everything.
- Mobile: stack content, reduce hero display size, keep CTAs full-width or comfortably tappable, and maintain at least `44px` touch targets.
- Collapse sidebars into bottom navigation or a compact drawer where appropriate.
- Preserve image aspect ratio; do not crop product screenshots or important faces.
- Keep body text at a comfortable reading size. Do not solve mobile layout by making type tiny.

## Accessibility and product trust

- Maintain visible keyboard focus using an emerald focus ring with a paper offset.
- Keep contrast strong on emerald and ink surfaces.
- Pair semantic status colors with labels/icons.
- Make empty, loading, error, and success states explain what happened and what to do next.
- Avoid visual pressure or manipulative urgency. The product should feel supportive and credible.

## Do

- Use warm paper instead of pure white as the page canvas.
- Use emerald as the primary identity and action color.
- Use gold as a deliberate accent.
- Combine editorial whitespace with practical product surfaces.
- Make the next career action obvious.
- Use real-looking product visuals and locally meaningful context.
- Keep cards rounded, tactile, and easy to scan.

## Do not

- Do not use purple-blue SaaS gradients as the default visual language.
- Do not make every section a dark panel or every control a pill.
- Do not use gold for every CTA or status.
- Do not overload pages with floating blobs, glass cards, or decorative shadows.
- Do not use all-caps tracking for normal headings or paragraphs.
- Do not create dense dashboard tables without visual hierarchy and explanatory labels.
- Do not sacrifice usability for a dramatic hero composition.

## Implementation handoff

Before coding, identify the page context (marketing, workspace, interview room, or marketplace), choose its canvas/surface pair, define the primary action, and decide where the visual proof lives. Reuse the palette, radius, spacing, and motion rules above. After implementation, check the first viewport, keyboard focus, mobile stacking, reduced-motion behavior, and whether the page still feels warm and focused when all decorative elements are removed.

