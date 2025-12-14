import { RJSFSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";
import { isBasicallyAnObject } from "src/utils/generalUtils";

const isIfThenElement = (schemaNode: object) => {
  return (
    Object.hasOwn(schemaNode, "if") &&
    Object.hasOwn(schemaNode, "then") &&
    Object.keys(schemaNode).length === 2
  );
};

type ConditionalValidationRules = {
  [propertyPath: string]: { [key: "if" | "then"]: unknown };
};

type ExtricateConditionalValidationRulesResult = {
  propertiesWithoutComplexConditionals: RJSFSchema;
  conditionalValidationRules: ConditionalValidationRules;
};

type ConditionalRuleArrayReduceResult = {
  updatedConditionalValidationRules: ConditionalValidationRules;
  updatedValue: unknown[];
};

/* for each node
  if it's an allOf
    and it contains multiple elements
      and all elements are they if / then conditionals
        remove it from properties
        determine full path to property
        add it to the conditional validation rules
    if not
      remove the allOf completely (we don't know what it is but it'll break things)
  if it's
*/
export const extricateConditionalValidationRules = (
  properties: JSONSchema7,
  parentPath = "",
): ExtricateConditionalValidationRulesResult => {
  return Object.entries(properties).reduce(
    (
      { conditionalValidationRules, propertiesWithoutComplexConditionals },
      [key, value]: [string, unknown],
    ) => {
      if (key === "allOf") {
        if (Array.isArray(value) && value.length === 1) {
          return {
            conditionalValidationRules,
            propertiesWithoutComplexConditionals: {
              ...propertiesWithoutComplexConditionals,
              ...{ [key]: value },
            },
          };
        }
        if (Array.isArray(value) && value.length > 1) {
          if (value.every(isIfThenElement)) {
            conditionalValidationRules[parentPath] = value;
            return {
              conditionalValidationRules,
              propertiesWithoutComplexConditionals,
            };
          } else {
            console.log(
              "not sure what this node is!! but removing it anyway",
              key,
              value,
            );
            return {
              conditionalValidationRules,
              propertiesWithoutComplexConditionals,
            };
          }
        } else {
          console.log("malformed data?", key, value);
          throw new Error("malformed data?");
        }
      }

      if (isBasicallyAnObject(value)) {
        const nestedUpdate = extricateConditionalValidationRules(
          value as JSONSchema7,
          `${parentPath}/${key}`,
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
          (acc: ConditionalRuleArrayReduceResult, nestedEntry) => {
            const { updatedConditionalValidationRules, updatedValue } = acc;
            if (isBasicallyAnObject(nestedEntry)) {
              const {
                conditionalValidationRules,
                propertiesWithoutComplexConditionals,
              } = extricateConditionalValidationRules(
                nestedEntry as JSONSchema7,
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
