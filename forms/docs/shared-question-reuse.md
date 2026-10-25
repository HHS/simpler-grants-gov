# Shared questions in the current definitions

Two narrow purposes now have real consumers. They introduce no answer containers or signing behavior.

| Question | Consumers | Boundary |
| --- | --- | --- |
| `submission/signature` | Four SF-424 assurance editions; USDA AD-1047, AD-3030, AD-1049 and AD-1052; Labor Standards | A signature value provided by Grants.gov upon submission, with the source's 1–144-character bound. It is not applicant-entered signing, consent or a general attestation. |
| `award/project-reference` | USDA AD-1047, AD-1049 and AD-1052 | One 1–60-character answer accepting the PR/Award Number **or** Project Name. It is not an official project title or two separate answer fields. |

Source-specific labels and help remain at the occurrence when they differ. Shared defaults remove identical annotations. Requiredness, readonly ownership, roles, source conditions and XML placement remain unchanged at their original occurrences or enclosing records. A bank identity does not populate values across forms.

The current open definition PRs are separate stacks. The bank declarations use identical canonical paths and bytes in each stack that needs them; there is one definition of each question when those stacks are combined. The USDA address composition remains a family composition of existing parts, with no additional question identity.

## Why these boundaries

The Grants.gov Lobbying form and SF-424 R&R cover sheet also describe hard-copy signing. Their broader signing contracts are not replaced with `submission/signature`. The cover-sheet project title, and CD-511's separately represented project-name/award-number alternatives, are not replaced with `award/project-reference`.

Whole certification statements, representative records, dates, opposed reviewers and general profile templates were examined but remain local or use their existing parts. Equal string shapes do not establish equal questions, and source policy is not moved into a universal wrapper.

## Review evidence

A combined compilation of the 28 current maintained definitions preserves every expanded validation contract, UI artifact, example and emitted XML byte across this extraction. Twelve field-index lineage additions are intentional: nine signature occurrences and three project-reference occurrences. Ninety-six before/after source-boundary cases cover absence, empty/minimum/maximum/over-limit text and wrong types. Existing source comparisons and per-PR checks remain the maintained validation path.

The combined check also exposed two naming collisions between separately compiled stacks. AD-1049's root model now has a distinct TypeSpec identifier, and AD-3030 reuses the existing exact coded Yes/No vocabulary. JSON paths, source meanings and wire values remain unchanged; no compiler strategy or runtime exception was added.

Definition and library-preview evidence remain separate from production integration, actual signing/submission and human acceptance.
