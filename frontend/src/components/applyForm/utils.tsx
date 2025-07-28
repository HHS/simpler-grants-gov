import { RJSFSchema } from "@rjsf/utils";
import { get as getSchemaObjectFromPointer } from "json-pointer";
import { filter, get } from "lodash";
import { getSimpleTranslationsSync } from "src/i18n/getMessagesSync";
import {
  ApplicationFormDetail,
  ApplicationResponseDetail,
} from "src/types/applicationResponseTypes";

import { JSX } from "react";

import { formDataToObject } from "./formDataToJson";
import {
  FormValidationWarning,
  SchemaField,
  UiSchema,
  UiSchemaField,
  UswdsWidgetProps,
  WidgetTypes,
} from "./types";
import Budget424aSectionA from "./widgets/budget/Budget424aSectionA";
import Budget424aSectionB from "./widgets/budget/Budget424aSectionB";
import Budget424aTotalBudgetSummary from "./widgets/budget/Budget424aTotalBudgetSummary";
import CheckboxWidget from "./widgets/CheckboxWidget";
import { FieldsetWidget } from "./widgets/FieldsetWidget";
import RadioWidget from "./widgets/RadioWidget";
import SelectWidget from "./widgets/SelectWidget";
import TextAreaWidget from "./widgets/TextAreaWidget";
import TextWidget from "./widgets/TextWidget";

export function buildFormTreeRecursive({
  errors,
  formData,
  schema,
  uiSchema,
}: {
  errors: FormValidationWarning[] | null;
  formData: object;
  schema: RJSFSchema;
  uiSchema: UiSchema;
}) {
  let acc: JSX.Element[] = [];

  const buildFormTree = (
    uiSchema: UiSchema | { children: UiSchema; label: string; name: string },
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
          buildFormTree(node.children as unknown as UiSchema, {
            label: node.label,
            name: node.name,
          });
        } else if (!parent && ("definition" in node || "schema" in node)) {
          const field = buildField({
            uiFieldObject: node,
            formSchema: schema,
            errors,
            formData,
          });
          if (field) {
            acc = [...acc, field];
          }
        }
      });
      if (parent) {
        const childAcc: JSX.Element[] = [];
        const keys: number[] = [];
        const row = uiSchema.map((node) => {
          if ("children" in node) {
            acc.forEach((item, key) => {
              if (item) {
                if (item.key === `${node.name}-wrapper`) {
                  keys.push(key);
                }
              }
            });
            return null;
          } else {
            return buildField({
              uiFieldObject: node,
              formSchema: schema,
              errors,
              formData,
            });
          }
        });
        if (keys.length) {
          keys.forEach((key) => {
            childAcc.push(acc[key]);
            delete acc[key];
          });
          acc = [
            ...acc,
            wrapSection(parent.label, parent.name, <>{childAcc}</>),
          ];
        } else {
          acc = [...acc, wrapSection(parent.label, parent.name, <>{row}</>)];
        }
      }
    }
  };
  buildFormTree(uiSchema, null);
  return acc;
}

// json schema doesn't describe UI so types are infered if widget not supplied
export const determineFieldType = ({
  uiFieldObject,
  fieldSchema,
}: {
  uiFieldObject: UiSchemaField;
  fieldSchema: RJSFSchema;
}): WidgetTypes => {
  const { widget } = uiFieldObject;
  if (widget) return widget;
  if (fieldSchema.enum?.length) {
    return "Select";
  } else if (fieldSchema.type === "boolean") {
    return "Checkbox";
  } else if (fieldSchema.maxLength && fieldSchema.maxLength > 255) {
    return "TextArea";
  } else if (fieldSchema.type === "array") {
    return "Select";
  }
  return "Text";
};

// either schema or definition is required, and schema fields take precedence
export const getFieldSchema = ({
  definition,
  schema,
  formSchema,
}: {
  definition: `/properties/${string}` | undefined;
  schema: SchemaField | undefined;
  formSchema: RJSFSchema;
}): RJSFSchema => {
  if (definition && schema) {
    return {
      ...getSchemaObjectFromPointer(formSchema, definition),
      ...schema,
    } as RJSFSchema;
  } else if (definition) {
    return getSchemaObjectFromPointer(formSchema, definition) as RJSFSchema;
  }
  return schema as RJSFSchema;
};

