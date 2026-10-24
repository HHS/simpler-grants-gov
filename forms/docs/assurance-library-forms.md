# Edition-specific assurance definitions

The SF424B Individual, Mandatory and R&R editions and SF424D Mandatory each retain their
own declaration text, source metadata and four completion values. These are completed-context
definitions with synthetic examples, not a signing or application population service.

| Edition                | Applicant-entered here         | Supplied context                                               |
| ---------------------- | ------------------------------ | -------------------------------------------------------------- |
| SF424B Individual      | Applicant name, official title | Signature placeholder, date                                    |
| SF424B Mandatory / R&R | None                           | Organization name, official title, signature placeholder, date |
| SF424D Mandatory       | None                           | Organization name, official title, signature placeholder, date |

The Individual applicant name uses a local1–60-character scalar. The legacy JSON/XML name
ApplicantOrganizationName does not establish the organization/name question's semantic identity.
The other editions reuse organization name, and all reuse person title where its purpose fits.

The DAT requires completed values although the XSD permits their absence. That discrepancy is
recorded. Read-only presentation does not enforce ownership in the API. The printed form's
15-minute burden statement and the detailed DAT statement differ; both are retained explicitly.
Original declaration clauses are display content, not a new assent checkbox or payload wrapper.

The XSDs contain multiple global roots. Plans explicitly select Assurances, and the source-model
comparison passes that encoded root to the existing source reader. R&R additionally requires
FormVersionIdentifier. Its typed root-target string default emits the API's existing static_value
rule; it is metadata, with no applicant input or fake question. Source XSD allows any nonempty
version string, so the separate registration-identity check guards the proposed1.1 value.

## Review

Run normal fresh parity and site/type checks. Load synthetic samples and inspect live JSON.
Individual name/title are editable; signature/date are disabled and retained after an edit.
Clear removes the context; it does not re-create signed values. Empty/overlong required values
and invalid dates are rejected by generated schema checks. Actual API-generated XML for every
example validates against each original XSD, with exact names, values, namespaces and order.

For a reversible constraint check, widen signature maxLength144 to145, clean/compile and run
selected assurance parity/consumer checks. Expect failure, then restore and rerun. For R&R,
change version1.1 to2.2: identity checks must fail even though the broad original XSD accepts it.
The XML emitter also tests both mapping directions, mapped-default precedence and unsupported
or colliding static initializers. Only root string defaults are supported; this is not a general
nested metadata materializer or a change to the API's XML-generation implementation.

Library-ready means definitions and bounded local evidence are ready for review. Human approval,
API integration, signing, submission and deployment remain separate.
