# AFRI project classification definition

The edition 2.0 definition captures five response fields: project type, grant type, FASE type, Strengthening type and Other description. The four classifications retain 23 source choice values; Other description remains free text. These are local AFRI concepts. Sharing choice mechanics would not establish a reusable semantic question.

The answer model contains `project_type` and a meaningful `grant` object. Layout guidance adds no answer wrappers. Existing SDK conditions express subtype availability/requiredness; inactive detail values remain in the preview response because the source does not require clearing. A retained Strengthening subtype still requires its further type even after the grant type changes.

Three long option-definition descriptions use the library's opt-in `SectionHelp` presentation. Native disclosure keeps source wording available while the section heading, entry controls and requiredness stay visible. Essential instructions and burden text remain outside those disclosures. In the 1280×720 comparison, the Equipment control moved from 1143px to 183px below its guidance heading. This is a layout observation, not a human usability rating.

## Review the authored cases

| Emitted sample | Purpose                                          |
| -------------- | ------------------------------------------------ |
| 1              | Standard grant with retained inactive details    |
| 2              | Other grant with its description                 |
| 3              | Integrated project, FASE/Strengthening/Equipment |
| 4              | Minimum Research/Standard answers                |

Select a sample case, load it, check, then inspect **Data**. Starting blank also supports an independent entry task. Switch from FASE to Standard, then edit project type: retained subtype values must stay in Data. Other description 61 characters must fail; correcting it must update warnings without another Check. Clearing it while Other is active requires a response.

The JSON Schema permits a present empty string under the raw source minLength 0, while native text collection treats a cleared field as absent. Keep that representation distinction visible; the preview's required-response message is not a new source minLength 1 facet.

Source comparison, compiled examples, task-first and independent proxy entry, fix/replay, keyboard navigation and 375px layout checks cover the exercised definition. XML mapping/generation, application registration/submission and human acceptance are separate.
