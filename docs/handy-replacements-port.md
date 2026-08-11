# Handy Replacements Port

Last updated: 2026-08-11

## Goal

Port the behavior of [PR #455](https://github.com/cjpais/Handy/pull/455) onto current Handy as a separately installable macOS app named **Handy Replacements**.

This is a selective port, not a branch merge. Current Handy is hundreds of commits ahead of the PR and now has different transcription, settings, shortcut, UI, and LLM integration seams.

## Decisions

- Preserve PR #455's feature set and ordering semantics unless an intentional correction is listed below.
- Keep the implementation split into focused, testable units instead of copying the PR's replacement engine into `TranscriptionManager` or its 959-line UI component intact.
- Apply replacements after Handy's custom-word/filler cleanup and normalization, but before Chinese conversion, optional LLM post-processing, history output, and paste.
- Process enabled rules in stored order; each rule receives the preceding rule's output.
- Preserve `[run]` and its unescaped shell placeholders. Execute commands only after all ordinary replacement rules finish.
- Keep JSON import validation intentionally shallow and allow imported duplicates.
- Do not port obsolete shared-component changes when current Handy already provides the needed behavior.
- Avoid unrelated upstream cleanup to minimize future merge drift.

## Intentional Corrections to PR #455

- Allow empty replacement values so rules can delete matched text.
- Treat replacement values for literal rules literally, including `$` characters.
- Support regex capture expansion consistently with and without advanced options.
- Validate invalid regexes in the UI while the backend continues to fail open.
- Use one shared punctuation definition for before/after trimming.
- Apply magic tags in textual order rather than always prioritizing `[run]`.
- Suppress pasted output for `[run]` only when the command process starts successfully.
- Internationalize all user-facing strings for every current Handy locale.
- Preserve add-form focus without changing the shared `Input` component.

## Progress

- [x] Create independent app identity (`24b5eba`)
- [x] Disable official updates (`3882d35`)
- [x] Remove obsolete frontend updater implementation (`d8e0043`)
- [x] Remove obsolete backend updater implementation (`e184999`)
- [x] Add replacement settings types, defaults, persistence commands, and generated bindings
- [x] Add a focused replacement engine with ordered literal and regex replacement tests
- [x] Add punctuation/space trimming and next-character capitalization tests
- [x] Add date, time, casing, spacing, and command transformations
- [ ] Integrate replacements into the shared transcription cleanup pipeline before optional LLM processing
- [ ] Add the Replacements settings section and core rule CRUD controls
- [ ] Add filtering, duplicate indicators, enable/disable, and drag ordering
- [ ] Add magic-tag autocomplete and advanced-option controls
- [ ] Add JSON import/export and imported-rule indicators
- [ ] Add complete translations and accessibility behavior
- [ ] Build the separate macOS app and perform end-to-end QA alongside official Handy

## Required Behavior

- Global and per-rule enable/disable, both defaulting to enabled.
- Case- and accent-insensitive literal substring matching.
- Rust regex matching and all-match replacement.
- Ordered rules, newline replacement via `\\n`, horizontal space trimming, punctuation trimming without crossing newlines, and optional capitalization of the next character.
- Magic tags: `[date]`, `[time]`, `[lowercase]`, `[lowcase]`, `[uppercase]`, `[capitalize]`, `[nospace]`, and quoted `[run]` commands.
- Command placeholders: `{text}`, `{text_nospace}`, `{text_nopunctuation}`, and `{text_nospace_nopunctuation}`.
- Add, edit, cancel, delete, duplicate, filter, reorder, enable/disable, import, and export UI operations.
- UI indicators for regex, magic, trimming, capitalization, duplicates, disabled rules, and newly imported rules.
- Escape cancellation and keyboard navigation for magic-tag autocomplete.

## Validation Gate per Slice

- `git diff --check`
- Frontend formatting, ESLint, TypeScript, translation consistency, and production build when affected
- Rust formatting, `cargo check`, `cargo test`, and Clippy with warnings denied when affected
- Focused unit tests for every replacement semantic before pipeline integration
- Review and commit each coherent slice independently

## Notes

- Local PR reference: `origin/pr/455`
- Current Handy already depends on `regex` and `chrono`; the port should not need new Rust dependencies for the original feature set.
- Current `post_process_transcription_text` is the shared batch/streaming integration seam.
- The optional LLM call happens later in `process_transcription_output`.
- Updater-only translation keys remain harmlessly unused; removing them is not required for the port.
