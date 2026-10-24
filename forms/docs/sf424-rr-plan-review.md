# SF-424 R&R: answer examples before implementation

Review the [requirements plan](../site/src/content/forms/sf424-r-r.json), its source
comparisons and Data tab before defining TypeSpec. This dependent change reuses the
SF-424A plan's sample viewer; it adds no compiled R&R definition or applicant renderer.

## Read the four examples

1. **A small draft** shows proposed nesting and is deliberately incomplete.
2. **Populated US new application** separates the applicant organization, application
   contact, PD/PI and AOR. The three people have distinct answers and addresses. Small
   business eligibility answers occur only in this scenario. Funding uses illustrative
   decimal strings; the final encoding remains a definition decision.
3. **Corrected revision with non-US addresses** uses the exact XSD correction code,
   previous tracking/award IDs, revision E and its explanation, applicant-type Other
   and another-agency explanation. Province/postal answers replace inactive US states;
   the source's outside-US district is `00-000`. PD/PI and AOR defaults are overwritten
   independently. Inactive small-business answers and state-review date are omitted.
4. **Submission-owned signature fields only** isolates signature/date from applicant
   input. These values do not authenticate a signature or demonstrate submission.

Together the examples illustrate 103 of 106 answer locations. The three attachment
locations are deliberately absent: lobbying/explanatory documentation, pre-application
and cover letter are different questions, but their JSON transport is not defined by
this plan. Inventing UUIDs or descriptors would imply an unimplemented service contract.

These are synthetic planning examples, not production fixtures or validated submissions.
The maintained example check verifies declared paths, not value constraints, conditions,
calculations, signing or XML. Omitted inactive answers do not implement clearing rules.

## Existing SGG inventory

The API registration list and recursive form-definition, form-test and XML-test paths
were inspected at `1858f9a6f7052b101346eada88c9fba95b1ef208`.
The [registration list](https://github.com/HHS/simpler-grants-gov/blob/1858f9a6f7052b101346eada88c9fba95b1ef208/api/src/form_schema/forms/__init__.py)
includes SF-424, SF-424 Short and SF-424 A–D, but no SF-424 R&R cover form. No R&R
implementation was found in those scoped paths. This does not establish absence from
every branch or deployed system. An ordinary SF-424 fixture is not an R&R baseline.
If an implementation is identified, compare its answer paths, rules, UI and XML before
adopting this proposal. No unrelated fixture is presented as an existing R&R reference.

## Decisions retained for review

- Keep the root `EmployerID` answer from DAT 06-0; explicitly omit the unused optional
  imported `OrganizationInfo/EIN` leaf rather than collecting a second EIN.
- Keep revision checkboxes as one source enum answer. XSD admits A, B, C, D, E, AC,
  AD, BC and BD; later UI/encoding must enforce combinations and the E explanation.
- Preserve role-specific email/title requiredness, overwritable population and inactive
  containers. Reusing a contact body must not merge different people's answers.
- Preserve affirmative certification and submission-owned signature/date. Attachments,
  signing, conditional execution and XML conversion need implementation evidence.

The shared harness extension accounts for scalar choice controls and retains bound
post-populated values. It checks source correspondence without duplicating questions
or treating radio buttons as separate answers; it does not implement the form.
