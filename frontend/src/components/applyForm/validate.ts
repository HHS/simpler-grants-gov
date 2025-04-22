import { RJSFSchema } from "@rjsf/utils";
import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";

// JSON Schema for the UiSchema, accepts either a "field" or "section"
const UiJsonSchema: RJSFSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "array",
  items: {
    anyOf: [
      {
        $ref: "#/$defs/field",
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
          enum: ["field"],
        },
        schema: {
          $ref: "#/$defs/schema",
        },
        definition: {
          type: "string",
          pattern: "^/properties/[a-zA-Z]+$",
        },
      },
      required: ["type"],
      oneOf: [
        {
          required: ["schema"],
        },
        {
          required: ["definition"],
        },
      ],
      additionalProperties: false,
    },
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
        children: {
          type: "array",
          items: {
            anyOf: [
              {
                $ref: "#/$defs/field",
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
  },
};

export const validateUiSchema = (data: object) => {
  return validateJsonBySchema(data, UiJsonSchema);
};

const getKeysWithValues = (formData: FormData) => {
  const keysWithValue: { [key: string]: string } = {};
  for (const [key, value] of formData.entries()) {
    if (value && typeof value === "string") {
      keysWithValue[key] = value;
    }
  }
  return keysWithValue;
};

const validateJsonBySchema = (json: object, schema: RJSFSchema) => {
  const ajv = new Ajv({ allErrors: true, coerceTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  if (validate(json)) {
    return false;
  } else {
    return validate.errors;
  }
};

export const validateFormData = (
  formData: FormData,
  schema: RJSFSchema,
):
  | ErrorObject<string, Record<string, unknown>, unknown>[]
  | null
  | false
  | undefined
  | [] => {
  const data = getKeysWithValues(formData);
  return validateJsonBySchema(data, schema);
};
