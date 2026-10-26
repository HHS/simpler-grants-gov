import type { RJSFSchema } from "@rjsf/utils";
import type { ErrorObject } from "ajv";

import {
  toValidationWarnings,
  type ValidationWarning,
} from "../../../lib/validation";

/** Present simple root-level required alternatives without changing raw API warnings. */
export function requiredChoiceWarnings(
  errors: ErrorObject[],
  schema: RJSFSchema,
): ValidationWarning[] {
  const suppressed = new Set<ErrorObject>();
  const choices: ValidationWarning[] = [];
  for (const error of errors) {
    if (error.keyword !== "anyOf" || error.instancePath !== "") continue;
    const branches: unknown = error.schema;
    if (!Array.isArray(branches) || branches.length < 2) continue;
    const names = branches.map((branch: unknown) => {
      if (!branch || typeof branch !== "object") return undefined;
      const keys = Object.keys(branch);
      const required = (branch as { required?: unknown }).required;
      return keys.length === 1 &&
        keys[0] === "required" &&
        Array.isArray(required) &&
        required.length === 1 &&
        typeof required[0] === "string" &&
        /^\w+$/.test(required[0])
        ? (required[0] as string)
        : undefined;
    });
    if (
      names.some((name) => name === undefined) ||
      new Set(names).size !== names.length
    )
      continue;
    const members = names as string[];
    const fields = members.map((name) => schema.properties?.[name]);
    if (
      fields.some(
        (field) =>
          !field ||
          typeof field !== "object" ||
          typeof field.type !== "string" ||
          !["string", "number", "integer", "boolean"].includes(field.type),
      )
    )
      continue;
    const branchErrors = members.map((name, index) =>
      errors.find(
        (branch) =>
          branch.keyword === "required" &&
          branch.instancePath === "" &&
          branch.schemaPath === `${error.schemaPath}/${index}/required` &&
          branch.params.missingProperty === name,
      ),
    );
    if (branchErrors.some((branch) => !branch)) continue;
    suppressed.add(error);
    for (const branch of branchErrors) suppressed.add(branch!);
    const labels = members.map(
      (name, index) => (fields[index] as RJSFSchema).title || name,
    );
    choices.push({
      field: `$.${members[0]}`,
      message: `Provide at least one: ${labels.join(" or ")}.`,
      type: "anyOf",
      value: null,
    });
  }
  return [
    ...toValidationWarnings(errors.filter((error) => !suppressed.has(error))),
    ...choices,
  ];
}
