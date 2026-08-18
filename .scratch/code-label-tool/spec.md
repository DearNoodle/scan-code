Status: ready-for-agent

# Code Label Tool

## Problem Statement

I need to put several barcode and QR images on a laptop screen so I can scan them with a phone or handheld. Today I have to generate them one-off elsewhere. I want a local page where I type the payload, pick the type, click once, and scan what appears. I only need a handful of labels at a time. I do not need to print, download, persist, or decode anything with a camera.

## Solution

A local Vite + React page titled **Code Label Tool**. Each label is a card: type dropdown, textarea, delete, and a reserved image slot. I add rows with `+`, fill codedata + codetype, and click **Generate all**. Valid rows draw a black-on-white image I can scan off the screen. Failures show **Invalid Code** in that row's image slot. Nothing is saved. Reload is a blank slate.

## User Stories

1. As a user, I want a local webpage I can start with a dev server, so that I can generate labels on my laptop without hosting or an account.
2. As a user, I want the tab and page titled **Code Label Tool**, so that I can find the window among other tabs.
3. As a user, I want a light-themed, full-width desktop layout, so that the page is readable on a laptop monitor without stretching the barcode itself.
4. As a user, I want each label on its own card, so that a handful of labels stay visually separate.
5. As a user, I want the left side of a card to hold the type dropdown, then the textarea, then a ×, so that I pick the type before I type the data.
6. As a user, I want the right side of a card to be a reserved image slot of a fixed size for that type, so that rows do not jump when an image appears or disappears.
7. As a user, I want the inputs to take leftover width and the image slot to stay its fixed size, so that barcodes do not get stretched on a wide monitor.
8. As a user, I want the first visit to show one empty QRCode (11) row, so that I can start typing immediately.
9. As a user, I want to add another row with `+` at the bottom-left of the last row, so that I can make several labels in one session.
10. As a user, I want a new row to copy the type of the last row in the list, so that adding more of the same type is one click.
11. As a user, I want `+` not to steal keyboard focus, so that adding a row does not yank me out of what I was typing.
12. As a user, I want to delete an extra row with a clearly visible × on that row, so that I can drop a label I no longer need.
13. As a user, I want the last remaining row's × disabled, so that the page never has zero labels.
14. As a user, I want **Delete all** at the bottom of the page, so that I can wipe the session in one click.
15. As a user, I want **Delete all** to be immediate, with no confirm dialog, so that reset is fast.
16. As a user, I want **Delete all** to leave one empty QRCode (11) row, so that I am back to a first-visit page.
17. As a user, I want **Delete all** enabled even when the page is already one empty QR row, so that the control is always there (a no-op reset is fine).
18. As a user, I want **Generate all** at the bottom of the page next to **Delete all**, so that one click draws every ready label.
19. As a user, I want **Generate all** visible but disabled when it would have nothing to do that the UI already forbids (there is always at least one row; the button stays available for that row).
20. As a user, I want Generate all and Delete all at the end of the page, not sticky, so that a handful of cards does not need extra chrome.
21. As a user, I want to pick a type from a dropdown labelled `Code39 (2)`, `Code128 (4)`, `QRCode (11)`, `PDF417 (12)`, `Datamatrix (13)` in that order, so that I see both the name and the id my other tools use.
22. As a user, I want a growing textarea (starts 3 rows tall) for codedata, so that I can paste short or long / multi-line payloads without switching controls.
23. As a user, I want the page not to trim or uppercase what I type, so that the payload I enter is the payload that is encoded.
24. As a user, I want Generate all to treat only a completely empty string as missing data, so that a payload of spaces is still sent to the encoder.
25. As a user, I want an empty codedata field to show **Invalid Code** in that row's image slot and not call the encoder, so that a blank row is an obvious miss.
26. As a user, I want any encoder failure to show **Invalid Code** in that row's image slot and clear any previous image, so that I never scan a picture that does not match a failed generate.
27. As a user, I want a successful generate to draw a black-on-white image with a quiet zone in that row's slot, so that a phone can read it off the laptop screen.
28. As a user, I want mixed rows on Generate all to succeed or fail independently, so that one bad row does not block the others.
29. As a user, I want no human-readable text drawn on the image, so that the picture is only the code (the payload is already in the nearby textarea).
30. As a user, I want QR and Datamatrix slots to be 320×320, PDF417 to be 480×200, and Code128 / Code39 to be 480×160, so that 1D and 2D codes have a phone-scannable box that matches their shape.
31. As a user, I want changing the type to keep the textarea and immediately clear that row's image and error, so that I never scan a picture of the old type.
32. As a user, I want editing the textarea after a successful generate to keep the old image and clear any error, so that I can keep scanning until I click Generate all again.
33. As a user, I want editing the textarea after a failed generate to clear the **Invalid Code** text immediately, so that a stale error does not sit next to new data.
34. As a user, I want no extra encoding knobs (ECC, checksum, columns, …) in the UI, so that I only supply codedata and codetype.
35. As a user, I want no persistence across reload, so that a refresh is always a clean first visit.
36. As a user, I want no print, download, PDF, or export, so that the tool stays an on-screen scan target.
37. As a user, I want no camera / decode mode, so that the page only encodes.
38. As a user, I want no keyboard shortcut for Generate all, so that the only commit is the button.
39. As a user, I want latest Chrome or Edge to be enough, so that I do not need cross-browser work for a self-use laptop tool.
40. As a user, I want Tailwind styling that is a bit polished, so that a local tool is not ugly.
41. As a user, I want library defaults for every symbology, so that I do not have to know encoding options to get a scannable image.

