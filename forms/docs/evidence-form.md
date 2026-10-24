# ED Evidence definition

FID 759, version 2.0. Answer data, layout and the original XML target remain separate.
The four evidence levels stay exact. Each of 1–100 completed studies has three required
1–4,000-character answers. Choosing a level does not establish scientific validity or eligibility.

## Existing library components

The definition selects the maintained CollapsibleFieldList alongside native Radio and TextArea
child widgets. Study headings and collapsed answer previews are bounded; an explicit hint directs
the reader to open the entry for full answers. The open/Edit controls expose the original text.
Missing/blank values and validation errors remain visible. No answer, schema rule, XML binding,
new renderer, widget copy, persistent row ID or question-bank override is introduced.

The list reports draft edits, additions and deletions through the preview's callback. The list's
DOM events do not create another writer; ordinary inputs retain native FormData collection and
sibling edits retain callback-owned arrays. Clear/sample resets replace draft context. This is
preview behavior, not signing, prefill authorization, upload or submission service support.

The DAT has four visually blank starter rows. The library starts with one row for progressive
disclosure, retaining the 1–100 complete-row rule and full level-dependent instructions. The
DAT Required? versus business-rule/XSD conflict remains explicitly documented for review.
Synthetic examples are illustrative; the ED_Evidence registration short name remains proposed.
No API sync is enabled. Production SGG must separately support the library component. The native
FieldList bug #12925 remains open and its source is unchanged by this definition.

## Review

Run fresh parity, consumer tests and type checks. Load both authored examples. Add a blank study,
check the three required cells, fill distinct answers, delete an earlier entry, add another and
edit it without resetting. Retained/new answers must stay distinct in live JSON. Change the
evidence level, collapse/reopen long answers, and confirm full text is retained. Clear removes
all data; Add disables at 100 rows. Validate source boundaries and original-XSD output separately.

Replay Key Contacts and R&R because the display and callback support are shared. Long labels
must wrap at desktop and narrow widths; empty/missing states, enum labels, nested answers and
existing file-count summaries must remain intact. The max100→101 mutation must fail parity and
consumer checks before exact restoration. Actual API/original-XSD witnesses validate both typed
examples and invalid levels, missing/empty/overlong cells and invalid row counts.
