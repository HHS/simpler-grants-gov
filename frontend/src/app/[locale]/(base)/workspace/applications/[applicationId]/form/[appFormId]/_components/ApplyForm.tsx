"use client";

import { RJSFSchema } from "@rjsf/utils";
import { isEmpty } from "lodash";
import { useFormStatus } from "react-dom";
import { handleFormAction } from "src/app/[locale]/(base)/workspace/applications/[applicationId]/form/[appFormId]/actions";
import { AttachmentsProvider } from "src/hooks/ApplicationAttachments";
import {
  FormattedFormValidationWarning,
  FormValidationWarning,
  UiSchema,
} from "src/types/applyForm/types";
import { Attachment } from "src/types/attachmentTypes";
import { getFieldsForNav } from "src/utils/applyForm/applyFormUtils";
import { rebaseFieldListWarningsAfterDelete } from "src/utils/applyForm/rebaseFieldListWarningsAfterDelete";

import { useTranslations } from "next-intl";
import { useNavigationGuard } from "next-navigation-guard";
import { useRouter } from "next/navigation";
import { ReactNode, useActionState, useEffect, useMemo, useState } from "react";
import { Alert, Button, ButtonGroup, FormGroup } from "@trussworks/react-uswds";

import { FormFields } from "src/components/apply-form/FormFields";
import LeftHandFormNav from "src/components/core/forms/LeftHandFormNav";
import { ApplyFormMessage } from "./ApplyFormMessage";

type Translator = ((
  key: string,
  values?: Record<string, unknown>,
) => string) & {
  rich: (
    key: string,
    values: Record<string, (chunks: ReactNode) => ReactNode>,
  ) => ReactNode;
};

interface WidgetSupport {
  validationWarnings:
    | FormattedFormValidationWarning[]
    | FormValidationWarning[];
  deletedEntryIndexesByFieldListPath: Record<string, number[]>;
  onFieldListEntryDelete: (
    fieldListPath: string,
    deletedEntryIndex: number,
  ) => void;
  markFormDirty?: () => void;
}

interface ApplyFormFormContext {
  rootSchema: RJSFSchema;
  rootFormData: unknown;
  widgetSupport: WidgetSupport;
}

const FormActionButtons = ({
  applicationId,
  onSaveClick,
}: {
  applicationId: string;
  onSaveClick: () => void;
}) => {
  const { pending } = useFormStatus();
  const router = useRouter();

  const handleReturnToApplication = () => {
    router.push(`/workspace/applications/${applicationId}`);
  };
  return (
    <ButtonGroup
      className="apply-form__action-buttons display-flex flex-align-center flex-justify"
      style={{ gap: "24px" }}
    >
      <Button
        data-testid="apply-form-save"
        type="submit"
        name="apply-form-button"
        className="margin-top-05 flex-1"
        value="save"
        onClick={onSaveClick}
      >
        {pending ? "Saving..." : "Save and refresh"}
      </Button>
      <Button
        type="button"
        outline
        className="margin-top-0 flex-1"
        data-testid="apply-form-return"
        onClick={handleReturnToApplication}
      >
        Return to application
      </Button>
    </ButtonGroup>
  );
};

