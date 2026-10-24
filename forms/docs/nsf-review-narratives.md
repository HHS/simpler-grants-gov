# NSF optional review narratives

These two version 1.1 forms use existing whole-text controls and direct XML mappings:

| Form                        | FID | Answers                                                                 |
| --------------------------- | --- | ----------------------------------------------------------------------- |
| NSF Deviation Authorization | 306 | Optional deviation-authorization information                            |
| NSF Suggested Reviewers     | 308 | Optional suggested reviewers and reviewers not to include, with reasons |

Their data models preserve the requested prose. They do not replace it with structured person lists, uploads or an automated conflict-of-interest determination. Layout headings reference the data fields; they do not add answer containers.

Sources: [Deviation DAT](https://apply07.grants.gov/apply/forms/sample/NSF_DeviationAuthorization-V1.1_F306.xls), [Deviation XSD](https://apply07.grants.gov/apply/forms/schemas/NSF_DeviationAuthorization-V1.1.xsd), [Suggested Reviewers DAT](https://apply07.grants.gov/apply/forms/sample/NSF_SuggestedReviewers-V1.1_F308.xls), [Suggested Reviewers XSD](https://apply07.grants.gov/apply/forms/schemas/NSF_SuggestedReviewers-V1.1.xsd). Source metadata states OMB 3145-0058, expiration November 30, 2026.

## Optional does not mean a supplied empty string

The DATs state a zero-character minimum for optional answers. The actual XSD restrictions require 1–4000 characters when an answer is present. Deviation's misleading type name, `StringMin0Max4000`, does not override its `minLength` facet of 1.

Omission is valid. A supplied empty string, null, array or text longer than 4000 characters is invalid. The plan documents that source tension; no optional answer is made required. The Suggested Reviewers root is nillable in its XSD, while an empty object already produces a valid empty versioned XML document. A nil XML root is not an additional applicant question.

The control labels identify the answers instead of repeating the DAT's generic “Enter text in the box below.” Source instructions, help and the conflict-of-interest reference remain visible. Exact label differences are recorded in the per-form parity registers. PHS reviewer exclusions and NSF reviewer exclusions have different source guidance and limits; identical control types alone do not establish question identity.

Both forms have a populated compiled example and an empty example. Generated registration identities keep the short name and version separate; neither definition opts into application registration. Library checks do not establish human approval, deployment or submission.

## Validation and reviewer check

After installing dependencies in both `forms/` and `forms/site/`, run from `forms/`:

```sh
npm run compile
npm run test:parity -- parity/forms.test.ts -t 'nsf-(deviation|suggested)'
npm run check:parity
cd site
npx vitest run src/lib/nsfNarratives.test.ts
npm run check
```

In the Deviation definition, temporarily change `@minLength(1)` to `@minLength(0)`. Recompile and rerun the focused parity command. It must fail because the generated answer now permits a supplied empty string that the plan and original XSD reject. Restore 1, recompile and confirm the selected checks pass. The populated and empty examples should also be inspected in the actual preview and live JSON.
