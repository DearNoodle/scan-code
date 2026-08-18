# 02 — The other four types actually draw

**What to build:** Code39, Code128, PDF417, and Datamatrix generate into their reserved boxes and can be scanned off the laptop screen. Same generate / stale / error rules as QR.

**Blocked by:** 01 — First visit and generate the single row

**Status:** ready-for-agent

- [ ] A valid Code39 payload generates a scannable image in the 480×160 slot
- [ ] A valid Code128 payload generates a scannable image in the 480×160 slot
- [ ] A valid PDF417 payload generates a scannable image in the 480×200 slot
- [ ] A valid Datamatrix payload generates a scannable image in the 320×320 slot
- [ ] An encoder failure for any of these types shows **Invalid Code** and clears any previous image
- [ ] Switching from a successful QR image to another type still clears the image immediately (rule from 01, now with a real second encoder)
- [ ] Library defaults only — no extra encoding knobs in the UI
