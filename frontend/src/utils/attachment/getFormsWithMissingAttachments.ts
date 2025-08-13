import { JSONSchema7, JSONSchema7Definition } from "json-schema";
import { getApplicationFormDetails } from "src/services/fetch/fetchers/applicationFetcher";
import { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import {
  Attachment,
  FormsWithMissingAttachments,
} from "src/types/attachmentTypes";

// type guard to check if a JSONSchema7Definition is an object schema (not boolean)
const isSchemaObject = (
  definition: JSONSchema7Definition,
): definition is JSONSchema7 => {
  return (
    typeof definition === "object" &&
    definition !== null &&
    !Array.isArray(definition)
  );
};

const ATTACHMENT_REF = "#/$defs/attachment_field";

// recursively check if the property schema contains a $ref to attachment_field
const checkForAttachment = (property: JSONSchema7Definition): boolean => {
  if (!isSchemaObject(property)) return false;

  // Check direct $ref
  if (property.$ref === ATTACHMENT_REF) {
    return true;
  }

  // Check allOf array
  if (Array.isArray(property.allOf)) {
    if (
      property.allOf.some(
        (item) => isSchemaObject(item) && item.$ref === ATTACHMENT_REF,
      )
    ) {
      return true;
    }
    // Recursively check nested allOf items
    for (const item of property.allOf) {
      if (checkForAttachment(item)) return true;
    }
  }

  // Check items (could be array or single schema)
  if (property.items) {
    if (Array.isArray(property.items)) {
      for (const item of property.items) {
        if (checkForAttachment(item)) return true;
      }
    } else {
      if (checkForAttachment(property.items)) return true;
    }
  }

  // Check properties recursively
  if (property.properties) {
    for (const key in property.properties) {
      if (checkForAttachment(property.properties[key])) return true;
    }
  }

  return false;
};

export const getFormsWithMissingAttachments = async (
  token: string,
  applicationForms: ApplicationFormDetail[],
  applicationId: string,
  applicationAttachments: Attachment[],
): Promise<FormsWithMissingAttachments[]> => {
  const results: FormsWithMissingAttachments[] = [];

  for (const form of applicationForms) {
    const formJsonSchema = form.form.form_json_schema || {};
    const properties = formJsonSchema.properties || {};

    // find fields requiring attachments
    const fieldsRequiringAttachment = Object.keys(properties).filter((key) => {
      return checkForAttachment(properties[key]);
    });

    // skip forms with no attachment fields
    if (fieldsRequiringAttachment.length === 0) continue;

    try {
      const response = await getApplicationFormDetails(
        token,
        applicationId,
        form.application_form_id,
      );

      const formData = response.data.application_response || {};

      // track missing fields per form
      const missingFields: string[] = [];

      for (const field of fieldsRequiringAttachment) {
        const value = formData[field];

        // no value, skip
        if (!value) continue;

        const valuesArray = Array.isArray(value) ? value : [value];

        const hasMissing = valuesArray.some(
          (attachmentId) =>
            !applicationAttachments.some(
              (attachment) =>
                attachment.application_attachment_id === attachmentId,
            ),
        );

        if (hasMissing) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        results.push({
          formId: form.application_form_id,
          missingAttachmentFields: missingFields,
        });
      }
    } catch (error) {
      console.error(
        `Failed to fetch form details for formId: ${form.application_form_id}`,
        error,
      );
    }
  }

  return results;
};
