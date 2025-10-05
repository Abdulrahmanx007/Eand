# TODO — Make this project light, smooth, and fast on 4 GB RAM

This repo currently has a single HTML file (`Escaltion.html`) that combines markup, styling, and logic. It works, but it’s heavy for old PCs (duplicated HTML shells, a very large inline SVG background, lots of inline JS/CSS, many `window.open` calls, and deprecated APIs). The plan below focuses on low memory usage, faster load, and simpler maintenance, with minimal tooling.

## Progress summary (as of 2025-10-05)

- Done
  - Added lightweight tabbed launcher `index.html` to host Escalation Matrix and Advanced Workspace Hub as separate tabs.
  - Implemented lazy-loading for Advanced Workspace Hub (loads only when tab is selected) with an Unload button to free memory on 4 GB PCs.
  - Removed legacy inline scripts from `Escaltion.html`; all logic centralized in `main.js` to avoid in-page body rendering.
  - Removed massive inline CSS/background; switched to light external `styles.css` with simple background (no fixed attachment) and low-paint styles.
  - Consolidated to a single valid document (one `<head>/<body>`), added a proper `<title>`.
  - Replaced heavy inline display styles with a `.hidden` class and classList toggling throughout flows.
  - Modernized clipboard usage with `safeCopy()` + fallback and added a small toast for user feedback; removed direct `execCommand` usage except in fallback path.
  - Converted quick-access link buttons to `data-open` + delegated handler in `main.js` (no inline `onclick` for links).
  - Pruned legacy `detectIE()` usage and function.
  - Centralized copy-button styling in CSS (`.copDb`, `.copDb.active`) and removed inline color overrides.
  - Fixed non-working flows: added missing handlers for Delay in delivery (TO/CC/Subject/Body), Sales lead (Submit), and Reconnection (TO/CC/Subject/Body).
  - Unified copy UX: removed the global "CLICK HERE TO COPY" button; each Create Body now auto-copies and shows a toast; improved legacy fallback using an offscreen textarea.
  - UI/UX: Introduced a centered `.container`, card sections (`.card`) with headings for quick links and each form; added a skip-link; consistent spacing and labels; Enter-to-submit keyboard support.
  - Startup/Clock: Wired Start Day and 12h clock in `main.js` with `setInterval` and change-only updates.

- In progress / partial
  - Accessibility polish: focus styles added, but label associations and aria/alt text still need a pass.
  - Contrast review: base UI improved; generated email tables still use some dark-red styling inline.
  - Quick links/table markup could be further simplified semantically (non-blocking).

- Not started
  - Refactor generated email bodies to lightweight templates (reduce DOM churn and inline `style` in generated nodes).
  - Optional package/docs polish (README, optional launcher page, favicon).
  - Optimize Advanced Workspace Hub for low-RAM: reduce animations when `prefers-reduced-motion` is set; provide Low-Performance toggle.

## Priorities (top → bottom)

1) Kill big payloads and repaints
- [x] Replace the huge inline SVG base64 background with a tiny solid color or small gradient; keep background-attachment: fixed off.
- [x] Remove text-shadow/box-shadow and heavy glow effects where not essential.
- [x] Prefer system fonts only (already mostly used). Avoid loading any external fonts.
  - [x] Keep Advanced Hub off the main page until requested (via tabs shell); Escalation is the default loaded app.

2) Split concerns without adding frameworks
- [x] Extract inline `<style>` into `styles.css` and inline `<script>` into `main.js` to cut HTML size and improve caching. (Note: most logic still inline; see Phase B status.)
- [x] Keep one HTML `<head>`/`<body>` only; fix duplicate HTML/HEAD/BODY blocks currently present.
- [~] Move repeated style values into CSS classes; remove unused/duplicate rules. (Mostly done for UI; remaining inline styles exist in generated email tables.)

3) Reduce JS work and memory
- [ ] Replace dynamic table DOM building with minimal string templates or a single hidden template element to avoid many node creations.
- [x] Avoid repeated `document.getElementById(...).setAttribute("style", ...)` calls; toggle a `hidden` class instead.
- [x] Replace `setTimeout(..., 500)` clock loop with `setInterval` and only update text when the value changes.
- [x] Remove `detectIE()` unless truly required; IE is EOL and the result isn’t used.
- [x] Use feature-checked `navigator.clipboard` with a fallback; avoid `document.execCommand('copy')` (deprecated). Added `safeCopy()` + toast.
  - [x] New tab shell can unload the Advanced Hub iframe on demand to release memory.

4) Simplify layout and markup
- [ ] Replace table-based layout for generated bodies with a semantic block list (definition list or simple paragraphs) for lower DOM cost.
- [ ] Ensure only one `<thead>`/`<tbody>` and close tags correctly. Remove stray `</i>` and duplicate `<br>` spam. (Do a quick pass after handler refactor.)
- [~] Convert inline `onclick` handlers to `addEventListener` wiring. (Done for quick links via `data-open`; remaining submit/copy handlers to be moved.)

5) Defer/idle work
- [x] Initialize handlers on `DOMContentLoaded` and defer non-critical JS with `defer` attribute. (Links delegated; submit/copy wired in JS; startup and clock in `main.js`.)
- [x] Generate email body only when the user clicks the relevant button; avoid creating hidden nodes up-front.
  - [x] Lazy-load Advanced Workspace Hub iframe on first tab activation; show skeleton while loading.

6) Accessibility and usability
- [~] Ensure unique IDs; fix mislabeled inputs; add `<label for>` associations correctly. (Needs audit.)
- [~] Keyboard navigation: buttons focusable; Enter triggers submit. Provide visible focus styles. (Focus-visible added; keyboard submit wiring pending.)
- [~] Color contrast: replace dark red on black; remove text with color-only emphasis. (Base UI improved; generated tables still use darkred.)
- [x] Add a basic skip link and `lang` attribute. (Lang present on `<html>`; skip link added.)

