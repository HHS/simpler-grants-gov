# PHS Assignment Request

The PHS Assignment Request Form (FID 833, version 4.0) collects optional suggestions for assignment and review. Its maintained definition uses existing Text/TextArea controls and the existing XML emitter. No new question-bank identity, renderer, uploader or application service is introduced.

Sources: [form identity](https://www.grants.gov/forms/form-items-description/fid/833), [DAT](https://apply07.grants.gov/apply/forms/sample/PHS_AssignmentRequestForm_4_0-V4.0_F833.xls), [PDF](https://apply07.grants.gov/apply/forms/readonly/PHS_AssignmentRequestForm_4_0-V4.0_F833.pdf), [XSD](https://apply07.grants.gov/apply/forms/schemas/PHS_AssignmentRequestForm_4_0-V4.0.xsd). The source lock pins the DAT, XSD and imported schemas. OMB 0925-0001 expires December 31, 2027 in the source DAT/PDF.

## Data and presentation

The thirteen source slots remain independently optional. Group headings belong to the layout, rather than adding answer containers or converting numbered source slots into arrays. This preserves a suggestion in slot 3 when slot 2 is absent:

```json
{
  "suggested_awarding_component1": "NCI",
  "suggested_awarding_component3": "NHLBI",
  "expertise5": "Biostatistics"
}
```

The generated mapping writes `SuggestedAwardingComponent1`, `SuggestedAwardingComponent3` and `Expertise5` without renumbering them. The original XSD and the production XML service verify namespace, element order, values and the qualified FormVersion attribute. XML target models describe structure; the original XSD remains the constraint oracle.

Three form-local scalars describe awarding-component suggestions, study-section suggestions and scientific expertise. Their repeated uses are local purpose/type reuse, not claims of new cross-form question-bank reuse. Reviewer-exclusion prose remains distinct from the NSF question because the guidance and limits differ.

## Source instructions and deliberate differences

- The source DAT leaves eleven input labels blank and uses instructions as two other labels. Explicit control labels identify each slot; the source instructions remain visible in section help. Exact differences are pinned in `parity/diffs/phs-assignment-request-form.ts`.
- The DAT/PDF instruct applicants to remove spaces, hyphens and parentheses from study-section codes. The model rejects exactly those characters without rewriting answers. It preserves optionality, empty strings and the source 0–20 length bound. No external code-list or funding-opportunity eligibility check is claimed.
- The DAT gives `BP10` as an example, while the PDF gives `B10`. Both are accepted lexically; examples use `AIRT` as the unambiguous primary code. The source inconsistency is documented rather than silently corrected.
- Expertise asks for scientific areas, not names of individuals. Awarding-component eligibility, source links, request limitations and the burden statement remain in the plan/layout.

The preview's first example fills all thirteen fields; other compiled examples cover a sparse gap and no suggestions. Library preparation does not register or deploy this form in the SGG application, and agent review does not establish human approval.

## Validation

From `forms/`, after installing dependencies in both `forms/` and `forms/site/`:

```sh
npm run compile
npm run parity:fetch
npx vitest run parity/forms.test.ts -t phs-assignment
npm run check:parity
cd site
npx vitest run src/lib/phsAssignmentRequest.test.ts
npm run check
```

Inspect Form Preview, load the populated example, edit a value and compare the live JSON. The source-linked plan and difference views explain the labeled controls and lexical rule.

### Reversible reviewer check

In `specs/forms/phs-assignment-request-form/form.tsp`, change the awarding-component scalar's `@maxLength(7)` to `@maxLength(8)`. Recompile, then run the focused `phs-assignment` parity command above. It must fail because the generated schema now accepts values longer than the plan/original XSD. Restore 7, recompile and rerun; the focused checks must pass. Confirm actual selected/pass/fail counts rather than treating an all-skipped run as evidence.
