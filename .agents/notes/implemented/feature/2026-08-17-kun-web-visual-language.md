# Agent Note: Kun visual language for the Web client

Status: implemented

English | [中文](2026-08-17-kun-web-visual-language.zh.md)

## Problem

The Web client has a neutral platform palette and a fish-only empty-session hero, while the requested product direction uses the supplied yellow mascot, sky-blue backdrop, warm panels, orange emphasis, and heavy ink outlines. The visual direction must remain legible as an agent work surface and must not alter session, settings, or theme-preference behavior.

## Decision

The Web client uses the supplied `apps/web/public/ikun-mascot.png` at `/ikun-mascot.png` as the blank-session hero's visual anchor. `ui-sidebar` reuses that same asset for the expanded `ikun` / `HARNESS` lockup and the collapsed rail mark. The image stays in the Web app's static asset set; it is not copied into a package bundle.

`packages/client/ui-theme/src/styles/design-platform.css` owns the shared `--dsh-kun-*` presentation tokens for both light and dark palettes. Semantic aliases use sky blue surfaces, cream elevated panels, yellow primary actions, orange emphasis, cobalt information states, and near-black ink. The hero composer, settings shell, and plugin cards consume those tokens and add limited outline and offset-shadow details. The existing `light` / `dark` / `system` preference remains the only theme selection, and no settings or session wire field changes.

`packages/client/ui-theme/src/styles/base.css` owns the rounded local font stacks: body text uses `Trebuchet MS` with platform CJK fallbacks, while `Comic Sans MS` / `Segoe Print` lead the display stack for the hero headline and sidebar brand. Code remains on the existing monospace stack.

## Alternatives considered

**Keep the neutral platform palette.** Rejected because it does not express the requested mascot-led visual direction across the home and settings views.

**Generate or package a replacement mascot.** Rejected because the user supplied the image to use directly; adding a generated or third-party substitute would diverge from the reference and add an unnecessary asset variant.

**Add a separate user-selectable Kun theme.** Rejected because the request changes the shipped Web presentation, not the persisted theme preference contract. A new preference would expand settings persistence and test scope without changing the visual requirement.

## Consequences

The empty-session hero and sidebar brand now depend on the Web app serving `/ikun-mascot.png`; the package README records that ownership. Theme aliases and CSS modules remain the presentation authorities, so plugins continue to receive the same slot and settings behavior. The shared palette affects every client component that reads the changed aliases, while active-session layout and model-visible behavior remain unchanged.
