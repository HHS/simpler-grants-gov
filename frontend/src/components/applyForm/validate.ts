import { RJSFSchema } from "@rjsf/utils";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize a string input to prevent XSS attacks
 */
function sanitizeString(input: string, maxLength: number = 10000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  if (input.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
  
  // Remove null bytes and dangerous control characters
  const cleaned = input.replace(/\x00/g, '').replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  
  // Sanitize HTML content
  return DOMPurify.sanitize(cleaned, { 
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []  // No attributes allowed
  });
}

/**
 * Validate that an object is safe for JSON processing
 */
function validateObjectStructure(obj: any, maxDepth: number = 10, currentDepth: number = 0): void {
  if (currentDepth > maxDepth) {
    throw new Error(`Object structure exceeds maximum depth of ${maxDepth}`);
  }
  
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      if (obj.length > 1000) {
        throw new Error('Array exceeds maximum length of 1000 items');
      }
      obj.forEach(item => validateObjectStructure(item, maxDepth, currentDepth + 1));
    } else {
      const keys = Object.keys(obj);
      if (keys.length > 1000) {
        throw new Error('Object exceeds maximum of 1000 keys');
      }
      keys.forEach(key => {
        if (typeof key === 'string' && key.length > 256) {
          throw new Error('Object key exceeds maximum length of 256 characters');
        }
        validateObjectStructure(obj[key], maxDepth, currentDepth + 1);
      });
    }
  }
}

// JSON Schema for the UiSchema, accepts either a "field" or "section"
export const UiJsonSchema: RJSFSchema = {
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
          enum: ["field", "multiField", "null"],
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
  // Validate structure safety first
  try {
    validateObjectStructure(data, 15, 0);
  } catch (error) {
    return [{ message: `Structure validation failed: ${error}`, path: '$' }];
  }
  
  return validateJsonBySchema(data, UiJsonSchema);
};

export const validateJsonBySchema = (json: object, schema: RJSFSchema) => {
  // Validate input structure
  try {
    validateObjectStructure(json, 15, 0);
    validateObjectStructure(schema, 10, 0);
  } catch (error) {
    return [{ message: `Input validation failed: ${error}`, path: '$' }];
  }
  
  const ajv = new Ajv({ 
    allErrors: true, 
    coerceTypes: true,
    strict: true,
    validateFormats: true,
    maxItems: 1000,
    maxProperties: 1000,
    maxLength: 10000
  });
  
  addFormats(ajv);
  
  // Add custom format for safe strings
  ajv.addFormat('safeString', {
    type: 'string',
    validate: (data: string) => {
      try {
        sanitizeString(data);
        return true;
      } catch {
        return false;
      }
    }
  });
  
  const validate = ajv.compile(schema);

  if (validate(json)) {
    return false;
  } else {
    // Sanitize error messages to prevent potential injection
    const sanitizedErrors = validate.errors?.map(error => ({
      ...error,
      message: error.message ? sanitizeString(error.message, 500) : 'Validation error',
      instancePath: error.instancePath ? sanitizeString(error.instancePath, 200) : '',
      schemaPath: error.schemaPath ? sanitizeString(error.schemaPath, 200) : ''
    }));
    return sanitizedErrors;
  }
};
