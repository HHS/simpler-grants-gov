import {
  EnumOptionsType,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
} from "@rjsf/utils";
import { ErrorObject } from "ajv";

import { HTMLAttributes } from "react";

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

export type FieldErrors = ErrorObject<
  string,
  Record<string, unknown>,
  unknown
>[];

export type FormValidationWarning = {
  field: string;
  message: string;
  type: string;
  value: string;
};

export type FormattedFormValidationWarning = FormValidationWarning & {
  htmlField: string;
  formatted: string;
  definition: string | undefined;
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
  | "Budget424aSectionA"
  | "Budget424aSectionB"
  | "Budget424aSectionC"
  | "Budget424aSectionD"
  | "Budget424aSectionE"
  | "Budget424aSectionF";

export type DefinitionPath =
  | `/properties/${string}`
  | [`/properties/${string}`];

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
  children: Array<UiSchemaField | UiSchemaSection>;
  description?: string;
}

export type UiSchema = Array<UiSchemaSection | UiSchemaField>;

export type TextTypes =
  | "text"
  | "email"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "url";

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
  value?: string | Array<T> | unknown;
  type?: string;
  minLength?: number;
  schema: RJSFSchema & {
    description?: string;
    title?: string;
  };
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
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
