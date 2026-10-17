// TEMPORARY COPY of `renderFieldNode` / `RootBudgetFormContext`, which the pending JSON Forms
// renderer work exports from frontend/src/components/apply-form/FormFields.tsx. Today they
// are inline in FormFields, so this rebuilds them from FormFields' own dependencies.
// Delete with the rest of src/vendor/sgg with #12695.
import type { RJSFSchema } from "@rjsf/utils";
import { renderWidget } from "@sgg/frontend/components/apply-form/widgets/WidgetRenderers";
import type {
  FormattedFormValidationWarning,
  UiSchemaField,
  UiSchemaFieldList,
} from "@sgg/frontend/types/applyForm/types";
import { isFieldRequired } from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { getFieldConfig } from "@sgg/frontend/utils/applyForm/getFieldConfig";

export type RootBudgetFormContext = {
  rootSchema: RJSFSchema;
  rootFormData: unknown;
};

/**
 * Renders one field node through the shared widget pipeline: requiredness from the schema,
 * then `getFieldConfig` -> `renderWidget`.
 */
export const renderFieldNode = ({
  node,
  schema,
  errors,
  formData,
  requiredFieldPaths,
  formContext,
  isFormLocked,
  disabled,
}: {
  node: UiSchemaField | UiSchemaFieldList;
  schema: RJSFSchema;
  errors: FormattedFormValidationWarning[] | null;
  formData: object;
  requiredFieldPaths: string[];
  formContext?: RootBudgetFormContext;
  isFormLocked?: boolean;
  disabled?: boolean;
}) => {
  const requiredField =
    node.type === "fieldList"
      ? false
      : isFieldRequired(
          node.definition || node.schema?.title || "",
          requiredFieldPaths,
        );

  const widgetConfig = getFieldConfig({
    uiFieldObject: node,
    formSchema: schema,
    errors: errors ?? null,
    formData,
    requiredField,
  });

  return renderWidget({
    type: widgetConfig.type,
    props: {
      ...widgetConfig.props,
      ...(disabled ? { disabled } : {}),
      formContext,
      isFormLocked,
    },
    definition: "definition" in node ? node.definition : undefined,
  });
};
