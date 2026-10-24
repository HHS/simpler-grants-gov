# Individual non-construction assurances

FID521 / version1.1 retains the complete source declaration and four completion values.
Applicant name and title are editable; signature placeholder and date are supplied submission
context. Examples are synthetic completed contexts, not signed or submitted applications.
The local ApplicantName1–60 scalar preserves the legacy ApplicantOrganizationName JSON/XML
binding without falsely identifying an individual as the organization/name bank question.
Person title reuses the existing question. No new assent checkbox or answer wrapper is introduced.

DAT completion fields are required although the wire XSD permits their absence. Printed and
detailed DAT burden statements differ; both are preserved explicitly. The plan selects the
Assurances root of a multi-root XSD, and the source-model test passes that root to the existing reader.

The preview keeps schema-declared readonly context when native FormData omits disabled inputs.
It does not merge back erased applicant answers or supply signing/prefill/authorization services.
Load a sample, edit title, and inspect Data: signature/date remain. Clear removes everything;
an erased title produces the existing required error. All authored examples pass schema checks
and actual API-generated XML validates against the original XSD with exact bindings.

Fresh parity compilation prevents stale-output success. Every compiled form's authored examples
are checked against the actual preview loader, widgets, schema and declared answer paths. This
caught an existing EPA sample's unsupported province; its US illustrative sample is substituted,
without changing EPA schema or claiming international-address support.

For a reversible check, widen signature maxLength144 to145, clean/compile and run selected
parity/consumer checks; expect failure, then restore and rerun. Library-ready means ready for
review of definitions and bounded evidence. API integration, signing, deployment, human approval
and migration remain separate.
