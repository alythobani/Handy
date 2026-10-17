# Handy Replacements v0.9.8 integration

Date: 2026-10-17
Branch: `update/handy-v0.9.8`

## Outcome

Merge official Handy v0.9.8 (`14f6f0d`) into the existing custom build (`aed6a2c`) while preserving the replacements feature, independent app identity, and absence of the official self-updater.

The integration uses a separate Git worktree at `forks/Handy-worktrees/v0.9.8`. The existing checkout and running app remain at `forks/Handy`.

## Integration decisions

- Preserve both histories with a merge commit rather than replaying the custom commits.
- Keep `Handy Replacements` and `com.anatta.handy-replacements` as the product identity.
- Keep upstream's new tray synchronization architecture and error handling, omitting update-check menu entries and commands.
- Omit upstream's new updater-lock state from the frontend store and hook because this custom build has no updater.
- Preserve upstream's order: language detection, Chinese script conversion, custom-word correction, filler cleanup, normalization, then replacements. LLM processing, history, and paste remain downstream.
- Preserve the standalone replacement engine and all replacement UI files byte-for-byte from the previous custom build.
- Include replacement strings in the newly added Catalan and Indonesian locales using the existing English fallback text convention.
- Regenerate the Bun/Nix dependency files, Cargo lockfile, and Tauri bindings from the combined sources. A temporary test harness exported bindings without launching Handy and was removed afterward.
- Keep the existing uncommitted planning checkboxes in the integration branch as well as in the original checkout.

## Validation

- [x] All 309 Rust library tests passed, including the added Chinese conversion/replacement ordering test.
- [x] `cargo check --offline` passed.
- [x] ESLint passed.
- [x] TypeScript and Vite production build passed.
- [x] Frontend formatting and Rust formatting checks passed.
- [x] All 25 non-English locales have complete translation key coverage.
- [x] Model language coverage check passed.
- [x] Keyboard and history clipboard assertion scripts passed.
- [x] Bun/Nix generated dependency metadata matches the lockfile.
- [x] Clippy passed with all warnings denied except four inherited upstream categories listed below.
- [x] macOS release app bundle built and its ad-hoc signature verified with `codesign --verify --deep --strict`.
- [ ] User runtime QA: microphone, shortcuts, existing settings and rules, replacement output, history, and paste.

## Known validation limits

Strict `cargo clippy --all-targets -- -D warnings` reports 14 findings inherited from the v0.9.8 source with this machine's Rust 1.97 toolchain. The affected model manager, GGUF metadata, and portable-mode files are unchanged from upstream; the test-module ordering also exists upstream. To keep this integration focused, the completed Clippy run allows these four categories while denying every other warning:

- `clippy::useless_borrows_in_formatting`
- `clippy::items_after_test_module`
- `clippy::manual_repeat_n`
- `clippy::write_with_newline`

The installed Apple Command Line Tools do not include the full Xcode FoundationModels SDK. Handy therefore builds its existing Apple Intelligence stubs. Local speech recognition and external LLM providers do not depend on that optional SDK.

No Nix build or Windows/Linux build was performed. Vite retains its existing large-chunk advisory. Rust reports a future-compatibility advisory for the inherited `block` dependency.

## Build artifact and restore point

The arm64 app bundle is at `src-tauri/target/release/bundle/macos/Handy Replacements.app` in this integration worktree. Its version is `0.9.8`, its identifier is `com.anatta.handy-replacements`, and its signature is ad hoc. The bundle includes the tray resources and Silero VAD model. Its linked libraries are macOS system libraries and frameworks.

The working app's executable and Info.plist were hashed before and after the release build and remain unchanged.

A pre-QA snapshot of the current settings, a consistent SQLite history database backup, and recordings is saved at `/Users/alythobani/dev/open-source/.backups/Handy/20261017T141249Z/app-data-before-v0.9.8`.

## Runtime QA and publication

Quit the old Handy Replacements process before opening the new app bundle, since both use the same app identity and single-instance behavior. Keep the old bundle available for rollback until QA is complete.

The fork's current remote `main` contains 23 commits after the stable v0.9.8 release. Publishing a stable custom build as `main` therefore requires a separate decision: back up and replace that branch with an explicit expected-SHA lease, or publish the custom build under another branch and change the default. No remote branches are changed by this integration.
