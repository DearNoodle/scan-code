# 03 — A handful of labels

**What to build:** `+` under the last row copies that row’s type. Extra rows can be ×’d; last × stays disabled. **Generate all** walks every row independently. **Delete all** wipes back to one empty QR.

**Blocked by:** 01 — First visit and generate the single row

**Status:** ready-for-agent

- [ ] `+` sits at the bottom-left of the last row only and does not move focus
- [ ] `+` appends a row whose type equals the current last row’s type, with empty data / image / error
- [ ] Each extra row has an enabled ×; the last remaining row’s × is disabled
- [ ] Deleting a non-last row removes only that row
- [ ] **Generate all** processes every row independently: valid rows draw, empty `""` and encoder failures show **Invalid Code** and clear that row’s image
- [ ] A successful image on one row is not cleared when a sibling row fails
- [ ] **Delete all** immediately resets to one new empty QRCode (11) row, even when several cards exist
- [ ] Multi-row add / delete / generate-all behaviour is covered on the session seam with a fake encoder
