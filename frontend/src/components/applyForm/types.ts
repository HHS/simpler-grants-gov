import {
  EnumOptionsType,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
} from "@rjsf/utils";

import { HTMLAttributes } from "react";

export type GeneralRecord = Record<string, unknown>;

export type BroadlyDefinedWidgetValue =
  | string
  | GeneralRecord
  | GeneralRecord[]
  | string[]
  | number
  | boolean;

export type SchemaField = {
  type?: string;
  title?: string;
  minLength?: number;
  maxLength?: number;
  format?: string;
  enum?: string[];
  description?: string;
};

export interface FormSchema {
  $schema: string;
  type: string;
  properties: Record<string, SchemaField>;
  required?: string[];
}

export interface FormData {
  [key: string]: FormDataEntryValue;
}

export interface SetFormDataFunction {
  (data: FormData): void;
}

export type FormValidationWarning = {
  field: string;
  message: string;
  type: string;
  value: string | null;
};

export type FormattedFormValidationWarning = FormValidationWarning & {
  htmlField?: string;
  formatted?: string;
  definition?: string | undefined;
};

export type WidgetTypes =
  | "Attachment"
  | "AttachmentArray"
  | "Checkbox"
  | "Text"
  | "TextArea"
  | "Radio"
  | "Select"
  | "MultiSelect"
  | "Print"
  | "PrintAttachment"
  | "Budget424aSectionA"
  | "Budget424aSectionB"
  | "Budget424aSectionC"
  | "Budget424aSectionD"
  | "Budget424aSectionE"
  | "Budget424aSectionF"
  | "FieldList";

type PropertyPath = `/properties/${string}`;

/**
 * Props passed to the FieldList widget.
 *
 * FieldList is a custom widget that renders a repeatable group of fields
 * (similar to an array of objects in the JSON schema). Each row represents
 * one instance of the grouped fields defined in `groupDefinition`.
 *
 * These props follow the general shape expected by the WidgetRenderers
 * system so the FieldList widget can be rendered alongside other widgets
 * in the form engine.
 *
 * Important fields:
 *
 * id
 *   Unique identifier used for DOM association and accessibility.
 *
 * schema
 *   The schema fragment associated with this widget. WidgetRenderers
 *   expects this to exist because other widgets rely on schema metadata
 *   such as title and description.
 *
 * name
 *   The FieldList field name. Used to derive the base field path
 *   (e.g. $.fieldListName) for mapping validation warnings to the list.
 *
 * groupDefinition
 *   Describes the fields that appear in each repeatable row.
 *
 * value
 *   The current array of row values for the FieldList.
 *
 * defaultSize
 *   Initial number of rows to render when no data exists.
 *
 * minItems / maxItems
 *   Optional constraints for the number of rows allowed in the list.
 *   Used for validation and future control of add/remove behavior.
 *
 * rawErrors / requiredFields
 *   Validation information passed down from the form engine.
 *   rawErrors may include both group-level (array) and child field warnings.
 *
 * disabled / readOnly / isFormLocked
 *   Control widget interactivity.
 *
 * formContext
 *   Provides access to the root schema and form data when needed.
 *
 * onChange
 *   Called when the FieldList value changes.
 *   Receives the full array of row objects.
 */
export type FieldListWidgetProps = {
  id: string;
  key: string;
  schema: RJSFSchema & {
    description?: string;
    title?: string;
  };
  label: string;
  description?: string;
  defaultSize: number;
  name: string;
  minItems?: number;
  maxItems?: number;
  groupDefinition: FieldListGroupItem[];
  rawErrors?: FormattedFormValidationWarning[];
  requiredFields?: string[];
  value?: GeneralRecord[];
  onChange?: (value: GeneralRecord[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  isFormLocked?: boolean;
  formContext?: {
    rootSchema?: RJSFSchema;
    rootFormData?: unknown;
  };
};

export type FieldListChildWidgetTypes = Exclude<WidgetTypes, "FieldList">;

export type FieldListGroupItem = {
  widget: FieldListChildWidgetTypes;
  generalProps: Omit<UswdsWidgetProps, "id" | "value" | "key">;
  baseId: string;
  definition: string;
};

export type DefinitionPath = PropertyPath | PropertyPath[];

export type UiSchemaField = {
  type: "field" | "multiField" | "null";
  widget?: WidgetTypes;
  name?: string;
} & (
  | {
      definition: DefinitionPath;
      schema?: undefined;
    }
  | { schema: SchemaField; definition?: undefined }
  | {
      definition: DefinitionPath;
      schema: SchemaField;
    }
);

export interface UiSchemaSection {
  type: "section";
  label: string;
  name: string;
  children: UiSchema;
  description?: string;
}

export interface UiSchemaFieldList {
  type: "fieldList";
  label: string;
  name: string;
  description?: string;
  defaultSize: number;
  children: UiSchemaField[];
}

export type UiSchemaNode = UiSchemaField | UiSchemaSection | UiSchemaFieldList;
export type UiSchema = UiSchemaNode[];

export type TextTypes =
  | "text"
  | "email"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "url";

// extends the WidgetProps type from rjsf for USWDS and this project implementation
// see https://github.com/rjsf-team/react-jsonschema-form/blob/7395afcdee6aaea128d943dd17e126c4ed301e58/packages/utils/src/types.ts#L898
export interface UswdsWidgetProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
> extends GenericObjectType,
    Pick<
      HTMLAttributes<HTMLElement>,
      Exclude<keyof HTMLAttributes<HTMLElement>, "onBlur" | "onFocus">
    > {
  id: string;
  // this needs to be locked down using a generic eventually
  value?: BroadlyDefinedWidgetValue;
  type?: string;
  minLength?: number;
  schema: RJSFSchema & {
    description?: string;
    title?: string;
  };
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  isFormLocked?: boolean;
  hideError?: boolean;
  autofocus?: boolean;
  placeholder?: string;
  options?: NonNullable<UIOptionsType<T, S, F>> & {
    /** The enum options list for a type that supports them */
    enumOptions?: EnumOptionsType<S>[];
    enumDisabled?: unknown;
    emptyValue?: string | undefined;
  };
  formClassName?: string;
  inputClassName?: string;
  hideLabel?: boolean;
  multiple?: boolean;
  rawErrors?: string[] | FormValidationWarning[] | undefined;
  // whether or not to use value + onChange
  updateOnInput?: boolean;
  onChange?: (value: unknown) => void;
  onBlur?: (id: string, value: unknown) => void;
  onFocus?: (id: string, value: unknown) => void;
  formContext?: {
    rootSchema?: RJSFSchema;
    rootFormData?: unknown;
  };
}

export type SchemaWithLabelOption = UswdsWidgetProps & {
  options?: {
    "widget-label"?: string;
    [key: string]: unknown;
  };
};

export type UploadedFile = {
  id: string;
  name: string;
};