7) Hardening and privacy
- [~] Guard `window.open` calls (feature detect pop-up blockers; show a single hint). Open only necessary tabs; consider a single launcher page. (Currently behind a click; add blocker hint later if needed.)
- [~] Validate numeric inputs; coerce to strings before concatenation; avoid leaking values to unexpected places. (Light validation still pending.)

8) Packaging and structure (no heavy build tools)
- [x] Final structure in place:
  - `Escaltion.html`
  - `styles.css`
  - `main.js`
  - `AdvancedWorkspaceHub.html`
  - `assets/` (optional small SVG/PNG if needed)
- [ ] No bundlers. If needed, a tiny minify pass can be done manually later.

9) Performance budget
- Shell: index.html ≤ 8 KB, tabs.css ≤ 5 KB, tabs.js ≤ 5 KB.
- Escalation page: HTML ≤ 30 KB, CSS ≤ 5 KB, JS ≤ 15 KB.
- Advanced Hub: loaded on demand; ensure animations are optional and heavy effects can be disabled.
  - Low-Performance: shell toggle passes `?low=1`; Hub disables animations/effects and respects `prefers-reduced-motion`.
- DOM nodes on initial load (shell + Escalation) ≤ 300.

10) Manual test plan (low-spec PC)
- Start with a cold cache and open `index.html`; confirm initial render < 300 ms and memory footprint small (~60–80 MB) for one tab.
- Navigate each flow (delivery, work order, visit delay, sales lead, reconnection, du paid). Ensure copy buttons put expected values on clipboard.
- Verify popups open only on click, not on load; check pop-up blocker message path.
- Toggle light/dark background to see contrast and CPU usage when scrolling (no fixed backgrounds).
- Switch to Advanced Hub tab; confirm it loads once and can be Unloaded to free memory. Check animations don't spike CPU; if needed, enable Low-Performance mode.

---

## Step-by-step tasks

Merge — Tab shell + lazy loading
- [x] Create `index.html` shell with accessible tabs for Escalation and Advanced Hub.
- [x] Add `tabs.css` and `tabs.js` for styling and logic (lazy-load + unload).
- [x] Load `Escaltion.html` eagerly; load `AdvancedWorkspaceHub.html` only when selected.
- [x] Add a Low-Performance toggle for Hub (reduces animations, disables background effects).

Phase A — Cleanup (safest wins)
- [x] Remove duplicate `<html>`, `<head>`, `<body>` sections from `Escaltion.html` (there are two full documents concatenated).
- [x] Remove the large base64 background and heavy shadows; use a plain background color.
- [~] Replace scattered inline `style` attributes with classes; remove unnecessary `<br>` tags and stray `</i>`. (UI inline styles replaced; generated table styling remains inline.)
- [x] Replace deprecated `document.execCommand('copy')` with `navigator.clipboard` + fallback message.

Phase B — Extract and wire assets
- [x] Create `styles.css` with the necessary rules only; link it in `<head>`.
- [x] Create `main.js`; move functions (startTime, change, submit*, copy*) into it; wire via `defer` and `DOMContentLoaded`.
- [~] Replace inline `onclick` attributes with `addEventListener` in `main.js`. (Quick links done; submit/copy to follow.)

Phase C — Behavior and memory
- [ ] Replace DOM-built tables with light HTML fragments or a template literal; inject once into a single container.
- [x] Replace style-setting sequences with class toggling; add a `.hidden { display:none }` rule.
- [ ] Simplify the clock loop using `setInterval`; update only when value changes.
- [x] Delete `detectIE()` and any IE-specific branches unless a real dependency exists.
 - [x] Remove inline scripts from HTML to avoid duplicate logic and on-page rendering.

Phase D — Accessiblity & polish
- [~] Ensure every input has a matching `<label for>` and unique `id`.
- [~] Add `title` or `aria-label` to icon-only buttons if any; ensure focus outline is visible.
- [~] Improve contrast of dark-red-on-black sections.

Phase E — Optional light improvements
- [ ] Add a minimal `README.md` with usage and offline note.
  (Note) Tabbed launcher removed. Use the shared header to navigate between `Escaltion.html` and `AdvancedWorkspaceHub.html`.
- [ ] If needed, add a very small favicon (≤ 1 KB SVG).

## Known hotspots to fix in current file
- [x] Massive inline SVG background in `body { background-image: ... }` — remove.
- [x] Multiple repeated `document.getElementById(...).setAttribute('style', 'display: ...')` — replace with class toggles.
- [x] Deprecated `document.execCommand('copy')` — replace with Clipboard API fallback.
- [x] Duplicate doctypes/heads/bodies — merge into one valid document.
- [~] Many `window.open` calls in `Internet()` and start button — consider grouping behind one click with clear messaging. (Currently behind a single button; further grouping optional.)

## Next actions (short list)
1) DRY the Create Body generation using a tiny template helper and central config (recipients/labels) to reduce duplication and keep visual fidelity.
2) Finish an a11y label pass (unique IDs and `<label for>` associations) and add ARIA where useful.
3) Optional: simplify the quick links structure to semantic lists; consider a compact grid layout within `.card`.

## Definition of done
- Page loads fast on old PC (subjectively instant) and stays responsive.
- No duplicate HTML shells; no giant data-URI backgrounds; limited shadows.
- JS/CSS extracted, small, and readable; no deprecated APIs left.
- Flows verified with manual test plan above.
