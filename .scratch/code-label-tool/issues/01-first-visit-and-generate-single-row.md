# 01 — First visit and generate the single row

**What to build:** `npm run dev` opens **Code Label Tool**. One empty QR card (dropdown with all five types, textarea, disabled ×, reserved slot). **Generate all** encodes that row (empty → `Invalid Code`, success → scannable image, encoder fail → `Invalid Code` and image cleared). Type change clears image; data change keeps image and clears error. Per-type slot sizes. **Delete all** resets the one row to empty QR.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] A local Vite + React + TypeScript + Tailwind page titled **Code Label Tool** runs with the project dev script
- [ ] First visit is one empty QRCode (11) card: type dropdown, then textarea, then a disabled ×, then a reserved image slot
- [ ] Dropdown lists `Code39 (2)`, `Code128 (4)`, `QRCode (11)`, `PDF417 (12)`, `Datamatrix (13)` in that order
- [ ] Textarea starts 3 rows tall and grows as you type; payload is not trimmed or case-folded
- [ ] Image slot is always reserved at the per-type size (QR / Datamatrix 320×320, PDF417 480×200, Code128 / Code39 480×160); inputs flex, the box does not
- [ ] **Generate all** and **Delete all** sit at the end of the page, both enabled on the single empty row
- [ ] Generate all on empty string `""` shows **Invalid Code** in the slot, no image, encoder not called
- [ ] Generate all on a valid payload draws a black-on-white image with quiet zone and no text on the image
- [ ] Generate all when the encoder fails shows **Invalid Code** and clears any previous image
- [ ] Spaces-only payload is sent to the encoder (not treated as empty)
- [ ] Changing type keeps the textarea and immediately clears image and error
- [ ] Changing data keeps the last image and immediately clears any error
- [ ] **Delete all** immediately replaces the row with one new empty QRCode (11) row
- [ ] Session rules live behind the `state × event → state` seam and are covered by tests with a fake encoder
