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
  fieldListLabel?: string;
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
  | "FieldList"
  | "Table";

type PropertyPath = `/properties/${string}`;

export type DefinitionPath = PropertyPath | PropertyPath[];

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
 * additionalDescribedById
 *   Optional accessibility identifier used to associate widgets rendered
 *   inside a FieldList entry with that entry's heading. This allows
 *   assistive technologies to announce both the field label and the
 *   entry context (for example "Street 1, Additional Location 3").
 *
 * groupDefinition
 *   Describes the fields that appear in each repeatable row.
 *
 * value
 *   The current array of row values for the FieldList.
 *
 * minItems / maxItems
 *   Constraints controlling the minimum and maximum number of entries
 *   that can be rendered and submitted.
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
 * markFormDirty callback used by widgets (e.g. FieldList) to notify the parent form
 * that a user interaction has modified form state.
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
  additionalDescribedById?: string;
  name: string;
  minItems?: number;
  minItemsHeading?: string;
  minItemsHelperText?: string;
  maxItemsHeading?: string;
  maxItemsHelperText?: string;
  maxItems?: number;
  groupDefinition: FieldListGroupItem[];
  rawErrors?: FormattedFormValidationWarning[];
  requiredFields?: string[];
  value?: GeneralRecord[];
  onChange?: UswdsWidgetProps["onChange"];
  disabled?: boolean;
  readOnly?: boolean;
  isFormLocked?: boolean;
  formContext?: {
    rootSchema?: RJSFSchema;
    rootFormData?: unknown;
    widgetSupport?: {
      validationWarnings?:
        | FormattedFormValidationWarning[]
        | FormValidationWarning[];
      deletedEntryIndexesByFieldListPath?: Record<string, number[]>;
      onFieldListEntryDelete?: (
        fieldListPath: string,
        deletedEntryIndex: number,
      ) => void;
      markFormDirty?: () => void;
    };
  };
};

export type FieldListChildWidgetTypes = Exclude<
  WidgetTypes,
  "FieldList" | "Table"
>;

/**
 * Configuration for a single child field rendered within a FieldList entry.
 *
 * baseId
 *   Template id containing the entry index placeholder. The placeholder
 *   is replaced at render time with the actual entry index.
 *
 * storagePath
 *   Path used to read and write values within the entry object. Supports
 *   nested object structures such as:
 *
 *     address.street1
 *     address.city
 *     address.country
 */

export type FieldListGroupItem = {
  widget: FieldListChildWidgetTypes;
  generalProps: Omit<UswdsWidgetProps, "id" | "value" | "key">;
  baseId: string;
  definition: string;
  storagePath: string[];
};

export type UiSchemaTableCellType = "input" | "readOnly" | "plainText";

export type UiSchemaTableColumn = {
  columnHeader: string;

  /**
   * Optional column width as a percentage.
   * Configured column widths cannot total more than 100.
   */
  width?: number;
};

export type UiSchemaTableCell =
  | {
      type: "input" | "readOnly";
      definition: PropertyPath;
      staticContent?: undefined;
    }
  | {
      type: "plainText";
      staticContent: string;
      definition?: undefined;
    };

export type UiSchemaTableRow = {
  /**
   * Cells rendered in the same order as the configured table columns.
   *
   * Each row must contain one cell for every configured column.
   */
  cells: UiSchemaTableCell[];
};

export type UiSchemaTableChildren = {
  columns: UiSchemaTableColumn[];
  rows: UiSchemaTableRow[];
};

export type TableWidgetProps = {
  id: string;
  key: string;
  name?: string;
  label?: string;
  description?: string;
  uiSchemaField: UiSchemaTableMultiField;
};

type UiSchemaBasicField = {
  type: "field" | "null";
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

/**
 * Existing specialized multiField widgets retain their flat definition array.
 * Table uses the same definition-backed multiField contract while `children`
 * describes the Table widget's column, row, and cell layout.
 */
type UiSchemaMultiField = {
  type: "multiField";
  widget?: Exclude<WidgetTypes, "Table">;
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

export type UiSchemaTableMultiField = {
  type: "multiField";
  widget: "Table";
  name: string;
  definition: PropertyPath[];
  children: UiSchemaTableChildren;
  schema?: undefined;
};

export type UiSchemaField =
  | UiSchemaBasicField
  | UiSchemaMultiField
  | UiSchemaTableMultiField;

export interface UiSchemaSection {
  type: "section";
  label: string;
  name: string;
  children: UiSchema;
  description?: string;
}

/**
 * Optional accessibility identifier applied to widgets rendered within
 * each FieldList entry so child inputs can reference their entry heading.
 */

export interface UiSchemaFieldList {
  type: "fieldList";
  label: string;
  minItemsHeading?: string;
  minItemsHelperText?: string;
  maxItemsHeading?: string;
  maxItemsHelperText?: string;
  name: string;
  description?: string;
  additionalDescribedById?: string;
  children: Exclude<UiSchemaField, UiSchemaTableMultiField>[];
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
  uiSchemaField?: UiSchemaField;
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
  additionalDescribedById?: string;
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
    widgetSupport?: {
      validationWarnings?:
        | FormattedFormValidationWarning[]
        | FormValidationWarning[];
      deletedEntryIndexesByFieldListPath?: Record<string, number[]>;
      onFieldListEntryDelete?: (
        fieldListPath: string,
        deletedEntryIndex: number,
      ) => void;
      markFormDirty?: () => void;
    };
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
