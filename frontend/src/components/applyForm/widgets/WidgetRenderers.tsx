import { omit } from "lodash";

import { JSX } from "react";

import {
  DefinitionPath,
  UswdsWidgetProps,
  WidgetTypes,
} from "src/components/applyForm/types";
import { FieldsetWidget } from "./FieldsetWidget";
import { widgetComponents } from "./Widgets";

export const wrapSection = ({
  label,
  fieldName,
  tree,
  description,
}: {
  label: string;
  fieldName: string;
  tree: JSX.Element | undefined;
  description?: string;
}) => {
  const uniqueKey = `${fieldName}-fieldset`;
  return (
    <FieldsetWidget
      key={uniqueKey}
      fieldName={fieldName}
      label={label}
      description={description}
    >
      {tree}
    </FieldsetWidget>
  );
};

export function renderWidget<V>({
  type,
  props,
  definition,
}: {
  type: WidgetTypes;
  props: UswdsWidgetProps<V>;
  definition?: DefinitionPath;
}) {
  const Widget = widgetComponents[type];

  // light debugging for unknown widgets
  if (typeof Widget !== "function") {
    console.error(`Unknown widget type: ${type}`, definition);
    throw new Error(`Unknown widget type: ${type}`);
  }
  if (props.isFormLocked) {
    props.disabled = true;
  }

  // key prop can't be spread due to React internal rules
  const key = props.key as string;
  const spreadProps = omit(props, "key") as UswdsWidgetProps;
  return <Widget key={key} {...spreadProps} />;
}
