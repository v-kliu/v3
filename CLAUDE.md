# Victor Liu Personal Website

## Project
Personal portfolio site. Split-panel layout: fixed left sidebar (40%), scrollable right content (60%).
Stack: React, TypeScript, Tailwind CSS, Framer Motion. Deployed on Vercel.

## Structure
- src/App.tsx — root, composes layout
- src/components/ — one file per section or UI element
- src/SpaceBackground.tsx — animated star/meteor canvas background
- src/index.css — global styles, font imports

## Sections
About, Experience, Education, Projects

## Visual Theme — "Deep Space"
- Background: #0B0B1A
- Primary accent: Cyan #00D9FF — highlights, active states, links, borders
- Text hierarchy: #8892b0 (default) → #a8b2d1 (light) → #ccd6f6 (lightest) → white (headings)
- Fonts: Inter/Calibre (sans), SF Mono/Fira Code (mono for tech tags)

## Layout Rules
- Left sidebar: fixed, never scrolls, contains headshot, name, subtitle, nav, socials
- Right panel: scrollable, sections stack vertically with generous spacing
- Mobile: sidebar becomes off-canvas drawer via hamburger — right panel becomes full width
- Single page, no routing — smooth scroll navigation via Intersection Observer

## Conventions
- TypeScript throughout — no `any` types
- Tailwind utility classes only, no inline styles
- Framer Motion for all animations — match existing patterns before adding new ones
- Preserve SpaceBackground.tsx exactly — do not modify star/meteor/cursor effects
- Monospace font (font-mono) for all tech stack tags

## Design Principles
- Minimal chrome — content is the focus, not decoration
- Hierarchy through color — cyan = interactive/important, slate = supporting, white = headings
- Generous whitespace — sections breathe, nothing feels cramped
- Subtle depth only — glow and shadows serve hierarchy, not aesthetics
- No AI-slop patterns — no gradient blobs, no bento boxes, no generic 3-column icon grids

## Commands
- npm start — local dev server
- npm run build — production build

## Build Requirement
Every coding session must end with a passing build. After any changes:
1. Run `npm run build`
2. Fix all errors before considering the task complete
3. Do not stop until `npm run build` passes with zero errors
This is non-negotiable — a broken build is an incomplete task.

## Git Workflow
After every completed task where the build passes:
1. Stage all changes with `git add -a`
2. Write a concise commit message describing what changed
3. Commit and push to the current branch
Do not commit if the build is failing.