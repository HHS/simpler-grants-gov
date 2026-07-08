import { RJSFSchema } from "@rjsf/utils";
import Ajv from "ajv";
import addFormats from "ajv-formats";

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
    ],
  },
  $defs: {
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
      additionalProperties: false,
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
      additionalProperties: false,
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
                    not: {
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
      additionalProperties: false,
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
              required: ["definition"],
            },
          },
        },
      ],
      additionalProperties: false,
    },
  },
};

export const validateUiSchema = (data: object) => {
  return validateJsonBySchema(data, UiJsonSchema);
};

export const validateJsonBySchema = (json: object, schema: RJSFSchema) => {
  const ajv = new Ajv({ allErrors: true, coerceTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  if (validate(json)) {
    return false;
  } else {
    return validate.errors;
  }
};
