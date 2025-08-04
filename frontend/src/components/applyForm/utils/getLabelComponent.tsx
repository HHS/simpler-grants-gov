import { FieldLabel } from "src/components/applyForm/widgets/FieldLabel";
import { FieldLabelWithTooltip } from "src/components/applyForm/widgets/FieldLabelWithTooltipWidget";
import { UswdsWidgetProps } from "src/components/applyForm/types";
import {
  RJSFSchema,
  StrictRJSFSchema,
  FormContextType,
} from "@rjsf/utils";

export function getLabelComponent<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  title,
  required,
  description,
  options,
}: Pick<UswdsWidgetProps<T, S, F>, "id" | "title" | "required" | "description" | "options">) {
  const labelType = options?.["widget-label"] || "default";

  switch (labelType) {
    case "tooltip":
      return (
        <FieldLabelWithTooltip
          htmlFor={id}
          label={title ?? ""}
          tooltip={description}
          required={required}
        />
      );

    case "tooltip-none":
      return (
        <label className="usa-label" htmlFor={id}>
          {title}
          {required && (
            <abbr title="required" className="usa-hint usa-hint--required">
              *
            </abbr>
          )}
        </label>
      );

    case "default":
    default:
      return (
        <FieldLabel
          idFor={id}
          title={title}
          description={description}
          required={required}
        />
      );
  }
}
