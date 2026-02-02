import { RJSFSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";
import { isBasicallyAnObject } from "src/utils/generalUtils";

/*
  ex:
  {
    "path/to/field": [
      {
        if: {...},
        then: {...}
      },{
        ...
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

const isIfThenElement = (schemaNode: object) => {
  return (
    Object.hasOwn(schemaNode, "if") &&
    Object.hasOwn(schemaNode, "then") &&
    Object.keys(schemaNode).length === 2
  );
};

/*
  Since the mergeAllOf library cannot handle merging something like complex conditionals like:
    "allOf": [
      {
          "if": {"not": {"required": ["outright_funds"]}},
          "then": {"required": ["federal_match"]},
      },
      {
          "if": {"not": {"required": ["federal_match"]}},
          "then": {"required": ["outright_funds"]},
      },
    ]
  This function will remove any complex allOfs from the form schema, and preserve them in a separate
  conditional validation object to be used later (not used anywhere yet)

  logic:
    for each node
      if it's an allOf
        and all elements are they if / then conditionals
          remove it from properties
          determine full path to property
          add it to the conditional validation rules
        if not
          remove the allOf completely (we don't know what it is but it'll break things)
      if it's an object
        recurse
      if it's an array
        recurse over any object properties
      otherwise, pass through

  Note that even though our current system handles single conditional allOfs fine,
  we will remove and track them here as it's easier to do and sets us up better to
  use the conditional validation rules later
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
          if (value.every(isIfThenElement)) {
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
