# ED Evidence definition

FID759, version2.0. The definition separates answer data, layout and the original XML target.
It uses existing Radio, TextArea and native FieldList widgets. The four source evidence levels
remain exact strings. Each of1–100 studies has three required1–4000-character answers.
Selecting a level and validating a synthetic example do not establish scientific validity or eligibility.

The DAT displays four initially blank rows. This preview starts with one required row and lets
an applicant add more. Blank draft rows are not invented source answers; once added, the native
FieldList reports them through its existing callback so validation can show missing cells.
Study guidance for Rationale versus Promising/Moderate/Strong remains visible in the layout.

Two authored TypeSpec examples exercise a single rationale study and two distinct promising-evidence
studies. The unversioned registration short name ED_Evidence is proposed following maintained
examples; source root/namespace ED_Evidence_2_0 and version2.0 remain exact. No API sync is enabled.

## Review

Run normal fresh parity, site consumer tests and type checks. In the preview, load a sample,
add a blank study, check its three required errors, fill distinct answers, and delete the first
study. The remaining study must stay in the live JSON after Check for errors. Changing the evidence
level must retain the draft rows. Clear must remove all prior data. The native Add control disables
at100 rows; independent schema and original-XSD witnesses cover100 complete rows and reject101.

For a reversible check, change the model maxItems100 to101, clean/compile and rerun the
Evidence parity/consumer tests. Expect a failure, then restore and rerun. The actual API XML
service also generated both examples and valid source boundaries against the pinned original XSD,
with wrong level, missing/empty/overlong cells and invalid counts rejected by that schema.

The native list's existing change callback now reaches the preview data store. Its own child
input/change events have a scoped boundary, so a second DOM writer cannot undo a deletion.
The preview keeps callback-owned root lists when collecting edits to ordinary sibling fields;
this does not introduce a mapper, widget implementation, row-identity policy or submission service.
