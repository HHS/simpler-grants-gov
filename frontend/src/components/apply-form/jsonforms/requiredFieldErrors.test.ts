import fs from "fs";
import path from "path";
import type { RJSFSchema } from "@rjsf/utils";
import Ajv2020 from "ajv/dist/2020";
import { getWarningLinkText } from "src/app/[locale]/(base)/workspace/applications/[applicationId]/form/[appFormId]/_components/ApplyFormMessage";
import {
  buildWarningTree,
  processFormSchema,
} from "src/utils/applyForm/applyFormUtils";
import { NASA_PI_AND_AOR_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/nasa-pi-and-aor-field-definitions";
import { NSF_KEY_PERSON_EXPANDED_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/nsf-key-person-expanded-field-definitions";
import { PROJECT_ABSTRACT_SUMMARY_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/project-abstract-summary-field-definitions";
import { RR_KEY_PERSON_EXPANDED_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/rr-key-person-expanded-field-definitions";
import { RR_KEY_PERSON_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/rr-key-person-field-definitions";
import { SF424_GENERATED_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/sf424-generated-field-definitions";
import { SF424_INDIVIDUAL_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/sf424-individual-field-definitions";
import { SF424_MANDATORY_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/sf424-mandatory-field-definitions";
import { SF424_R_R_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/sf424-r-r-field-definitions";
import { SF424_SHORT_GENERATED_REQUIRED_FIELD_ERRORS } from "tests/e2e/apply/fixtures/sf424short-field-definitions";
import type { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

import { prepareJsonFormsUiSchema } from "./prepareUiSchema";

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

/*
  The failure-path e2e specs save a generated form empty and compare the page's alert list
  with a fixture. This runs the same save without a browser, so a fixture that no longer
  matches the form fails here first.
*/

const FORMS = path.resolve(
  __dirname,
  "../../../../../api/src/form_schema/forms",
);

type Json = Record<string, unknown>;

const readForm = (form: string, file: string): Json | undefined => {
  const filePath = path.join(FORMS, form, "1/0", file);
  return fs.existsSync(filePath)
    ? (JSON.parse(fs.readFileSync(filePath, "utf8")) as Json)
    : undefined;
};

/** Replace each `$ref` with what it points to, as the API does before it serves a form. */
const dereference = (node: unknown, root: Json): unknown => {
  if (Array.isArray(node)) return node.map((item) => dereference(item, root));
  if (!node || typeof node !== "object") return node;
  const { $ref } = node as { $ref?: unknown };
  if (typeof $ref === "string" && $ref.startsWith("#/")) {
    const target = $ref
      .slice(2)
      .split("/")
      .reduce<unknown>((at, key) => (at as Json)[key], root);
    return dereference(target, root);
  }
  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, dereference(value, root)]),
  );
};

/** The answers the API fills in before it validates a save. */
const prePopulated = (rules: Json): Json => {
  const answers: Json = {};
  for (const [key, rule] of Object.entries(rules)) {
    if (!rule || typeof rule !== "object" || key.startsWith("gg_")) continue;
    if ("gg_pre_population" in rule) {
      answers[key] = "pre-populated";
      continue;
    }
    const inner = prePopulated(rule as Json);
    if (Object.keys(inner).length) answers[key] = inner;
  }
  return answers;
};

/** The required-field warnings the API returns for an empty save, in its wording. */
const emptySaveWarnings = (jsonSchema: Json, rules: Json) => {
  const validate = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
  }).compile(jsonSchema);
  validate(prePopulated(rules));
  return (validate.errors ?? [])
    .filter((error) => error.keyword === "required")
    .map((error) => {
      const { missingProperty } = error.params as { missingProperty: string };
      return {
        field: `$${error.instancePath.replace(/\//g, ".")}.${missingProperty}`,
        message: `'${missingProperty}' is a required property`,
        type: "required",
        value: null,
      };
    });
};

/** The alert list the form page shows after an empty save, as message and field id. */
const emptySaveAlerts = (form: string) => {
  const raw = readForm(form, "json_schema.json") as Json;
  const jsonSchema = dereference(raw, raw) as RJSFSchema;
  const uiSchema = prepareJsonFormsUiSchema({
    formId: form,
    formName: form,
    uiSchema: readForm(form, "ui_schema.json") as never,
    jsonSchema,
  });
  const { formSchema } = processFormSchema(jsonSchema);
  const warnings = buildWarningTree(
    uiSchema,
    null,
    emptySaveWarnings(jsonSchema, readForm(form, "rule_schema.json") ?? {}),
    formSchema,
  );
  // The page lists a warning once per field and message.
  const unique = new Map(
    warnings.map((warning) => [
      `${warning.htmlField ?? warning.field ?? warning.definition}-${warning.message}`,
      warning,
    ]),
  );
  return Array.from(unique.values())
    .map((warning) => ({
      fieldId: warning.htmlField || warning.field,
      message: getWarningLinkText(warning),
    }))
    .sort((a, b) => a.fieldId.localeCompare(b.fieldId));
};

const sorted = (errors: FieldError[]) =>
  [...errors].sort((a, b) => a.fieldId.localeCompare(b.fieldId));

describe("an empty save of a generated form", () => {
  it.each([
    ["nasa_pi_and_aor_generated", NASA_PI_AND_AOR_REQUIRED_FIELD_ERRORS],
    [
      "nsf_key_person_expanded_generated",
      NSF_KEY_PERSON_EXPANDED_REQUIRED_FIELD_ERRORS,
    ],
    [
      "project_abstract_summary_generated",
      PROJECT_ABSTRACT_SUMMARY_REQUIRED_FIELD_ERRORS,
    ],
    [
      "rr_key_person_expanded_generated",
      RR_KEY_PERSON_EXPANDED_REQUIRED_FIELD_ERRORS,
    ],
    ["rr_key_person_generated", RR_KEY_PERSON_REQUIRED_FIELD_ERRORS],
    ["sf424_individual_generated", SF424_INDIVIDUAL_REQUIRED_FIELD_ERRORS],
    ["sf424_short_generated", SF424_SHORT_GENERATED_REQUIRED_FIELD_ERRORS],
    ["sf424_mandatory_generated", SF424_MANDATORY_REQUIRED_FIELD_ERRORS],
    ["sf424_generated", SF424_GENERATED_REQUIRED_FIELD_ERRORS],
    ["sf424_r_r_generated", SF424_R_R_REQUIRED_FIELD_ERRORS],
  ])(
    "shows the required field errors its e2e fixture expects (%s)",
    (form, fixture) => {
      expect(emptySaveAlerts(form)).toEqual(sorted(fixture));
    },
  );
});
