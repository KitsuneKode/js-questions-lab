# UI/UX & Design System: "Dark Forge"

This app uses a premium, focused, weaponized code-literate environment (similar to Linear or Aceternity).

## Core Aesthetic

- **Colors**: Layered zinc backgrounds (`--bg-void` `#09090B`, `--bg-surface` `#111113`, `--bg-elevated` `#1A1A1F`). Primary action color is warm amber/gold (`#F59E0B`). Sky blue for code accents. Avoid generic purple/blue AI gradients or lime green.
- **Typography**: `Instrument Serif` for editorial main headings, `Geist Sans` for readable body text, and `Geist Mono` for precise code blocks.
- **Shadows**: Layered drop shadows and ambient glowing shadows (`shadow-glow`) to elevate active components. Avoid excessive glassmorphism.

## Component Principles & Motion

- Use `motion/react` over `framer-motion` for updated API compliance. Ensure no unclosed templates/backticks.
- **Spring Animations**: Use Framer Motion `spring` physics (bounces between `0.1` and `0.2`) for snappy, magnetic feels.
- **Active States**: Primary buttons/cards utilize `scale-[0.98]` physical press states.
- Code blocks must feel intentional and refined with consistent spacing, line-height, contrast, and framing.

## What To Avoid

- Oversized rounded cards everywhere.
- Fake complexity in dashboards.
- Visual noise around code content.
- "Toy code playground" or "startup dashboard" feel.