export const getNameFromDef = ({
  definition,
  schema,
}: {
  definition: `/properties/${string}` | undefined;
  schema: SchemaField | undefined;
}) => {
  return definition
    ? definition.split("/")[definition.split("/").length - 1]
    : typeof schema === "object" &&
        schema !== null &&
        "title" in schema &&
        typeof (schema as { title?: string }).title === "string"
      ? ((schema as { title?: string }).title as string).replace(/ /g, "-")
      : "untitled";
};

// new, not used in multifield
export const getFieldName = (
  definition?: string,
  schema?: SchemaField,
): string => {
  if (definition) {
    const definitionParts = definition.split("/");
    return definitionParts
      .filter((part) => part && part !== "properties")
      .join("--"); // using hyphens since that will work better for html attributes than slashes and will have less conflict with other characters
  }
  return (schema?.title ?? "untitled").replace(" ", "-");
};

export const getFieldPath = (fieldName: string) =>
  `/${fieldName.replace(/--/g, "/")}`;

const widgetComponents: Record<
  WidgetTypes,
  (widgetProps: UswdsWidgetProps) => JSX.Element
> = {
  Text: (widgetProps: UswdsWidgetProps) => TextWidget(widgetProps),
  TextArea: (widgetProps: UswdsWidgetProps) => TextAreaWidget(widgetProps),
  Radio: (widgetProps: UswdsWidgetProps) => RadioWidget(widgetProps),
  Select: (widgetProps: UswdsWidgetProps) => SelectWidget(widgetProps),
  Checkbox: (widgetProps: UswdsWidgetProps) => CheckboxWidget(widgetProps),
  Budget424aSectionA: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionA(widgetProps),
  Budget424aSectionB: (widgetProps: UswdsWidgetProps) =>
    Budget424aSectionB(widgetProps),
  Budget424aTotalBudgetSummary: (widgetProps: UswdsWidgetProps) =>
    Budget424aTotalBudgetSummary(widgetProps),
};

export const buildField = ({
  errors,
  formSchema,
  formData,
  uiFieldObject,
}: {
  errors: FormValidationWarning[] | null;
  formSchema: RJSFSchema;
  formData: object;
  uiFieldObject: UiSchemaField;
}) => {
  const { definition, schema, type: fieldType } = uiFieldObject;

  let fieldSchema = {} as RJSFSchema;
  let name = "";
  let value = "" as string | number | object | undefined;

  if (fieldType === "multiField" && definition && Array.isArray(definition)) {
    name = uiFieldObject.name ? uiFieldObject.name : "";
    fieldSchema = definition
      .map((def) => getSchemaObjectFromPointer(formSchema, def) as RJSFSchema)
      .reduce((acc, schema) => ({ ...acc, ...schema }), {});
    value = definition
      .map((def) => {
        const defName = getNameFromDef({ definition: def, schema });
        const result = get(formData, defName) as unknown;
        return typeof result === "object" && result !== null
          ? (result as Record<string, unknown>)
          : {};
      })
      .reduce<Record<string, unknown>>(
        (acc, value) => ({ ...acc, ...value }),
        {},
      );
  } else if (typeof definition === "string") {
    fieldSchema = getFieldSchema({ definition, schema, formSchema });

    name = getFieldName(definition, schema);
    const path = getFieldPath(name);
    value = getSchemaObjectFromPointer(formData, path) as
      | string
      | number
      | undefined;
  }
  if (!name || !fieldSchema) {
    throw new Error("Could not build field");
  }

  const rawErrors = errors
    ? formatFieldWarnings(
        errors,
        name,
        typeof fieldSchema.type === "string"
          ? fieldSchema.type
          : Array.isArray(fieldSchema.type)
            ? (fieldSchema.type[0] ?? "")
            : "",
      )
    : [];

  const type = determineFieldType({ uiFieldObject, fieldSchema });

  // TODO: move schema mutations to own function
  const disabled = fieldSchema.type === "null";
  let options = {};
  let enums: unknown[] = [];
  if (type === "Select") {
    if (fieldSchema.type === "array") {
      if (
        fieldSchema.items &&
        typeof fieldSchema.items === "object" &&
        "enum" in fieldSchema.items &&
        Array.isArray((fieldSchema.items as { enum?: unknown[] }).enum)
      ) {
        enums = (fieldSchema.items as { enum?: unknown[] }).enum ?? [];
      }
    } else {
      enums = fieldSchema.enum ?? [];
    }
    options = {
      enumOptions: enums.map((label) => ({
        value: String(label),
        label: getSimpleTranslationsSync({
          nameSpace: "Form",
          translateableString: String(label),
        }),
      })),
      emptyValue: "- Select -",
    };
  }

  return widgetComponents[type]({
    id: name,
    disabled,
    required: (formSchema.required ?? []).includes(name),
    minLength: fieldSchema?.minLength ? fieldSchema.minLength : undefined,
    maxLength: fieldSchema?.maxLength ? fieldSchema.maxLength : undefined,
    schema: fieldSchema,
    rawErrors,
    value,
    options,
  });
};

