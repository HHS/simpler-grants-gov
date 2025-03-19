import { get as getSchemaObjectFromPointer } from "json-pointer";

import { JSX } from "react";
import {
  Button,
  Fieldset,
  FormGroup,
  Label,
  Textarea,
  TextInput,
} from "@trussworks/react-uswds";

interface FormData {
  [key: string]: FormDataEntryValue;
}

interface SetFormDataFunction {
  (data: FormData): void;
}

interface UiSchemaField {
  type: "field";
  definition: string;
}

interface UiSchemaSection {
  type: "section";
  label: string;
  name: string;
  number: string;
  children: (UiSchemaField | UiSchemaSection)[];
}

type UiSchema =
  | (UiSchemaField | UiSchemaSection)
  | (UiSchemaField | UiSchemaSection)[];

type SchemaField = {
  type: string;
  title: string;
  minLength?: number;
  maxLength?: number;
  format?: string;
};

interface FormSchema {
  title: string;
  description?: string;
  properties: [SchemaField];
  required: [string];
}

type TextTypes =
  | "text"
  | "email"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "url";

const createFieldLabel = (
  fieldName: string,
  title: string,
  required: boolean,
) => {
  return (
    <Label key={`label-for-${fieldName}`} htmlFor={fieldName}>
      {title}
      {required && (
        <span className="usa-hint usa-hint--required text-no-underline">*</span>
      )}
    </Label>
  );
};

const createTextInputField = (
  fieldName: string,
  title: string,
  type: TextTypes,
  parentId: string,
  required = false,
  minLength: number | null = null,
  maxLength: number | null = null,
) => {
  const label = createFieldLabel(fieldName, title, required);
  return (
    <div key={`wrapper-for-${fieldName}`} id={parentId}>
      {label}
      <TextInput
        minLength={minLength ?? undefined}
        maxLength={maxLength ?? undefined}
        id={fieldName}
        key={fieldName}
        type={type}
        name={title}
      />
    </div>
  );
};

const createTextAreaField = (
  fieldName: string,
  title: string,
  type: TextTypes,
  parentId: string,
  required = false,
  minLength: number | null = null,
  maxLength: number | null = null,
) => {
  const label = createFieldLabel(fieldName, title, required);
  return (
    <div key={`wrapper-for-${fieldName}`} id={parentId}>
      {label}
      <Textarea
        minLength={minLength ?? undefined}
        maxLength={maxLength ?? undefined}
        id={fieldName}
        key={fieldName}
        name={title}
      />
    </div>
  );
};

const wrapSection = (
  label: string,
  fieldName: string,
  tree: JSX.Element | undefined,
) => {
  return (
    <Fieldset key={`${fieldName}-row`}>
      <FormGroup key={`${fieldName}-group`}>
        <legend
          key={`${fieldName}-legend`}
          className="usa-legend usa-legend--large"
        >
          {label}
        </legend>
        {tree}
      </FormGroup>
    </Fieldset>
  );
};

const createField = (
  fieldName: string,
  title: string,
  type: string,
  format: string | undefined,
  parentId: string,
  required = false,
  minLength: number | null = null,
  maxLength: number | null = null,
) => {
  switch (type) {
    case "string":
      if (maxLength && Number(maxLength) > 255) {
        return createTextAreaField(
          fieldName,
          title,
          type as TextTypes,
          parentId,
          required,
          minLength,
          maxLength,
        );
      }
      type = format === "email" ? "email" : "text";
      return createTextInputField(
        fieldName,
        title,
        type as TextTypes,
        parentId,
        required,
        minLength,
        maxLength,
      );
      break;
    case "number":
      return createTextInputField(
        fieldName,
        title,
        type,
        parentId,
        required,
        minLength,
        maxLength,
      );
      break;
    default:
      throw new Error(`Error rendering field ${fieldName}`);
  }
};

/** 
const parentHasChild = (uiSchema): boolean => {
  return false;
  // const hasChild = uiSchema.find((node) => node.hasOwnProperty("children")) !== undefined ? true : false;
  // console.log("acc", acc, "ui", uiSchema, "parent", parent, "row", row, "child?", hasChild)
  /// return hasChild;
  // TODO: check JSX elements
  // return false;
};
 */

const buildField = (definition: string, schema: FormSchema) => {
  const name = definition.split("/")[2];
  const { title, type, format, minLength, maxLength } =
    getSchemaObjectFromPointer(schema, definition) as SchemaField;

  return createField(
    name,
    title,
    type,
    format,
    `${name}-fields`,
    schema.required.includes(name),
    minLength,
    maxLength,
  );
};

function buildFormTreeClosure(schema: FormSchema, uiSchema: UiSchema) {
  let acc: JSX.Element[] = [];

  const buildFormTree = (
    uiSchema: UiSchema,
    parent: { label: string; name: string } | null,
  ) => {
    if (
      !Array.isArray(uiSchema) &&
      typeof uiSchema === "object" &&
      uiSchema.type === "section"
    ) {
      if (uiSchema.children) {
        buildFormTree(uiSchema.children, {
          label: uiSchema.label,
          name: uiSchema.name,
        });
      }
    } else if (Array.isArray(uiSchema)) {
      uiSchema.forEach((node) => {
        if ("children" in node) {
          buildFormTree(node.children, {
            label: node.label,
            name: node.name,
          });
        } else if (!parent && "definition" in node) {
          acc = [...acc, buildField(node.definition, schema)];
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
            return buildField(definition, schema);
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

/**
 *
 * [{ field: name, rendered: JSX }, { field: name, rendered: JSX }]
 *
 *
 *
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleSubmit =
  (setFormData: SetFormDataFunction): React.FormEventHandler<HTMLFormElement> =>
  (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    event.preventDefault();
    const data: FormData = {};
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    setFormData(data);
  };

const ApplyForm = ({
  schema,
  uiSchema,
}: {
  schema: FormSchema;
  uiSchema: UiSchema;
}) => {
  const fields = buildFormTreeClosure(
    schema,
    uiSchema
  );
  return (
    <form>
      <FormGroup>{fields}</FormGroup>
      <Button type="submit">Submit</Button>
    </form>
  );
};

export default ApplyForm;
