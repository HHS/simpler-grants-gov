// Frontend source is imported, not type-checked: checking it would need the frontend's own
// tsconfig and packages, and the frontend's CI already checks it. These declarations cover
// only what the site touches, loosely typed.
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "@sgg/frontend/types/applyForm/types" {
  export type FormattedFormValidationWarning = {
    field: string;
    message: string;
    type: string;
    value: string | null;
    formatted?: string;
    htmlField?: string;
    definition?: string;
  };
  export type UiSchema = any;
  export type UiSchemaNode = any;
  export type UiSchemaField = any;
  export type UiSchemaFieldList = any;
  export type WidgetTypes = string;
}

declare module "@sgg/frontend/utils/applyForm/applyFormUtils" {
  import type { RJSFSchema } from "@rjsf/utils";
  import type { FormattedFormValidationWarning } from "@sgg/frontend/types/applyForm/types";

  export const processFormSchema: (schema: object) => {
    formSchema: RJSFSchema;
    conditionalValidationRules: RJSFSchema;
  };
  export const shapeFormData: <T extends object = object>(
    formData: FormData,
    formSchema: RJSFSchema,
  ) => T;
  export const getRequiredProperties: (schema: RJSFSchema) => string[];
  export const isFieldRequired: (
    path: string,
    requiredPaths: string[],
  ) => boolean;
  export const addPrintWidgetToFields: <T>(nodes: T[]) => T[];
  export const buildWarningTree: (
    uiSchema: any,
    parent: any,
    warnings: object[],
    formSchema: RJSFSchema,
  ) => FormattedFormValidationWarning[];
}

declare module "@sgg/frontend/utils/applyForm/getFieldConfig" {
  export const getFieldConfig: (args: Record<string, unknown>) => {
    type: string;
    props: Record<string, unknown>;
  };
}

declare module "@sgg/frontend/utils/applyForm/fieldListHelpers" {
  import type { FormattedFormValidationWarning } from "@sgg/frontend/types/applyForm/types";

  export const getFieldListChildErrors: (args: {
    rawErrors?: FormattedFormValidationWarning[];
    fieldListPath: string;
    entryIndex: number;
    storagePath: string[];
    childDefinition: string;
  }) => string[];
}

declare module "@sgg/frontend/utils/formData/formDataUtils" {
  export const getByPointer: (target: object, pointer: string) => any;
}

declare module "@sgg/frontend/components/apply-form/widgets/WidgetRenderers" {
  import type { JSX } from "react";

  export const renderWidget: (args: {
    type: string;
    props: Record<string, unknown>;
    definition?: string;
  }) => JSX.Element | null;
  export const wrapSection: (args: {
    label: string;
    fieldName: string;
    sectionFields: JSX.Element;
    description?: string;
  }) => JSX.Element;
}

declare module "@sgg/frontend/i18n/messages/en/index" {
  export const messages: Record<string, unknown>;
}

declare module "@sgg/frontend/components/apply-form/jsonforms/convertUiSchema" {
  import type { ControlElement, UISchemaElement } from "@jsonforms/core";
  import type { RJSFSchema } from "@rjsf/utils";
  import type { UiSchema, UiSchemaField } from "@sgg/frontend/types/applyForm/types";

  export type JsonFormsUiSchema = UISchemaElement;
  export const controlToNodes: (
    control: ControlElement,
    schema: RJSFSchema,
  ) => UiSchemaField[];
  export const groupName: (label: string) => string;
  export type ConvertedUiSchema = {
    uiSchema: UiSchema;
    unsupportedControls: string[];
    ignoredListRules: string[];
  };
  export const convertJsonFormsUiSchema: (
    uiSchema: JsonFormsUiSchema,
    schema: RJSFSchema,
  ) => ConvertedUiSchema;
}

declare module "@sgg/frontend/components/apply-form/jsonforms/renderers" {
  import type { RJSFSchema } from "@rjsf/utils";
  import type { FormattedFormValidationWarning } from "@sgg/frontend/types/applyForm/types";
  import type { JsonFormsUiSchema } from "@sgg/frontend/components/apply-form/jsonforms/convertUiSchema";
  import type { Context } from "react";

  export type AdapterContextValue = {
    schema: RJSFSchema;
    formData: object;
    errors: FormattedFormValidationWarning[] | null;
    requiredFieldPaths: string[];
    rootUiSchema: JsonFormsUiSchema;
    formContext?: unknown;
    isFormLocked?: boolean;
    print?: boolean;
  };
  export const AdapterContext: Context<AdapterContextValue | null>;
}

declare module "@sgg/frontend/components/apply-form/jsonforms/JsonFormsFields" {
  import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";
  import type { RJSFSchema } from "@rjsf/utils";
  import type { FormattedFormValidationWarning } from "@sgg/frontend/types/applyForm/types";
  import type { JsonFormsUiSchema } from "@sgg/frontend/components/apply-form/jsonforms/convertUiSchema";
  import type { JSX } from "react";

  export const JsonFormsFields: (props: {
    errors: FormattedFormValidationWarning[] | null;
    formData: object;
    schema: RJSFSchema;
    uiSchema: JsonFormsUiSchema;
    formContext?: unknown;
    isFormLocked?: boolean;
    print?: boolean;
    extraRenderers?: JsonFormsRendererRegistryEntry[];
  }) => JSX.Element;
}
