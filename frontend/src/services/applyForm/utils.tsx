import {
    FormSchema,
    SchemaField,
    TextTypes,
    UiSchema,
  } from "./types";

import { createTextAreaField, createTextInputField, wrapSection } from "./fields";

import { get as getSchemaObjectFromPointer } from "json-pointer";

import { JSX } from "react";


export function buildFormTreeClosure(schema: FormSchema, uiSchema: UiSchema) {
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
  export const buildField = (definition: string, schema: FormSchema) => {
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