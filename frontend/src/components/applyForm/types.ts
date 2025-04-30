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
  type: string;
  title: string;
  minLength?: number;
  maxLength?: number;
  format?: string;
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

export type UiSchemaField = {
  type: "field";
  definition?: `/properties/${string}`;
  schema?: SchemaField;
};

export interface UiSchemaSection {
  type: "section";
  label: string;
  name: string;
  children: Array<UiSchemaField | UiSchemaSection>;
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

// extends the WidgetProps type from rjsf for USWDS and this project implementation
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
  value?: string | unknown;
  type?: string;
  minLength?: number;
  schema: RJSFSchema;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  hideError?: boolean;
  autofocus?: boolean;
  placeholder?: string;
  options: NonNullable<UIOptionsType<T, S, F>> & {
    /** The enum options list for a type that supports them */
    enumOptions?: EnumOptionsType<S>[];
    enumDisabled?: unknown;
    emptyValue?: string | undefined;
  };
  hideLabel?: boolean;
  multiple?: boolean;
  rawErrors?: string[] | undefined;
  // whether or not to use value + onChange
  updateOnInput?: boolean;
  onChange?: (value: unknown) => void;
  onBlur?: (id: string, value: unknown) => void;
  onFocus?: (id: string, value: unknown) => void;
}
