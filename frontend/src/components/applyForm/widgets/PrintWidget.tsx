import { FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";

import { FormGroup } from "@trussworks/react-uswds";

import { UswdsWidgetProps } from "src/components/applyForm/types";

function PrintWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = never,
>({
  id,
  required,
  schema,
  value,
  formClassName,
  inputClassName,
}: UswdsWidgetProps<T, S, F>) {
  const { title } = schema as S;

  return (
    <FormGroup className={formClassName} key={`form-group__text-input--${id}`}>
      <div className="text-bold">
        {title}
        {required && (
          <span className="usa-hint usa-hint--required text-no-underline">
            *
          </span>
        )}
      </div>
      <div data-testid={id} className={inputClassName} id={id} key={id}>
        {(value as string) ?? ""}
      </div>
    </FormGroup>
  );
}

export default PrintWidget;
