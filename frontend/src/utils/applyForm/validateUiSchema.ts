import { RJSFSchema } from "@rjsf/utils";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

/**
 * Behavior a node may declare that this renderer does not implement.
 *
 * `conditional` is the first: the form specifications describe when a field is enabled,
 * disabled or read-only, and the emitter writes those rules into every node they govern. This
 * renderer reads none of them, so the fields they govern render unconditionally.
 *
 * They are still allowed through, because the alternative is worse. `additionalProperties:
 * false` on the node types made an unread key a hard failure: `getFormData` returns
 * `TopLevelError` and the applicant gets an error page instead of a form, so shipping a rule
 * ahead of the renderer would take the form down rather than degrade it.
 *
 * Rules are objects and the scalar keys of a node are all known, so allowing unknown *object*
 * properties admits any future rule while still catching a mistyped `label` or `widget`. What
 * is being ignored at any moment is therefore discoverable from the artifact rather than from
 * this list; `unimplementedRuleKeys` below reports it.
 */
const RULE_EXTENSION = { type: "object" } as const;

// JSON Schema for the UiSchema, accepts a "field", "fieldList", "multiField", or "section"
export const UiJsonSchema: RJSFSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  items: {
    anyOf: [
      {
        $ref: "#/$defs/field",
      },
      {
        $ref: "#/$defs/multiField",
      },
      {
        $ref: "#/$defs/fieldList",
      },
      {
        $ref: "#/$defs/section",
      },
      {
        $ref: "#/$defs/text",
      },
    ],
  },
  $defs: {
    text: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["text"],
        },
        name: { type: "string" },
        content: { type: "string" },
      },
      required: ["type", "name", "content"],
      additionalProperties: false,
    },
    field: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["field", "null"],
        },
        name: { type: "string" },
        schema: {
          $ref: "#/$defs/schema",
        },
        definition: {
          oneOf: [
            {
              type: "string",
              pattern: "^/(properties|\\$defs)(/[a-zA-Z0-9_]+)+$",
            },
            {
              type: "array",
              items: {
                type: "string",
                pattern: "^/(properties|\\$defs)(/[a-zA-Z0-9_]+)+$",
              },
            },
          ],
        },
        widget: {
          type: "string",
          enum: [
            "Attachment",
            "AttachmentArray",
            "Checkbox",
            "Text",
            "TextArea",
            "Radio",
            "Select",
            "MultiSelect",
            "Budget424a",
            "Budget424aSectionA",
            "Budget424aSectionB",
            "Budget424aSectionC",
            "Budget424aSectionD",
            "Budget424aSectionE",
            "Budget424aSectionF",
            "Budget424aTotalBudgetSummary",
          ],
        },
        attachmentType: { type: "string" },
        printDescription: { type: "boolean" },
      },
      required: ["type"],
      anyOf: [
        {
          required: ["schema"],
        },
        {
          required: ["definition"],
        },
      ],
      additionalProperties: RULE_EXTENSION,
    },
    multiField: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["multiField"],
        },
        name: { type: "string" },
        schema: {
          $ref: "#/$defs/schema",
        },
        definition: {
          oneOf: [
            {
              type: "string",
              pattern: "^/(properties|\\$defs)(/[a-zA-Z0-9_]+)+$",
            },
            {
              type: "array",
              items: {
                type: "string",
                pattern: "^/(properties|\\$defs)(/[a-zA-Z0-9_]+)+$",
              },
            },
          ],
        },
        widget: {
          type: "string",
          enum: [
            "Budget424a",
            "Budget424aSectionA",
            "Budget424aSectionB",
            "Budget424aSectionC",
            "Budget424aSectionD",
            "Budget424aSectionE",
            "Budget424aSectionF",
            "Budget424aTotalBudgetSummary",
            "Table",
          ],
        },
        children: {
          $ref: "#/$defs/tableChildren",
        },
      },
      required: ["type"],
      allOf: [
        {
          if: {
            properties: {
              widget: {
                const: "Table",
              },
            },
            required: ["widget"],
          },
          then: {
            required: ["name", "definition", "children"],
            properties: {
              definition: {
                type: "array",
                minItems: 1,
                items: {
                  type: "string",
                  pattern: "^/(properties|\\$defs)(/[a-zA-Z0-9_]+)+$",
                },
              },
            },
            not: {
              required: ["schema"],
            },
          },
          else: {
            anyOf: [
              {
                required: ["schema"],
              },
              {
                required: ["definition"],
              },
            ],
          },
        },
      ],
      additionalProperties: RULE_EXTENSION,
    },
    schema: {
      type: "object",
      properties: {
        schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
            },
            type: {
              type: "string",
              enum: ["boolean", "string", "number", "integer", "null"],
            },
            enum: {
              type: "array",
            },
            pattern: {
              type: "string",
              enum: ["date", "email"],
            },
          },
          required: ["title", "type"],
          additionalProperties: false,
        },
      },
    },
    section: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["section"],
        },
        label: {
          type: "string",
        },
        name: {
          type: "string",
        },
        description: {
          type: "string",
        },
        children: {
          type: "array",
          items: {
            anyOf: [
              {
                $ref: "#/$defs/field",
              },
              {
                $ref: "#/$defs/multiField",
              },
              {
                $ref: "#/$defs/fieldList",
              },
              {
                $ref: "#/$defs/section",
              },
              {
                $ref: "#/$defs/text",
              },
            ],
          },
        },
      },
      required: ["type", "label", "name", "children"],
      additionalProperties: false,
    },
    fieldList: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["fieldList"],
        },
        label: {
          type: "string",
        },
        hideFieldListHeading: { type: "boolean" },
        minItemsHeading: { type: "string" },
        minItemsHelperText: { type: "string" },
        maxItemsHeading: { type: "string" },
        maxItemsHelperText: { type: "string" },
        name: {
          type: "string",
        },
        description: {
          type: "string",
        },
        children: {
          type: "array",
          items: {
            anyOf: [
              {
                $ref: "#/$defs/field",
              },
              {
                allOf: [
                  {
                    $ref: "#/$defs/multiField",
                  },
                  {
                    // the sibling multiField ref already requires an object, so
                    // declaring the type here only satisfies ajv's strictTypes check
                    not: {
                      type: "object",
                      properties: {
                        widget: {
                          const: "Table",
                        },
                      },
                      required: ["widget"],
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      required: ["type", "label", "name", "children"],
      additionalProperties: RULE_EXTENSION,
    },
    tableChildren: {
      type: "object",
      properties: {
        columns: {
          type: "array",
          minItems: 1,
          items: {
            $ref: "#/$defs/tableColumn",
          },
        },
        rows: {
          type: "array",
          minItems: 1,
          items: {
            $ref: "#/$defs/tableRow",
          },
        },
      },
      required: ["columns", "rows"],
      additionalProperties: false,
    },
    tableColumn: {
      type: "object",
      properties: {
        columnHeader: {
          type: "string",
        },
        width: {
          type: "number",
          minimum: 1,
          maximum: 100,
          description:
            "Optional column width as a percentage. Configured column widths cannot total more than 100.",
        },
      },
      required: ["columnHeader"],
      additionalProperties: false,
    },
    tableRow: {
      type: "object",
      properties: {
        cells: {
          type: "array",
          minItems: 1,
          items: {
            $ref: "#/$defs/tableCell",
          },
        },
      },
      required: ["cells"],
      additionalProperties: false,
    },
    tableCell: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["input", "readOnly", "plainText"],
        },
        definition: {
          type: "string",
          pattern: "^/(properties|\\$defs)(/[a-zA-Z0-9_]+)+$",
        },
        staticContent: {
          type: "string",
        },
        format: {
          type: "string",
          enum: ["integer", "decimal", "currency", "dollar", "percentage"],
        },
      },
      required: ["type"],
      allOf: [
        {
          if: {
            properties: {
              type: {
                enum: ["input", "readOnly"],
              },
            },
          },
          then: {
            required: ["definition"],
            not: {
              required: ["staticContent"],
            },
          },
        },
        {
          if: {
            properties: {
              type: {
                const: "plainText",
              },
            },
          },
          then: {
            required: ["staticContent"],
            not: {
              anyOf: [
                {
                  required: ["definition"],
                },
                {
                  required: ["format"],
                },
              ],
            },
          },
        },
      ],
      additionalProperties: false,
    },
  },
};

const buildAjv = () => {
  const ajv = new Ajv({ allErrors: true, coerceTypes: true });
  addFormats(ajv);

  return ajv;
};

/*
  Compiling a schema is codegen plus eval, and the ui schema is validated on every
  application form request, so the validator for it is built once per process. Reading
  `errors` straight after the synchronous call keeps this safe to share across requests.
*/
let uiSchemaValidator: ValidateFunction | undefined;

export const validateUiSchema = (data: object) => {
  uiSchemaValidator = uiSchemaValidator ?? buildAjv().compile(UiJsonSchema);

  if (uiSchemaValidator(data)) {
    return false;
  } else {
    return uiSchemaValidator.errors;
  }
};

/** Node keys this renderer reads. Anything else object-valued on a node is a rule it ignores. */
const IMPLEMENTED_NODE_KEYS = new Set([
  "type",
  "name",
  "label",
  "description",
  "content",
  "definition",
  "schema",
  "widget",
  "children",
  "printDescription",
  "hideFieldListHeading",
  "minItemsHeading",
  "minItemsHelperText",
  "maxItemsHeading",
  "maxItemsHelperText",
  "additionalDescribedById",
]);

/**
 * The rule keys present in a UI schema that this renderer does not act on.
 *
 * A form whose specification says a field is conditionally disabled renders it always
 * enabled, and nothing else says so. Reporting the keys lets the caller log that once per
 * form rather than leaving the difference between the artifact and the screen invisible.
 */
export const unimplementedRuleKeys = (data: unknown): string[] => {
  const found = new Set<string>();
  const visitNode = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visitNode);
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (Array.isArray(value)) {
        // A node's children are nodes; nothing else holds one.
        if (key === "children") value.forEach(visitNode);
        continue;
      }
      if (value === null || typeof value !== "object") continue;
      // An unread object property is a rule. Its own shape is the rule's business, so it is
      // named and not descended into -- otherwise every key inside it reads as a rule too.
      if (!IMPLEMENTED_NODE_KEYS.has(key)) found.add(key);
    }
  };
  visitNode(data);
  return [...found].sort();
};

export const validateJsonBySchema = (json: object, schema: RJSFSchema) => {
  const validate = buildAjv().compile(schema);

  if (validate(json)) {
    return false;
  } else {
    return validate.errors;
  }
};