## Implementation Decisions

- Greenfield app. Scaffold Vite + React + TypeScript in this repo (it currently has no application code). Use Tailwind for styling.
- Single page, no router, no backend, no persistence.
- One testable module owns the tool session: a pure `state × event → state` function (a reducer). Events: add row, delete row, delete all, change type, change data, generate all. This is the only product-rule seam.
- Generate all is the only event that talks to a barcode encoder. The reducer accepts an encoder as a dependency so tests can inject a fake. The real adapter wraps `bwip-js` with library defaults, black on white, quiet zone included.
- Encoder contract: given codedata + codetype, return an image (data URL or equivalent) or throw. The session maps any throw, and the empty-string case, to the same user-visible **Invalid Code**. Empty string is rejected before the encoder is called.
- Codetypes, in dropdown order, with ids: Code39 `2`, Code128 `4`, QRCode `11`, PDF417 `12`, Datamatrix `13`. Default / reset type is QRCode `11`.
- Image slot sizes are part of the type table, not user-editable: QR and Datamatrix 320×320, PDF417 480×200, Code128 and Code39 480×160. The image scales to fit inside that box; the box does not change with content.
- Row identity is an opaque id so React can key cards. New rows get a fresh id. Delete all replaces the list with one new empty QR row (new id).
- Last-row × is disabled. Delete of a non-last row removes that row only.
- `+` appends a row whose type equals the current last row's type and whose data / image / error are empty. Focus is not moved.
- Type change on a row: update type, clear image and error, keep data.
- Data change on a row: update data, keep image, clear error. Do not trim or case-fold.
- Generate all walks every row independently. Empty string → error **Invalid Code**, no image, no encoder call. Non-empty → call encoder; success replaces image and clears error; failure clears image and sets **Invalid Code**.
- React components are a thin view over session state. They do not re-implement the rules above.
- Target latest Chromium (Chrome / Edge). No print CSS, no PWA, no service worker.

## Testing Decisions

- Test external behaviour of the session module only: given a state and an event (and a fake encoder when generating), assert the resulting rows — types, data, presence/absence of image, error text.
- Do not test React rendering, Tailwind classes, layout pixels, or `bwip-js` output.
- Fake encoder: succeed with a distinguishable token per (data, type) pair, or throw when the test says the payload is invalid. Tests must cover:
  - first state is one empty QR row
  - add copies last row type, empty data/image/error
  - cannot delete the last row
  - delete all resets to one empty QR row (new identity)
  - type change clears image and error, keeps data
  - data change keeps image, clears error, does not trim
  - generate: empty string → Invalid Code, encoder not called
  - generate: encoder throw → Invalid Code, image cleared
  - generate: success writes image, mixed rows independent
  - generate: spaces-only is sent to the encoder
- No prior art in this repo (greenfield).
- A thin adapter test for the real encoder is optional and out of the required seam: if added, it only checks that a known-good payload returns an image and a known-bad payload throws — not pixel contents.

## Out of Scope

- Decoding / webcam / "scan this physical label"
- Print, PDF, PNG/SVG download, copy image
- Persistence (`localStorage`, files, accounts)
- Live update while typing (generate is explicit)
- Extra encoding options in the UI
- Auto-trim, auto-uppercase, or other payload cleanup
- Keyboard shortcuts
- Mobile / phone layout
- Zero-row state
- Virtualization, file import, spreadsheet paste of many rows
- Types other than the five listed
- Dark theme / OS theme follow
- Cross-browser QA beyond Chromium

## Further Notes

- Confirmed in grilling: encode-only, on-screen scan target, handful of labels, localhost Vite + React + TS + Tailwind, `bwip-js` with defaults chosen in development.
- The earlier mistaken implement attempt after grilling was reverted; nothing from it is in the repo.
- Local tracker path for this feature: `.scratch/code-label-tool/`. Tickets from `/to-tickets` go under `issues/`.
