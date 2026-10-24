# Certification and labor-assurance definitions

These definitions use existing form-library components and preserve three different source obligations:

| Form                             | FID / edition | Data and ownership                                                                                                                                                                        |
| -------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| USDA AD-1047                     | 545 / 1.0     | Organization, project, structured representative name, title, signature placeholder and date. Only the project is applicant-entered; the other values come from cover/submission context. |
| USDA AD-3030                     | 582 / 2.0     | Applicant name/address, four-digit tax-ID suffix, two independent Yes/No representations, plus title/signature/date context.                                                              |
| Assurances as to Labor Standards | 700 / 1.0     | Institution name and submission-owned signature/date, with the NEH labor declaration.                                                                                                     |

Models contain answers, layouts reference those answers, and XSD targets describe source output. Legal declarations, instructions and agency information are display content, including sections with no answers. They do not become payload properties or a universal certification checkbox.

## Reuse and deliberate non-reuse

AD-1047 uses existing organization-name, person-name and person-title questions. Its structured representative name remains distinct from the submission-owned signature placeholder. Labor Standards reuses organization name; AD-3030 reuses person title.

AD-3030's applicant name permits 140 characters and its address is a single string of up to 300 characters. They are not replaced with the 60-character organization-name question or a structured address. Its felony and federal-tax questions have different meanings; only their `Y: Yes` / `N: No` transport vocabulary is shared. Neither answer produces an automatic eligibility decision.

`TaxIDNumber` is the **last four digits**, stored as text, including leading zeros. The DAT explicitly requires digits; the XSD only specifies four characters. The answer schema rejects `ABC4`, numeric `1234`, shorter/longer text and a full tax identifier, while accepting `0012`. The stricter source rule is recorded without silently rewriting input.

## Completion context and source review

Examples contain clearly labeled synthetic cover/submission context. Read-only presentation does not authenticate identity, populate an application or perform signing. AD-1047 requires an explanation when the prospective participant cannot certify; its XSD has no explanation field. That application-package instruction remains visible without inventing a new upload answer.

Pinned USDA DATs/PDFs show OMB expiration September 30, 2025. Definitions retain that source metadata; current official metadata must be confirmed before production. Labor Standards states October 31, 2027.

The USDA DATs require clickable complaint-page and email links. Their exact destinations are retained as text in the civil-rights section; both the library and current SGG description renderer emit plain paragraphs. Clickable link presentation remains an explicit integration gap; these definitions do not claim link-behavior parity.

USDA JSON/XML dates and the current library preview use ISO dates. The DAT asks for an `MM-DD-YYYY` display; this is an explicit presentation difference for review. Actual application population, uploads, signing, deployment and submission remain separate integration work.

Source references:

- [AD-1047 DAT](https://apply07.grants.gov/apply/forms/sample/AD_1047-V1.0_F545.xls), [XSD](https://apply07.grants.gov/apply/forms/schemas/AD_1047-V1.0.xsd), [PDF](https://apply07.grants.gov/apply/forms/readonly/AD_1047-V1.0_F545.pdf).
- [AD-3030 DAT](https://apply07.grants.gov/apply/forms/sample/AD_3030_2_0-V2.0_F582.xls), [XSD](https://apply07.grants.gov/apply/forms/schemas/AD_3030_2_0-V2.0.xsd), [PDF](https://apply07.grants.gov/apply/forms/readonly/AD_3030_2_0-V2.0_F582.pdf).
- [Labor Standards DAT](https://apply07.grants.gov/apply/forms/sample/NEH_Labor_Standards-V1.0_F700.xls), [XSD](https://apply07.grants.gov/apply/forms/schemas/NEH_Labor_Standards-V1.0.xsd), [PDF](https://apply07.grants.gov/apply/forms/readonly/NEH_Labor_Standards-V1.0_F700.pdf).

## Validation and reviewer spot-check

Install dependencies in `forms/` and `forms/site/`. Stop if compilation fails; earlier generated files are not evidence for changed source. From `forms/`:

```sh
npm run clean
npm run compile
npm run test:parity -- parity/forms.test.ts -t 'usda-ad-|assurances-as-to-labor'
npm run check:parity
cd site
npx vitest run src/lib/certificationForms.test.ts
npm run check
```

For a reversible failure check, widen AD-3030's tax-ID pattern from `^[0-9]{4}$` to `^[A-Z0-9]{4}$`. Clean/recompile and rerun AD-3030 parity and schema tests. They must fail because the answer now permits letters contrary to the recorded DAT rule. Restore, clean/recompile and confirm passing selected tests. This does not become safe merely because the original XSD accepts four letters.

Inspect the preview after loading examples. Editing AD-1047's project or AD-3030's applicant answers must preserve source-owned context, including the structured representative name. Confirm readable declarations and actual control values in the Data panel. Browser checks, schema/XML checks and human acceptance are separate evidence.
