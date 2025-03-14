"use client";

import { get as getSchemaObjectFromPointer } from "json-pointer";

import { JSX, useState } from "react";
import { FormGroup, Label, TextInput } from "@trussworks/react-uswds";

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

const createTextField = (fieldName: string, title: string, type: TextTypes) => {
  return (
    <div key={`wrapper-for-${fieldName}`}>
      <Label key={`label-for-${fieldName}`} htmlFor={fieldName}>
        {title}
      </Label>
      <TextInput id={fieldName} key={fieldName} type={type} name={title} />
    </div>
  );
};

const wrapSection = (label: string, fieldName: string, tree: JSX.Element[]) => {
  return (
    <FormGroup className="border-1px padding-2" key={`${fieldName}-row`}>
      <Label htmlFor={fieldName}>{label}</Label>
      {tree.map((field) => field)}
    </FormGroup>
  );
  // return <FormGroup><Label htmlFor={fieldName}>{label}</Label>{tree}</FormGroup>
};

const createField = (fieldName: string, title: string, type: string) => {
  switch (type) {
    case "string":
      return createTextField(fieldName, title, "text");
      break;
    case "number":
      return createTextField(fieldName, title, type);
      break;
    default:
      throw new Error(`Error rendering field ${fieldName}`);
  }
};

const buildFormTree = (
  schema: object,
  uiSchema: uiSchemaType,
  formData: FormData,
  wrap: {
    wrapped: boolean;
    label: string;
    fieldName: string;
    count: number;
  } = {
    wrapped: false,
    label: "",
    fieldName: "",
    count: 0,
  },
  tree: JSX.Element[] = [],
) => {
  for (const fieldName in uiSchema) {
    if (typeof uiSchema[fieldName] === "object") {
      if (uiSchema[fieldName].type === "field") {
        const { definition } = uiSchema[fieldName] as { definition: string };
        const { title, type } = getSchemaObjectFromPointer(
          schema,
          definition,
        ) as SchemaField;
        const field = createField(fieldName, title, type);
        tree.push(field);
      } else if (
        uiSchema[fieldName].type === "section" &&
        uiSchema[fieldName].children
      ) {
        // TODO: sections after rendering fields in separate rec func
        if (wrap.wrapped) {
          const prev = tree.splice(tree.length - wrap.count);
          tree.push(wrapSection(wrap.label, wrap.fieldName, prev));
        }
        wrap.wrapped = true;
        wrap.count = Object.keys(uiSchema[fieldName].children).length;
        wrap.label = uiSchema[fieldName].label ?? "";
        wrap.fieldName = fieldName;
        buildFormTree(
          schema,
          uiSchema[fieldName].children,
          formData,
          wrap,
          tree,
        );
      }
    }
  }
  return tree;
};

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
  const fields = buildFormTree(schema, uiSchema as uiSchemaType, formData);
  return (
    <form onChange={handleSubmit(setFormData)}>
      <FormGroup>{fields.map((field) => field)}</FormGroup>
    </form>
  );
};

export default ClientForm;