const ApplyForm = ({
  applicationId,
  formId,
  formSchema,
  savedFormData,
  validationWarnings,
  uiSchema,
  attachments,
  isBudgetForm = false,
  applicationStatus,
  createdAt,
  updatedAt,
}: {
  applicationId: string;
  formId: string;
  formSchema: RJSFSchema;
  savedFormData: object;
  uiSchema: UiSchema;
  validationWarnings:
    | FormattedFormValidationWarning[]
    | FormValidationWarning[]
    | null;
  attachments: Attachment[];
  isBudgetForm?: boolean;
  applicationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}) => {
  const t = useTranslations("Application.applyForm");
  const translate = t as unknown as Translator;
  const isFormLocked = applicationStatus !== "in_progress";

  const timestampsEqual = (a?: string, b?: string): boolean => {
    if (!a || !b) return false;
    const at = new Date(a).getTime();
    const bt = new Date(b).getTime();
    return Number.isFinite(at) && Number.isFinite(bt) && at === bt;
  };

  const lastUpdatedAt = updatedAt || createdAt;

  const formStatus =
    updatedAt && !timestampsEqual(updatedAt, createdAt) ? "updated" : "created";

  const isFormSaved = Boolean(lastUpdatedAt);

  const formatLastUpdatedTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const required = translate.rich("required", {
    abr: (content) => (
      <abbr
        title="required"
        className="usa-hint usa-hint--required text-no-underline"
      >
        {content}
      </abbr>
    ),
  });

  const [formState, formAction] = useActionState(handleFormAction, {
    applicationId,
    error: false,
    formId,
    formData: new FormData(),
    saved: false,
  });

  const [formChanged, setFormChanged] = useState<boolean>(false);
  const [attachmentsChanged, setAttachmentsChanged] = useState<boolean>(false);
  const [
    deletedEntryIndexesByFieldListPath,
    setDeletedEntryIndexesByFieldListPath,
  ] = useState<Record<string, number[]>>({});

  useNavigationGuard({
    enabled: formChanged || attachmentsChanged,
    confirm: () => window.confirm(translate("unsavedChangesWarning")),
  });

  const { error, saved } = formState;

  /**
   * Marks the form as changed.
   *
   * Used by FieldList and other widgets to signal that local form state
   * has been modified, enabling unsaved-change indicators and navigation guards.
   */
  const handleFormEdited = (): void => {
    setFormChanged(true);
  };

  const handleFieldListEntryDelete = (
    fieldListPath: string,
    deletedEntryIndex: number,
  ): void => {
    setDeletedEntryIndexesByFieldListPath((previousValue) => ({
      ...previousValue,
      [fieldListPath]: [
        ...(previousValue[fieldListPath] ?? []),
        deletedEntryIndex,
      ],
    }));
  };

  const formObject = useMemo(
    () => savedFormData || new FormData(),
    [savedFormData],
  );

  const navFields = useMemo(() => getFieldsForNav(uiSchema), [uiSchema]);

  const displayValidationWarnings = useMemo(() => {
    if (!validationWarnings) {
      return null;
    }

    return Object.entries(deletedEntryIndexesByFieldListPath).reduce<
      FormattedFormValidationWarning[] | FormValidationWarning[] | null
    >((currentWarnings, [fieldListPath, deletedEntryIndexes]) => {
      return deletedEntryIndexes.reduce<
        FormattedFormValidationWarning[] | FormValidationWarning[] | null
      >((rebasedWarnings, deletedEntryIndex) => {
        return rebaseFieldListWarningsAfterDelete({
          rawErrors: rebasedWarnings as FormattedFormValidationWarning[] | null,
          fieldListPath,
          deletedEntryIndex,
        });
      }, currentWarnings);
    }, validationWarnings);
  }, [validationWarnings, deletedEntryIndexesByFieldListPath]);

  const formContextValue = useMemo<ApplyFormFormContext>(
    () => ({
      rootSchema: formSchema,
      rootFormData: formObject,
      widgetSupport: {
        validationWarnings: displayValidationWarnings ?? [],
        deletedEntryIndexesByFieldListPath,
        onFieldListEntryDelete: handleFieldListEntryDelete,
        markFormDirty: handleFormEdited,
      },
    }),
    [
      deletedEntryIndexesByFieldListPath,
      displayValidationWarnings,
      formObject,
      formSchema,
    ],
  );

  useEffect(() => {
    // TODO #9633
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeletedEntryIndexesByFieldListPath({});
  }, [savedFormData, validationWarnings]);

  if (!formSchema || !formSchema.properties || isEmpty(formSchema.properties)) {
    return (
      <Alert data-testid="alert" type="error" heading="Error" headingLevel="h4">
        Error rendering form
      </Alert>
    );
  }

  return (
    <form
      className="flex-1 margin-top-2 simpler-apply-form"
      action={formAction}
      onChange={() => {
        setFormChanged(true);
      }}
      noValidate
    >
      <div className="display-flex flex-align-center flex-justify margin-bottom-2">
        <div>
          {required}
          {isFormSaved && lastUpdatedAt && (
            <div className="margin-top-1">
              {formStatus === "updated"
                ? `This form was last updated on ${formatLastUpdatedTime(lastUpdatedAt)}`
                : `This form was created on ${formatLastUpdatedTime(lastUpdatedAt)}`}
            </div>
          )}
        </div>
        {!isFormLocked && (
          <FormActionButtons
            applicationId={applicationId}
            onSaveClick={() => {
              setFormChanged(false);
              setAttachmentsChanged(false);
            }}
          />
        )}
      </div>
      <div className="usa-in-page-nav-container">
        <FormGroup className="order-2 width-full">
          <ApplyFormMessage
            saved={saved}
            error={error}
            validationWarnings={
              displayValidationWarnings as
                | FormattedFormValidationWarning[]
                | null
            }
            isBudgetForm={isBudgetForm}
          />
          <AttachmentsProvider
            value={{ attachments: attachments ?? [], setAttachmentsChanged }}
          >
            <FormFields
              key={saved ? "after-save" : "before-save"}
              errors={
                saved
                  ? (displayValidationWarnings as
                      | FormattedFormValidationWarning[]
                      | null)
                  : null
              }
              formData={formObject}
              schema={formSchema}
              uiSchema={uiSchema}
              formContext={formContextValue}
              isFormLocked={isFormLocked}
            />
          </AttachmentsProvider>
        </FormGroup>
        <LeftHandFormNav title={translate("navTitle")} fields={navFields} />
      </div>
    </form>
  );
};

export default ApplyForm;
