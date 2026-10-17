# UI Parity and Polish

Last updated: 2026-08-12

## Goal

Bring Handy Replacements' UI up to the visual and interaction quality demonstrated in PR #455 while preserving the current implementation's correctness, accessibility, internationalization, and focused component structure.

## Reference

- PR implementation: `origin/pr/455:src/components/settings/Replacements.tsx`
- Current implementation: `src/components/settings/replacements/`
- PR #455 screen recordings are the visual source of truth where they differ from its committed code.

## Parity Targets

- Make advanced options collapsible; start collapsed for new rules and expand automatically when editing a rule that uses them.
- Present punctuation trimming and space trimming as compact **Before / After** segmented controls.
- Present next-character casing as a compact **None / Upper / Lower** control.
- Add icons and concise help tooltips to advanced-option labels.
- Edit a rule inline beneath its row instead of in a detached editor above the list.
- Restore compact rule cards with visually distinct search and replacement values, contextual option indicators, and state-specific borders.
- Reveal secondary row actions on hover/focus while keeping them keyboard accessible.
- Improve drag-and-drop feedback and visual density without removing keyboard reordering.
- Keep filtering, import/export, empty replacements, regex validation, and magic-tag autocomplete visually integrated with the polished layout.

## Preserve from the Current Implementation

- Focused components instead of the PR's single 959-line component.
- Empty replacement values and exact Rust-regex validation.
- Native file dialogs, import feedback, and stable imported-rule tracking.
- Complete translations, semantic controls, visible focus states, Escape cancellation, and keyboard magic-tag/reordering behavior.
- Disabled-state handling and safe `[run]` autocomplete.

## Workflow

- [x] Polish the add/edit form and collapsible advanced controls.
- [x] Polish rule rows, inline editing, indicators, and actions.
- [x] Polish filtering, ordering feedback, import/export, and empty states.
- [x] Run frontend validation and commit each coherent slice separately.
- [ ] Compare the running app with the PR recordings and fix remaining visual discrepancies.

## Done When

- The editor and rule list match the PR's compact visual hierarchy and interactions.
- Current behavioral and accessibility guarantees remain intact.
- The running macOS app has been visually checked at typical and narrow settings-window widths.
