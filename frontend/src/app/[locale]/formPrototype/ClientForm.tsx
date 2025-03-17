"use client";

import { get as getSchemaObjectFromPointer } from "json-pointer";

import { JSX, useState } from "react";
import { FormGroup, Label, Fieldset, TextInput } from "@trussworks/react-uswds";

interface FormData {
  [key: string]: FormDataEntryValue;
}

interface SetFormDataFunction {
  (data: FormData): void;
}

type uiSchemaType = Record<
  string,
  {
    type: string;
    label?: string;
    children?: uiSchemaType;
    definition?: string;
  }
>;

type SchemaField = {
  type: string;
  title: string;
};

type TextTypes =
  | "text"
  | "email"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "url";

const createTextField = (fieldName: string, title: string, type: TextTypes, parentId: string) => {
  return (
    <div key={`wrapper-for-${fieldName}`} id={parentId}>
      <Label key={`label-for-${fieldName}`} htmlFor={fieldName}>
        {title}
      </Label>
      <TextInput id={fieldName} key={fieldName} type={type} name={title} />
    </div>
  );
};

const wrapSection = (label: string, fieldName: string, tree: JSX.Element) => {
  return (
    <Fieldset key={`${fieldName}-row`}> <FormGroup key={`${fieldName}-group`}>
      <Label htmlFor={`${fieldName}-fields`}>{label}</Label>
      {tree}
  </FormGroup>  </Fieldset>
  );
};

const createField = (fieldName: string, title: string, type: string, parentId: string) => {
  switch (type) {
    case "string":
      return createTextField(fieldName, title, "text",parentId);
      break;
    case "number":
      return createTextField(fieldName, title, type,parentId);
      break;
    default:
      throw new Error(`Error rendering field ${fieldName}`);
  }
};

const parentHasChild = (acc, uiSchema): boolean => {
  // TODO: check JSX elements
  return false;
}

function buildFormTreeClosure(schema: object, uiSchema: object, formData: FormData) {
  let acc: JSX.Element | JSX.Element[] = <></>;

  const buildFormTree = (
    uiSchema: uiSchemaType,
    parent: {label: string, name: string} | null,
  ) => {
    if (typeof uiSchema === 'object' && uiSchema.children) {
      buildFormTree(uiSchema.children, {label: uiSchema.label, name: uiSchema.name});
    }
    else if (Array.isArray(uiSchema)) {
      for (const i in uiSchema) {
        if (uiSchema[i].children) {
          buildFormTree(uiSchema[i].children, {label: uiSchema[i].label, name: uiSchema[i].name});
        }
      }
      if (parent) {
        const row = uiSchema.map((node) => {
          if (node.children) {
            // TODO: test
            return acc;
          }
          else {
            const { definition } = node as { definition: string };
            const name = definition?.split('/')[2];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const { title, type } = getSchemaObjectFromPointer(
              schema,
              definition,
            ) as SchemaField;
            const field = createField(name, title, type, `${parent.name}-fields`);
            return field;
          }
        });
        acc = parentHasChild(acc, uiSchema) ?  wrapSection(parent.label, parent.name, row) : [acc,wrapSection(parent.label, parent.name, row)];  
      }
    }
  }
  buildFormTree(uiSchema, null);
  return acc;
}

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

const ClientForm = ({
  schema,
  uiSchema,
}: {
  schema: object;
  uiSchema: object;
}) => {
  const [formData, setFormData] = useState({});
  const fields = buildFormTreeClosure(schema, uiSchema as uiSchemaType, formData);
  return (
    <form onChange={handleSubmit(setFormData)}>
      <FormGroup>{fields}</FormGroup>
    </form>
  );
};

export default ClientForm;
