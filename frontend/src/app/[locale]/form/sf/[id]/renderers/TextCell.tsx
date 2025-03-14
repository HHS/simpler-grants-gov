import {
  CellProps,
  isStringControl,
  RankedTester,
  rankWith,
} from "@jsonforms/core";
import { withJsonFormsCellProps } from "@jsonforms/react";
import merge from "lodash/merge";

import React from "react";

interface WithClassname {
  className?: string;
}

interface VanillaRendererProps extends WithClassname {
  classNames?: { [className: string]: string };
  /**
   * Returns all classes associated with the given style.
   * @param {string} string the style name
   * @param args any additional args necessary to calculate the classes
   * @returns {string[]} array of class names
   */
  getStyle?(string: string, ...args: any[]): string[];

  /**
   * Returns all classes associated with the given style as a single class name.
   * @param {string} string the style name
   * @param args any additional args necessary to calculate the classes
   * @returns {string[]} array of class names
   */
  getStyleAsClassName?(string: string, ...args: any[]): string;
}

const withVanillaCellPropsForType = () => (Component: ComponentType<any>) =>
  function WithVanillaCellPropsForType(props: any) {
    const inputClassName = ["validate"].concat(
      props.isValid ? "valid" : "invalid",
    );

    return <Component {...props} className={inputClassName.join(" ")} />;
  };

const withVanillaCellProps = withVanillaCellPropsForType("control.input");

export const TextCell = (props: CellProps & VanillaRendererProps) => {
  const { data, className, id, enabled, uischema, schema, path, handleChange } =
    props;
  const maxLength = schema.maxLength;
  const appliedUiSchemaOptions = merge({}, uischema.options);
  return (
    <>
      <h3>wtf</h3>
      <input
        type={
          appliedUiSchemaOptions.format === "password" ? "password" : "text"
        }
        value={data || ""}
        onChange={(ev) =>
          handleChange(
            path,
            ev.target.value === "" ? undefined : ev.target.value,
          )
        }
        className={className}
        id={id}
        disabled={!enabled}
        autoFocus={appliedUiSchemaOptions.focus}
        placeholder={appliedUiSchemaOptions.placeholder}
        maxLength={appliedUiSchemaOptions.restrict ? maxLength : undefined}
        size={appliedUiSchemaOptions.trim ? maxLength : undefined}
      />
    </>
  );
};

/**
 * Default tester for text-based/string controls.
 * @type {RankedTester}
 */
export const textCellTester: RankedTester = rankWith(1, isStringControl);

export default withJsonFormsCellProps(TextCell);
