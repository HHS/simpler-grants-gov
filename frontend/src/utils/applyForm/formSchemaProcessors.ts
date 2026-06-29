import { RJSFSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";
import { isBasicallyAnObject } from "src/utils/generalUtils";

/*
  Extracted conditional validation rules are keyed by schema path.

  Example:
  {
    "additional_sites/items": [
      {
        if: {...},
        then: {...}
      },
      {
        if: {...},
        else: {...}
      }
    ]
  }
*/
type ConditionalValidationRules = {
  [propertyPath: string]: { [key: string]: unknown }[];
};

type ExtricateConditionalValidationRulesResult = {
  propertiesWithoutComplexConditionals: RJSFSchema;
  conditionalValidationRules: ConditionalValidationRules;
};

type ConditionalRuleArrayReduceResult = {
  updatedConditionalValidationRules: ConditionalValidationRules;
  updatedValue: unknown[];
};

// Supports valid JSON Schema conditional forms: if/then, if/else, and if/then/else.
const isConditionalElement = (schemaNode: object) => {
  const hasIf = Object.hasOwn(schemaNode, "if");
  const hasThen = Object.hasOwn(schemaNode, "then");
  const hasElse = Object.hasOwn(schemaNode, "else");

  if (!hasIf || (!hasThen && !hasElse)) {
    return false;
  }

  return Object.keys(schemaNode).every((key) =>
    ["if", "then", "else"].includes(key),
  );
};

/*
  mergeAllOf cannot safely merge schemas that contain conditional keywords
  such as if/then/else. To keep form rendering stable, this function removes
  conditional-only allOf entries from the renderable schema and preserves them
  separately as conditional validation rules.

  This lets the frontend:
    - flatten safe allOf usage for rendering
    - avoid crashing on conditional schemas
    - keep conditionals available for validation-related workflows

  Any allOf made entirely of conditional entries is extracted. Non-conditional
  allOf entries continue through the normal recursive path.
*/
export const extricateConditionalValidationRules = (
  properties: RJSFSchema,
  parentPath = "",
): ExtricateConditionalValidationRulesResult => {
  return Object.entries(properties).reduce(
    (
      { conditionalValidationRules, propertiesWithoutComplexConditionals },
      [key, value]: [string, { [key: string]: unknown }[]],
    ) => {
      if (key === "allOf") {
        if (Array.isArray(value) && value.length) {
          if (value.every(isConditionalElement)) {
            conditionalValidationRules[parentPath] = value;
            return {
              conditionalValidationRules,
              propertiesWithoutComplexConditionals,
            };
          }
        } else {
          // we got an empty allOf or a non-array allOf, which shouldn't happen
          console.error("malformed schema data: ", key, value);
          throw new Error("malformed data?");
        }
      }

      if (isBasicallyAnObject(value)) {
        const parentPathPrefix = parentPath ? `${parentPath}/` : "";
        const nestedUpdate = extricateConditionalValidationRules(
          value as JSONSchema7,
          `${parentPathPrefix}${key}`,
        );
        return {
          conditionalValidationRules: {
            ...conditionalValidationRules,
            ...nestedUpdate.conditionalValidationRules,
          },
          propertiesWithoutComplexConditionals: {
            ...propertiesWithoutComplexConditionals,
            ...{ [key]: nestedUpdate.propertiesWithoutComplexConditionals },
          },
        };
      }
      if (Array.isArray(value)) {
        /*
          for each element in the array
            if it's an object
              recurse and add result to the acc
            otherwise keep going

        */
        const nestedUpdates = value.reduce(
          (acc: ConditionalRuleArrayReduceResult, nestedEntry, index) => {
            const { updatedConditionalValidationRules, updatedValue } = acc;
            if (isBasicallyAnObject(nestedEntry)) {
              const fullParentPath = `${parentPath}/${key}[${index}]`;
              const {
                conditionalValidationRules,
                propertiesWithoutComplexConditionals,
              } = extricateConditionalValidationRules(
                nestedEntry as JSONSchema7,
                fullParentPath,
              );
              return {
                updatedValue: updatedValue.concat([
                  propertiesWithoutComplexConditionals,
                ]),
                updatedConditionalValidationRules: {
                  ...updatedConditionalValidationRules,
                  ...conditionalValidationRules,
                },
              };
            }

            return {
              updatedConditionalValidationRules,
              updatedValue: updatedValue.concat([nestedEntry]),
            };
          },
          {
            updatedConditionalValidationRules: {},
            updatedValue: [],
          } as ConditionalRuleArrayReduceResult,
        );
        return {
          conditionalValidationRules: {
            ...conditionalValidationRules,
            ...nestedUpdates.updatedConditionalValidationRules,
          },
          propertiesWithoutComplexConditionals: {
            ...propertiesWithoutComplexConditionals,
            ...{ [key]: nestedUpdates.updatedValue },
          },
        };
      }

      // otherwise it's a primitive, just keep moving
      return {
        conditionalValidationRules,
        propertiesWithoutComplexConditionals: {
          ...propertiesWithoutComplexConditionals,
          ...{ [key]: value },
        },
      };
    },
    {
      conditionalValidationRules: {},
      propertiesWithoutComplexConditionals: {},
    } as ExtricateConditionalValidationRulesResult,
  );
};
