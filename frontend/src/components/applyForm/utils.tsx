import { RJSFSchema } from "@rjsf/utils";
import { ErrorObject } from "ajv";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { filter, get } from "lodash";

import { JSX } from "react";

import { UiSchema } from "./types";
import { FieldsetWidget } from "./widgets/FieldsetWidget";
import SelectWidget from "./widgets/SelectWidget";
import TextareaWidget from "./widgets/TextAreaWidget";
import TextWidget from "./widgets/TextWidget";

export function buildForTreeRecursive(
  schema: RJSFSchema,
  uiSchema: UiSchema,
  errors: ErrorObject<string, Record<string, unknown>, unknown>[],
  formData: object,
) {
  let acc: JSX.Element[] = [];

  const buildFormTree = (
    uiSchema: UiSchema,
    parent: { label: string; name: string } | null,
  ) => {
    if (
      !Array.isArray(uiSchema) &&
      typeof uiSchema === "object" &&
      "children" in uiSchema
    ) {
      buildFormTree(uiSchema.children, {
        label: uiSchema.label,
        name: uiSchema.name,
      });
    } else if (Array.isArray(uiSchema)) {
      uiSchema.forEach((node) => {
        if ("children" in node) {
          buildFormTree(node.children, {
            label: node.label,
            name: node.name,
          });
        } else if (!parent && "definition" in node) {
          const field = buildField(node.definition, schema, errors, formData);
          if (field) {
            acc = [...acc, field];
          }
        }
      });
      if (parent) {
        // eslint-disable-next-line array-callback-return
        const row = uiSchema.map((node) => {
          if ("children" in node) {
            // TODO: remove children from acc
            // return children from acc;
          } else {
            const { definition } = node as { definition: string };
            return buildField(definition, schema, errors, formData);
          }
        });
        acc = [...acc, wrapSection(parent.label, parent.name, <>{row}</>)];
        // acc = parentHasChild(uiSchema) ? wrapSection(parent.label, parent.name, row) : [acc, wrapSection(parent.label, parent.name, row)];
      }
    }
  };
  buildFormTree(uiSchema, null);
  return acc;
}

const createField = ({
  id,
  required = false,
  minLength = null,
  maxLength = null,
  schema,
  rawErrors,
  value,
}: {
  id: string;
  required: boolean | undefined;
  minLength: number | null;
  maxLength: number | null;
  schema: RJSFSchema;
  rawErrors: string[] | undefined;
  value: string | number | undefined;
}) => {
  if (maxLength && Number(maxLength) > 255) {
    return TextareaWidget({
      id,
      required,
      minLength: minLength ?? undefined,
      maxLength,
      options: {},
      schema,
      rawErrors,
      value,
    });
  } else if (schema.enum?.length) {
    return SelectWidget({
      id,
      required,
      minLength: minLength ?? undefined,
      maxLength: minLength ?? undefined,
      options: {
        enumOptions: schema.enum.map((label, index) => ({
          value: index,
          label: String(label),
        })),
      },
      schema,
      rawErrors,
      value,
    });
  } else {
    return TextWidget({
      id,
      required,
      minLength: minLength ?? undefined,
      maxLength: minLength ?? undefined,
      options: {},
      schema,
      rawErrors,
      value,
    });
  }
};

export const buildField = (
  definition: string,
  formSchema: RJSFSchema,
  errors: ErrorObject<string, Record<string, unknown>, unknown>[],
  formData: object,
) => {
  const name = definition.split("/")[definition.split("/").length - 1];
  const schema = getSchemaObjectFromPointer(
    formSchema,
    definition,
  ) as RJSFSchema;
  const rawErrors = formatFieldErrors(errors, definition, name);
  const value = get(formData, name) as string | number | undefined;

  return createField({
    id: name,
    required: (formSchema.required ?? []).includes(name),
    minLength: schema.minLength ? schema.minLength : null,
    maxLength: schema.maxLength ? schema.maxLength : null,
    schema,
    rawErrors,
    value,
  });
};

const formatFieldErrors = (
  errors: ErrorObject<string, Record<string, unknown>, unknown>[],
  definition: string,
  name: string,
) => {
  const errorsforField = filter(
    errors,
    (error) =>
      definition === `/properties${error.instancePath}` ||
      name === error.params?.missingProperty,
  );
  return errorsforField
    .map((error) => {
      if (definition === `/properties${error.instancePath}`) {
        return error.message;
      }
      return "This required field cannot be blank";
    })
    .filter((error): error is string => error !== undefined);
};

export function getWrappersForNav(
  schema: UiSchema,
): { href: string; text: string }[] {
  const results: { href: string; text: string }[] = [];

  if (!Array.isArray(schema)) return results;
  for (const item of schema) {
    if ("children" in item && item.children && item.children.length > 0) {
      if (item.name && item.label) {
        results.push({ href: item.name, text: item.label });
      }
      results.push(...getWrappersForNav(item.children));
    }
  }

  return results;
}

const wrapSection = (
  label: string,
  fieldName: string,
  tree: JSX.Element | undefined,
) => {
  return (
    <FieldsetWidget
      key={`${fieldName}-wrapper`}
      fieldName={fieldName}
      label={label}
    >
      {tree}
    </FieldsetWidget>
  );
};
