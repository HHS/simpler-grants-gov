"use client";

import clsx from "clsx";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import {
  deleteApiKeyEndpoint,
  deleteApiKeyRequestConfig,
} from "src/services/fetch/fetchers/apiKeyClientHelpers";
import { ApiKey } from "src/types/apiKeyTypes";

import { useTranslations } from "next-intl";
import { RefObject, useCallback, useRef, useState } from "react";
import {
  Button,
  ErrorMessage,
  FormGroup,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
  TextInput,
} from "@trussworks/react-uswds";

import { LoadingButton } from "src/components/LoadingButton";
import SimplerAlert from "src/components/SimplerAlert";
import { SimplerModal } from "src/components/SimplerModal";
import { USWDSIcon } from "src/components/USWDSIcon";

interface ApiKeyModalProps {
  mode: "create" | "edit" | "delete";
  apiKey?: ApiKey; // Required for edit and delete modes
  onApiKeyUpdated: () => void; // Called after successful create, edit, or delete
  triggerButtonProps?: {
    className?: string;
    children?: React.ReactNode;
  };
}

function ApiKeyInput({
  validationError,
  updateApiKeyName,
  defaultValue = "",
  mode,
}: {
  validationError?: string;
  updateApiKeyName: (name: string) => void;
  defaultValue?: string;
  mode: "create" | "edit" | "delete";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `${mode}-api-key-input`;
  const t = useTranslations("ApiDashboard.modal");

  return (
    <FormGroup error={!!validationError}>
      <label htmlFor={inputId}>
        {t.rich("apiKeyNameLabel", {
          required: (chunks) => (
            <span className="usa-hint usa-hint--required">{chunks}</span>
          ),
        })}
      </label>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
      <div className="usa-search usa-search--big" role="search">
        <TextInput
          ref={inputRef}
          className={clsx("usa-input", "maxw-none", {
            "usa-input--error": !!validationError,
          })}
          id={inputId}
          name={`${mode}-api-key`}
          defaultValue={defaultValue}
          onChange={(e) => updateApiKeyName(e.target?.value)}
          type="text"
          required
          aria-required
          placeholder={mode === "create" ? t("placeholder") : undefined}
        />
      </div>
    </FormGroup>
  );
}

function DeleteConfirmationInput({
  validationError,
  updateDeleteConfirmation,
}: {
  validationError?: string;
  updateDeleteConfirmation: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = "delete-confirmation-input";
  const t = useTranslations("ApiDashboard.modal");

  return (
    <FormGroup error={!!validationError}>
      <label htmlFor={inputId}>
        {t.rich("deleteConfirmationLabel", {
          required: (chunks) => (
            <span className="usa-hint usa-hint--required">{chunks}</span>
          ),
        })}
      </label>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
      <div className="usa-search usa-search--big" role="search">
        <TextInput
          ref={inputRef}
          className={clsx("usa-input", "maxw-none", {
            "usa-input--error": !!validationError,
          })}
          id={inputId}
          name="delete-confirmation"
          onChange={(e) => updateDeleteConfirmation(e.target?.value)}
          type="text"
          required
          aria-required
          placeholder={t("deleteConfirmationPlaceholder")}
        />
      </div>
    </FormGroup>
  );
}

function SuccessContent({
  modalRef,
  modalId,
  onClose,
  mode,
  keyName,
  originalName,
}: {
  modalRef: RefObject<ModalRef | null>;
  modalId: string;
  onClose: () => void;
  mode: "create" | "edit" | "delete";
  keyName: string;
  originalName?: string;
}) {
  const isCreate = mode === "create";
  const isDelete = mode === "delete";
  const t = useTranslations("ApiDashboard.modal");

  let heading: string;
  if (isCreate) {
    heading = t("createSuccessHeading");
  } else if (isDelete) {
    heading = t("deleteSuccessHeading");
  } else {
    heading = t("editSuccessHeading");
  }

  let message: string;
  if (isCreate) {
    message = t("createSuccessMessage", { keyName });
  } else if (isDelete) {
    message = t("deleteSuccessMessage", { keyName });
  } else {
    message = t("editSuccessMessage", { originalName, keyName });
  }

  return (
    <>
      <ModalHeading id={`${modalId}-heading`}>{heading}</ModalHeading>
      <p>{message}</p>
      <ModalFooter>
        <ModalToggleButton
          modalRef={modalRef}
          closer
          onClick={onClose}
          data-testid={`close-${mode}-api-key-modal-button`}
        >
          {t("close")}
        </ModalToggleButton>
      </ModalFooter>
    </>
  );
}

export default function ApiKeyModal({
  mode,
  apiKey,
  onApiKeyUpdated,
  triggerButtonProps = {},
}: ApiKeyModalProps) {
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();
  const t = useTranslations("ApiDashboard.modal");

  const [validationError, setValidationError] = useState<string>();
  const [apiKeyName, setApiKeyName] = useState<string>();
  const [deleteConfirmation, setDeleteConfirmation] = useState<string>();
  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [success, setSuccess] = useState<boolean>();
  const [originalName] = useState(apiKey?.key_name);

  const isCreate = mode === "create";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";

  // Validation for edit and delete modes
  if ((isEdit || isDelete) && !apiKey) {
    throw new Error(`ApiKey is required when mode is '${mode}'`);
  }

  const { clientFetch } = useClientFetch<
    { data: ApiKey } | { message: string }
  >(
    `Error ${isCreate ? "creating" : isEdit ? "renaming" : "deleting"} API key`,
    { authGatedRequest: true },
  );

  const handleSubmit = useCallback(async () => {
    if (isDelete) {
      if (deleteConfirmation?.trim() !== "delete") {
        setValidationError(t("deleteConfirmationError"));
        return;
      }
    } else {
      const nameToSubmit =
        apiKeyName?.trim() || (isEdit ? apiKey?.key_name : "");

      if (!nameToSubmit) {
        setValidationError(t("nameRequiredError"));
        return;
      }

      if (isEdit && nameToSubmit === apiKey?.key_name) {
        setValidationError(t("nameChangedError"));
        return;
      }
    }

    if (!user?.user_id) {
      setApiError(true);
      return;
    }

    try {
      setLoading(true);
      setApiError(false);
      setValidationError(undefined);

      let response;

      if (isDelete) {
        // Delete API call
        response = await clientFetch(
          deleteApiKeyEndpoint(apiKey?.api_key_id ?? ""),
          deleteApiKeyRequestConfig(),
        );
      } else {
        // Create or edit API call
        const nameToSubmit =
          apiKeyName?.trim() || (isEdit ? apiKey?.key_name : "");
        let url: string;
        let method: string;

        if (isCreate) {
          url = "/api/user/api-keys";
          method = "POST";
        } else {
          url = `/api/user/api-keys/${apiKey?.api_key_id ?? ""}`;
          method = "PUT";
        }

        response = await clientFetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key_name: nameToSubmit,
          }),
        });
      }

      if (response && (isDelete || (response as { data: ApiKey }).data)) {
        setSuccess(true);
        onApiKeyUpdated();
      } else {
        console.error("API response missing data:", response);
        setApiError(true);
      }
    } catch (error) {
      setApiError(true);
      console.error(
        `Error ${isCreate ? "creating" : isEdit ? "renaming" : "deleting"} API key:`,
        error,
      );
    } finally {
      setLoading(false);
    }
  }, [
    apiKeyName,
    deleteConfirmation,
    apiKey,
    user?.user_id,
    clientFetch,
    onApiKeyUpdated,
    isCreate,
    isEdit,
    isDelete,
    t,
  ]);

  const onClose = useCallback(() => {
    setValidationError(undefined);
    setApiError(false);
    setLoading(false);
    setSuccess(false);
    setApiKeyName("");
    setDeleteConfirmation("");
  }, []);

  const modalId = isCreate
    ? "create-api-key"
    : isEdit
      ? `edit-api-key-${apiKey?.api_key_id ?? "unknown"}`
      : `delete-api-key-${apiKey?.api_key_id ?? "unknown"}`;

  let titleText: string | undefined;
  if (success) {
    titleText = undefined;
  } else if (isCreate) {
    titleText = t("createTitle");
  } else if (isEdit) {
    titleText = t("editTitle", { keyName: apiKey?.key_name ?? "" });
  } else {
    titleText = t("deleteTitle");
  }

  // Default trigger button configurations
  const defaultTriggerProps = {
    create: {
      className: "usa-button",
      children: (
        <>
          <USWDSIcon
            className="usa-icon margin-right-05"
            name="add_circle_outline"
          />
          {t("createButtonText")}
        </>
      ),
      "data-testid": "open-create-api-key-modal-button",
    },
    edit: {
      className: "padding-1 hover:bg-base-lightest",
      children: (
        <>
          <USWDSIcon name="edit" className="margin-right-05" />
          {t("editNameButtonText")}
        </>
      ),
      unstyled: true,
      "data-testid": `open-edit-api-key-modal-button-${apiKey?.api_key_id ?? "unknown"}`,
    },
    delete: {
      className: "padding-1 hover:bg-base-lightest",
      children: (
        <>
          <USWDSIcon className="usa-icon margin-right-05" name="delete" />
          {t("deleteButtonText")}
        </>
      ),
      unstyled: true,
      title: t("deleteTitle"),
      "data-testid": `open-delete-api-key-modal-button-${apiKey?.api_key_id ?? "unknown"}`,
    },
  };

  const finalTriggerProps = {
    ...defaultTriggerProps[mode],
    ...triggerButtonProps,
  };

  return (
    <>
      <ModalToggleButton
        modalRef={modalRef}
        opener
        type="button"
        {...finalTriggerProps}
      />

      <SimplerModal
        modalRef={modalRef}
        className="text-wrap"
        modalId={modalId}
        titleText={titleText}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit().catch(console.error);
        }}
        onClose={onClose}
      >
        {success ? (
          <SuccessContent
            modalRef={modalRef}
            modalId={modalId}
            onClose={onClose}
            mode={mode}
            keyName={apiKeyName || apiKey?.key_name || ""}
            originalName={originalName}
          />
        ) : (
          <>
            {isDelete ? (
              <>
                <p>{t("deleteDescription")}</p>
                <p className="font-sans-md text-bold margin-y-2">
                  &quot;{apiKey?.key_name}&quot;
                </p>
              </>
            ) : (
              <p>{isCreate ? t("createDescription") : t("editDescription")}</p>
            )}

            {apiError && (
              <SimplerAlert
                alertClick={() => setApiError(false)}
                buttonId="apiKeyModalApiError"
                messageText={
                  isCreate
                    ? t("createErrorMessage")
                    : isEdit
                      ? t("editErrorMessage")
                      : t("deleteErrorMessage")
                }
                type="error"
              />
            )}

            {isDelete ? (
              <DeleteConfirmationInput
                validationError={validationError}
                updateDeleteConfirmation={setDeleteConfirmation}
              />
            ) : (
              <ApiKeyInput
                validationError={validationError}
                updateApiKeyName={setApiKeyName}
                defaultValue={isEdit ? apiKey?.key_name : ""}
                mode={mode}
              />
            )}

            <ModalFooter>
              {loading ? (
                <LoadingButton
                  id={`${mode}-api-key-button`}
                  message={
                    isCreate
                      ? t("creating")
                      : isEdit
                        ? t("saving")
                        : t("deleting")
                  }
                />
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => {
                      handleSubmit().catch(console.error);
                    }}
                    data-testid={`${mode}-api-key-submit-button`}
                  >
                    {isCreate
                      ? t("createButtonText")
                      : isEdit
                        ? t("saveChanges")
                        : t("deleteButtonText")}
                  </Button>
                  <ModalToggleButton
                    modalRef={modalRef}
                    closer
                    unstyled
                    className="padding-105 text-center"
                    onClick={onClose}
                  >
                    {t("cancel")}
                  </ModalToggleButton>
                </>
              )}
            </ModalFooter>
          </>
        )}
      </SimplerModal>
    </>
  );
}
