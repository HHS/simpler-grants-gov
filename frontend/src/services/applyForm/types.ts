import {
  EnumOptionsType,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  UIOptionsType,
} from "@rjsf/utils";

import { HTMLAttributes } from "react";

export interface FormData {
  [key: string]: FormDataEntryValue;
}

export interface SetFormDataFunction {
  (data: FormData): void;
}

export interface UiSchemaField {
  type: "field";
  definition: string;
}

export interface UiSchemaSection {
  type: "section";
  label: string;
  name: string;
  number: string;
  children: (UiSchemaField | UiSchemaSection)[];
}

export type UiSchema =
  | (UiSchemaField | UiSchemaSection)
  | (UiSchemaField | UiSchemaSection)[];

export type SchemaField = {
  type: string;
  title: string;
  minLength?: number;
  maxLength?: number;
  format?: string;
};

export interface FormSchema {
  $schema: string;
  type: string;
  properties: Record<string, SchemaField>;
  required?: string[];
}

export type TextTypes =
  | "text"
  | "email"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "url";

export interface UswdsWidgetProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends FormContextType = any,
> extends GenericObjectType,
    Pick<
      HTMLAttributes<HTMLElement>,
      Exclude<keyof HTMLAttributes<HTMLElement>, "onBlur" | "onFocus">
    > {
  id: string;
  value?: string | unknown;
  type?: string;
  minLength?: number;
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
  };
  hideLabel?: boolean;
  multiple?: boolean;
  rawErrors?: string[];
}