const formatFieldWarnings = (
  warnings: FormValidationWarning[],
  name: string,
  type: string,
) => {
  if (type === "array") {
    const data = warnings.reduce(
      (acc, item) => {
        const field = item.field.replace(/^\$\./, "");
        acc[field] = item.message;
        return acc;
      },
      {} as Record<string, unknown>,
    );
    return flatFormDataToArray(name, data) as unknown as [""];
  }
  const warningsforField = filter(
    warnings,
    (warning) => `$.${name}` === warning.field,
  );
  return warningsforField.map((warning) => {
    return warning.message;
  });
};

export function getFieldsForNav(
  schema: UiSchema,
): { href: string; text: string }[] {
  const results: { href: string; text: string }[] = [];

  if (!Array.isArray(schema)) return results;
  for (const item of schema) {
    if (
      "children" in item &&
      item.children &&
      Array.isArray(item.children) &&
      item.children.length > 0
    ) {
      if (item.name && item.label) {
        results.push({ href: item.name, text: item.label });
      }
      if (
        Array.isArray(item.children) &&
        item.children.every((child) => "label" in child && "name" in child)
      ) {
        results.push(...getFieldsForNav(item.children as unknown as UiSchema));
      }
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

// filters, orders, and nests the form data to match the form schema
export const shapeFormData = <T extends object>(formData: FormData): T => {
  formData.delete("$ACTION_REF_1");
  formData.delete("$ACTION_1:0");
  formData.delete("$ACTION_1:1");
  formData.delete("$ACTION_REF_1");
  formData.delete("$ACTION_KEY");
  formData.delete("apply-form-button");

  return formDataToObject(formData, {
    delimiter: "--",
  }) as T;
};

// arrays from the html look like field_[row]_item
const flatFormDataToArray = (field: string, data: Record<string, unknown>) => {
  return Object.entries(data).reduce(
    (values: Array<Record<string, unknown>>, CV) => {
      const value = CV[1];
      const fieldSplit = CV[0].split(/\[\d+\]\./);
      const fieldName = fieldSplit[0];
      const itemName = fieldSplit[1];

      if (fieldName === field && value) {
        const match = CV[0].match(/[0-9]+/);
        const arrayNumber = match ? Number(match[0]) : -1;
        if (!values[arrayNumber]) {
          values[arrayNumber] = {};
        }
        values[arrayNumber][itemName] = value;
      }

      return values;
    },
    [] as Array<Record<string, unknown>>,
  );
};

// the application detail contains an empty array for the form response if no
// forms have been saved or an application_response with a form_id
export const getApplicationResponse = (
  forms: [] | ApplicationFormDetail[],
  formId: string,
): ApplicationResponseDetail | object => {
  if (forms.length > 0) {
    const form = forms.find((form) => form?.form_id === formId);
    return form?.application_response || {};
  } else {
    return {};
  }
};
