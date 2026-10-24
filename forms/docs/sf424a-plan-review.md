# SF-424A: proposed answers and existing SGG behavior

Review the [plan](../site/src/content/forms/budget-information-for-non-construction-programs-sf-424a.json)
and its three Data-tab examples before creating a TypeSpec definition. The samples use
proposed plan paths; they are not existing-SGG payloads or validated submissions.

## Recommendation for review

Treat the existing SGG JSON and presentation as the compatibility baseline, while keeping
source conflicts explicit. The current plan's separate section lists are not yet reconciled
with that baseline. **Sections C and E already support different program titles in SGG;
this does not require independent lists.** A shared row need not mean a shared answer for
every section.

There is also a concrete source conflict: DAT cells **B-00-3 through B-00-6** say the
Section B titles default from A but may be overwritten. SGG instead shares A/B's
`activity_title`. Matching the current structure blindly would lose that independent
source answer. Resolve this explicitly before definition work; neither a blanket
compatibility exception nor a new per-form mapping engine follows from this finding.

Existing SGG main was inspected at `1858f9a6f7052b101346eada88c9fba95b1ef208`:

- [Schema, UI, calculation and XML rules](https://github.com/HHS/simpler-grants-gov/blob/1858f9a6f7052b101346eada88c9fba95b1ef208/api/src/form_schema/forms/sf424a/1/0/form_json.py)
- [Minimal/full examples and validation/calculation tests](https://github.com/HHS/simpler-grants-gov/blob/1858f9a6f7052b101346eada88c9fba95b1ef208/api/tests/src/form_schema/forms/test_sf424a.py)
- [XML generation scenarios](https://github.com/HHS/simpler-grants-gov/blob/1858f9a6f7052b101346eada88c9fba95b1ef208/api/tests/src/services/xml_generation/test_sf424a_xml_generation.py)
- [Shared monetary type](https://github.com/HHS/simpler-grants-gov/blob/1858f9a6f7052b101346eada88c9fba95b1ef208/api/src/form_schema/shared/common_shared.py)

## Choices to settle before implementation

| Area               | Existing SGG                                                                                                            | Proposed plan / follow-up                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Activities         | One `activity_line_items[]` list containing A/B/C/E data; A/B share `activity_title`, C/E use their own `grant_program` | Separate lists by section. Explain the benefit or retain shared rows. Keep C/E distinct answers in either case.                                                                |
| Amounts            | Decimal strings using `budget_monetary_amount`, avoiding floating point rounding                                        | Examples follow that representation. Exact signed bounds, length/precision and arithmetic need explicit tests; `multipleOf 0.01` in a plan is not a compiled string validator. |
| Entry requirements | At least one activity; first title required; A/B entries conditionally require later titles                             | DAT's cross-field minimum-entry rule is recorded in the plan. Review the difference rather than inferring equivalent requiredness.                                             |
| Completion         | `confirmation: true` required by the application                                                                        | No matching DAT question. Keep application completion separate from source questions; account for it when implementing the SGG form.                                           |
| Calculations       | Server rules derive totals; applicant Section A totals can differ from the other columns                                | Preserve the overridden-total scenario. Do not replace it with a universal sum formula.                                                                                        |
| Presentation       | Dedicated `Budget424aSectionA` through `F` widgets                                                                      | Activity-first presentation is proposed. Prove it with the maintained renderer separately.                                                                                     |
| XML                | Array decomposition, forecast pivot and explanation composition, with omission/default/ordering tests                   | Carry those scenarios into implementation parity checks; source coverage alone does not prove equivalent output.                                                               |

## Answer-path crosswalk

All 73 proposed paths have a source-inspected counterpart in the existing schema: 72
unique SGG paths, because the proposal repeats A/B activity titles. This is a structural
crosswalk, not an executable adapter or evidence that the proposed payload works in SGG.
In particular, SGG's single A/B title cannot represent the DAT's independent B override.
No application or XML parity tests were executed for the new plan. Compatibility remains
unverified; the samples make the disagreement inspectable rather than resolving it.

<details>
<summary>All 73 proposed fields and their existing SGG counterparts</summary>

| Proposed answer path                         | Existing SGG answer path                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| `summary.activities[].activity_title`        | `activity_line_items[].activity_title`                                          |
| `summary.activities[].assistance_listing`    | `activity_line_items[].assistance_listing_number`                               |
| `summary.activities[].estimated_federal`     | `activity_line_items[].budget_summary.federal_estimated_unobligated_amount`     |
| `summary.activities[].estimated_non_federal` | `activity_line_items[].budget_summary.non_federal_estimated_unobligated_amount` |
| `summary.activities[].new_federal`           | `activity_line_items[].budget_summary.federal_new_or_revised_amount`            |
| `summary.activities[].new_non_federal`       | `activity_line_items[].budget_summary.non_federal_new_or_revised_amount`        |
| `summary.activities[].new_total`             | `activity_line_items[].budget_summary.total_amount`                             |
| `summary.totals.estimated_federal`           | `total_budget_summary.federal_estimated_unobligated_amount`                     |
| `summary.totals.estimated_non_federal`       | `total_budget_summary.non_federal_estimated_unobligated_amount`                 |
| `summary.totals.new_federal`                 | `total_budget_summary.federal_new_or_revised_amount`                            |
| `summary.totals.new_non_federal`             | `total_budget_summary.non_federal_new_or_revised_amount`                        |
| `summary.totals.new_total`                   | `total_budget_summary.total_amount`                                             |
| `categories.activities[].activity_title`     | `activity_line_items[].activity_title`                                          |
| `categories.activities[].personnel`          | `activity_line_items[].budget_categories.personnel_amount`                      |
| `categories.activities[].fringe_benefits`    | `activity_line_items[].budget_categories.fringe_benefits_amount`                |
| `categories.activities[].travel`             | `activity_line_items[].budget_categories.travel_amount`                         |
| `categories.activities[].equipment`          | `activity_line_items[].budget_categories.equipment_amount`                      |
| `categories.activities[].supplies`           | `activity_line_items[].budget_categories.supplies_amount`                       |
| `categories.activities[].contractual`        | `activity_line_items[].budget_categories.contractual_amount`                    |
| `categories.activities[].construction`       | `activity_line_items[].budget_categories.construction_amount`                   |
| `categories.activities[].other`              | `activity_line_items[].budget_categories.other_amount`                          |
| `categories.activities[].direct_total`       | `activity_line_items[].budget_categories.total_direct_charge_amount`            |
| `categories.activities[].indirect`           | `activity_line_items[].budget_categories.total_indirect_charge_amount`          |
| `categories.activities[].total`              | `activity_line_items[].budget_categories.total_amount`                          |
| `categories.activities[].program_income`     | `activity_line_items[].budget_categories.program_income_amount`                 |
| `categories.totals.personnel`                | `total_budget_categories.personnel_amount`                                      |
| `categories.totals.fringe_benefits`          | `total_budget_categories.fringe_benefits_amount`                                |
| `categories.totals.travel`                   | `total_budget_categories.travel_amount`                                         |
| `categories.totals.equipment`                | `total_budget_categories.equipment_amount`                                      |
| `categories.totals.supplies`                 | `total_budget_categories.supplies_amount`                                       |
| `categories.totals.contractual`              | `total_budget_categories.contractual_amount`                                    |
| `categories.totals.construction`             | `total_budget_categories.construction_amount`                                   |
| `categories.totals.other`                    | `total_budget_categories.other_amount`                                          |
| `categories.totals.direct_total`             | `total_budget_categories.total_direct_charge_amount`                            |
| `categories.totals.indirect`                 | `total_budget_categories.total_indirect_charge_amount`                          |
| `categories.totals.total`                    | `total_budget_categories.total_amount`                                          |
| `categories.totals.program_income`           | `total_budget_categories.program_income_amount`                                 |
| `resources.activities[].activity_title`      | `activity_line_items[].non_federal_resources.grant_program`                     |
| `resources.activities[].applicant`           | `activity_line_items[].non_federal_resources.applicant_amount`                  |
| `resources.activities[].state`               | `activity_line_items[].non_federal_resources.state_amount`                      |
| `resources.activities[].other_sources`       | `activity_line_items[].non_federal_resources.other_amount`                      |
| `resources.activities[].total`               | `activity_line_items[].non_federal_resources.total_amount`                      |
| `resources.totals.applicant`                 | `total_non_federal_resources.applicant_amount`                                  |
| `resources.totals.state`                     | `total_non_federal_resources.state_amount`                                      |
| `resources.totals.other_sources`             | `total_non_federal_resources.other_amount`                                      |
| `resources.totals.total`                     | `total_non_federal_resources.total_amount`                                      |
| `cash_needs.first_year.federal`              | `forecasted_cash_needs.federal_forecasted_cash_needs.total_amount`              |
| `cash_needs.first_year.non_federal`          | `forecasted_cash_needs.non_federal_forecasted_cash_needs.total_amount`          |
| `cash_needs.first_year.total`                | `forecasted_cash_needs.total_forecasted_cash_needs.total_amount`                |
| `cash_needs.quarter1.federal`                | `forecasted_cash_needs.federal_forecasted_cash_needs.first_quarter_amount`      |
| `cash_needs.quarter1.non_federal`            | `forecasted_cash_needs.non_federal_forecasted_cash_needs.first_quarter_amount`  |
| `cash_needs.quarter1.total`                  | `forecasted_cash_needs.total_forecasted_cash_needs.first_quarter_amount`        |
| `cash_needs.quarter2.federal`                | `forecasted_cash_needs.federal_forecasted_cash_needs.second_quarter_amount`     |
| `cash_needs.quarter2.non_federal`            | `forecasted_cash_needs.non_federal_forecasted_cash_needs.second_quarter_amount` |
| `cash_needs.quarter2.total`                  | `forecasted_cash_needs.total_forecasted_cash_needs.second_quarter_amount`       |
| `cash_needs.quarter3.federal`                | `forecasted_cash_needs.federal_forecasted_cash_needs.third_quarter_amount`      |
| `cash_needs.quarter3.non_federal`            | `forecasted_cash_needs.non_federal_forecasted_cash_needs.third_quarter_amount`  |
| `cash_needs.quarter3.total`                  | `forecasted_cash_needs.total_forecasted_cash_needs.third_quarter_amount`        |
| `cash_needs.quarter4.federal`                | `forecasted_cash_needs.federal_forecasted_cash_needs.fourth_quarter_amount`     |
| `cash_needs.quarter4.non_federal`            | `forecasted_cash_needs.non_federal_forecasted_cash_needs.fourth_quarter_amount` |
| `cash_needs.quarter4.total`                  | `forecasted_cash_needs.total_forecasted_cash_needs.fourth_quarter_amount`       |
| `future_funds.activities[].activity_title`   | `activity_line_items[].federal_fund_estimates.grant_program`                    |
| `future_funds.activities[].year1`            | `activity_line_items[].federal_fund_estimates.first_year_amount`                |
| `future_funds.activities[].year2`            | `activity_line_items[].federal_fund_estimates.second_year_amount`               |
| `future_funds.activities[].year3`            | `activity_line_items[].federal_fund_estimates.third_year_amount`                |
| `future_funds.activities[].year4`            | `activity_line_items[].federal_fund_estimates.fourth_year_amount`               |
| `future_funds.totals.year1`                  | `total_federal_fund_estimates.first_year_amount`                                |
| `future_funds.totals.year2`                  | `total_federal_fund_estimates.second_year_amount`                               |
| `future_funds.totals.year3`                  | `total_federal_fund_estimates.third_year_amount`                                |
| `future_funds.totals.year4`                  | `total_federal_fund_estimates.fourth_year_amount`                               |
| `other_information.direct_charges`           | `direct_charges_explanation`                                                    |
| `other_information.indirect_charges`         | `indirect_charges_explanation`                                                  |
| `other_information.remarks`                  | `remarks`                                                                       |

</details>

Three other paths are admitted by the existing schema:

- `confirmation`: application completion, absent from the source-question plan.
- `total_non_federal_resources.grant_program` and `total_federal_fund_estimates.grant_program`:
  optional members inherited from the reused row definitions. They are not represented as
  source total-row questions. Do not invent new applicant fields solely to match schema shape;
  verify their actual UI/XML treatment when implementing compatibility.

## Samples and evidence

The plan's examples are explicitly authored, using synthetic values. The populated case
covers all 73 proposed paths, including two entries per activity list, and uses decimal
strings. A smaller case makes the proposed nesting easy to inspect. A third preserves
different B/C/E titles and an applicant-supplied Section A total of `"999999.00"` while the
new federal/non-federal amounts are `"0.00"`—the same behavior exercised by SGG's
supplemental-grant test.

The example-path check rejects undeclared answer locations. It does not establish
requiredness, value constraints, formula correctness, defaults or XML validity. Existing
API fixtures are the starting evidence for later validation; frontend e2e fixtures use
DOM input names and must not be presented directly as answer JSON.
