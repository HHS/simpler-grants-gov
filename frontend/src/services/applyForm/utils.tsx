import { RJSFSchema } from "@rjsf/utils";
import { ErrorObject } from "ajv";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { get } from "lodash";

import { JSX } from "react";

import { wrapSection } from "./fields";
import { UiSchema } from "./types";
import SelectWidget from "./widgets/SelectWidget";
import TextareaWidget from "./widgets/TextAreaWidget";
import TextWidget from "./widgets/TextWidget";

export function buildFormTreeClosure(
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

const createField = (
  id: string,
  required: boolean | undefined = false,
  minLength: number | null = null,
  maxLength: number | null = null,
  schema: RJSFSchema,
  rawErrors: string[],
  value: string | number | undefined,
) => {
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
  const name = definition.split("/")[2];
  const schema = getSchemaObjectFromPointer(
    formSchema,
    definition,
  ) as RJSFSchema;
  const rawErrors = errors.find(
    (error) => definition === `/properties${error.instancePath}`,
  );
  const value = get(formData, name) as string | number | undefined;

  return createField(
    name,
    (formSchema.required ?? []).includes(name),
    schema.minLength,
    schema.maxLength,
    schema,
    rawErrors ? [rawErrors.message ?? ""] : [],
    value,
  );
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
