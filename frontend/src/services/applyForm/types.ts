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
  title: string;
  description?: string;
  properties: [SchemaField];
  required: [string];
}

export type TextTypes =
  | "text"
  | "email"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "url";
