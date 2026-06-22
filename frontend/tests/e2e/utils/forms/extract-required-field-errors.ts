import { RJSFSchema } from "@rjsf/utils";
import { FieldError } from "tests/e2e/utils/forms/verify-form-errors-utils";

/**
 * Generates expected validation error messages from a form schema's required fields.
 * Automatically stays in sync with schema changes—no manual message updates needed.
 *
 * @param schema - The form JSON schema containing required field definitions
 * @param fieldIdMap - Maps schema property paths to test field IDs
 *                     Example: { "applicant_name": "applicant_name", "contact_person/first_name": "contact_person--first_name" }
 * @returns Sorted array of FieldError objects with expected error messages
 *
 * @example
 * const errors = extractRequiredFieldErrors(CD511_SCHEMA, {
 *   "applicant_name": "applicant_name",
 *   "contact_person/first_name": "contact_person--first_name",
 *   "contact_person/last_name": "contact_person--last_name",
 *   "contact_person_title": "contact_person_title",
 * });
 */
export function extractRequiredFieldErrors(
  schema: RJSFSchema,
  fieldIdMap: Record<string, string>,
): FieldError[] {
  const errors: FieldError[] = [];

  /**
   * Recursively traverse schema to find all required fields
   */
  const processSchema = (
    currentSchema: RJSFSchema,
    currentPath: string = "",
  ): void => {
    const requiredFields = currentSchema.required || [];

    for (const fieldName of requiredFields) {
      const fieldSchema = currentSchema.properties?.[fieldName];
      if (!fieldSchema) continue;

      const fieldPath = currentPath ? `${currentPath}/${fieldName}` : fieldName;
      const fieldId = fieldIdMap[fieldPath];

      if (!fieldId) {
        console.warn(
          `Warning: No fieldId mapping found for required field: ${fieldPath}`,
        );
        continue;
      }

      const title = fieldSchema.title || fieldName;
      const message = `${title} is required`;

      errors.push({
        fieldId,
        message,
      });

      // Recursively process nested objects
      if (fieldSchema.type === "object" && fieldSchema.properties) {
        processSchema(fieldSchema, fieldPath);
      }
    }
  };

  processSchema(schema);

  // Sort by message for consistent test output
  return errors.sort((a, b) => a.message.localeCompare(b.message));
}

/**
 * Fetches form schema from the API and generates expected validation error messages.
 * Works with both local and staging environments.
 *
 * @param formId - The form ID (UUID or short name like "cd511")
 * @param fieldIdMap - Maps schema property paths to test field IDs
 * @param apiBaseUrl - Optional API base URL. Defaults to current origin.
 *                     Local: "http://localhost:8080" or leave blank for auto-detection
 *                     Staging: "https://staging.grants.gov" or full URL
 * @returns Sorted array of FieldError objects generated from the fetched schema
 *
 * @example
 * // Local (auto-detect)
 * const errors = await extractRequiredFieldErrorsFromApi("cd511", CD511_FIELD_ID_MAP);
 *
 * // Staging (explicit)
 * const errors = await extractRequiredFieldErrorsFromApi(
 *   "cd511",
 *   CD511_FIELD_ID_MAP,
 *   "https://staging.grants.gov"
 * );
 */
export async function extractRequiredFieldErrorsFromApi(
  formId: string,
  fieldIdMap: Record<string, string>,
  apiBaseUrl?: string,
): Promise<FieldError[]> {
  // Determine API base URL
  const baseUrl = apiBaseUrl || typeof window !== "undefined" ? window.location.origin : "";

  try {
    // Fetch form definition from API
    const response = await fetch(`${baseUrl}/api/form-alpha/${formId}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch form schema for ${formId}: ${response.status} ${response.statusText}`,
      );
    }

    const formData = await response.json();
    const schema = formData.form_json_schema as RJSFSchema;

    if (!schema) {
      throw new Error(
        `Form schema not found in API response for ${formId}`,
      );
    }

    return extractRequiredFieldErrors(schema, fieldIdMap);
  } catch (error) {
    console.error(`Error fetching form schema for ${formId}:`, error);
    throw error;
  }
}
