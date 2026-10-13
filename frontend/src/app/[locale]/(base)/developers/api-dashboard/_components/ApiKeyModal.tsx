"use client";

import clsx from "clsx";
import {
  ClientFetchErrorCause,
  useClientFetch,
} from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import {
  deleteApiKeyEndpoint,
  deleteApiKeyRequestConfig,
} from "src/services/fetch/fetchers/apiKeyClientHelpers";
import { ApiKey } from "src/types/apiKeyTypes";

import { useTranslations } from "next-intl";
import { RefObject, useCallback, useRef, useState } from "react";
import {
  Alert,
  Button,
  ErrorMessage,
  FormGroup,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
  TextInput,
} from "@trussworks/react-uswds";

import { LoadingButton } from "src/components/core/LoadingButton";
import SimplerAlert from "src/components/core/SimplerAlert";
import { SimplerModal } from "src/components/core/SimplerModal";
import Spinner from "src/components/core/Spinner";
import { USWDSIcon } from "src/components/core/USWDSIcon";

// matches ValidationErrorType.DUPLICATE_API_KEY_NAME in the API
const DUPLICATE_API_KEY_NAME_ERROR = "duplicate_api_key_name";

const isDuplicateNameError = (error: unknown) => {
  const cause = (error as Error)?.cause as ClientFetchErrorCause | undefined;
  const body = cause?.body as { errorType?: string } | undefined;
  return body?.errorType === DUPLICATE_API_KEY_NAME_ERROR;
};

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
        />
      </div>
    </FormGroup>
  );
}

function CreateApiKeyInput({
  validationError,
  updateApiKeyName,
}: {
  validationError?: string;
  updateApiKeyName: (name: string) => void;
}) {
  const inputId = "create-api-key-input";
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const t = useTranslations("ApiDashboard.modal");

  return (
    <FormGroup error={!!validationError}>
      <label className="usa-label" htmlFor={inputId}>
        {t.rich("createApiKeyNameLabel", {
          required: (chunks) => (
            <span className="usa-hint usa-hint--required">{chunks}</span>
          ),
        })}
      </label>
      <span className="usa-hint" id={hintId}>
        {t("createNameHint")}
      </span>
      {validationError && (
        <ErrorMessage id={errorId}>{validationError}</ErrorMessage>
      )}
      <TextInput
        id={inputId}
        name="create-api-key"
        onChange={(e) => updateApiKeyName(e.target?.value)}
        type="text"
        required
        aria-required
        aria-describedby={clsx(hintId, { [errorId]: !!validationError })}
        validationStatus={validationError ? "error" : undefined}
      />
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

function CopyKeyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("ApiDashboard.modal");

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (e) {
      console.error("Error copying to clipboard", e);
    }
  };

  return (
    <>
      <Button
        type="button"
        className="margin-top-1 margin-right-0 padding-x-2"
        data-testid="copy-api-key-button"
        onClick={() => {
          void copyToClipboard();
        }}
      >
        <USWDSIcon
          className="usa-icon margin-right-05"
          name={copied ? "check" : "content_copy"}
        />
        {/* min width keeps the button from shrinking when showing "Copied" */}
        <span className="display-inline-block minw-10 text-left">
          {copied ? t("copied") : t("copyKey")}
        </span>
      </Button>
      <span className="usa-sr-only" role="status">
        {copied ? t("copied") : ""}
      </span>
    </>
  );
}

function CreateSuccessContent({
  modalRef,
  modalId,
  onClose,
  keyName,
  apiKeyId,
}: {
  modalRef: RefObject<ModalRef | null>;
  modalId: string;
  onClose: () => void;
  keyName: string;
  apiKeyId: string;
}) {
  const t = useTranslations("ApiDashboard.modal");
  const keyInputId = "created-api-key";

  return (
    <>
      <ModalHeading id={`${modalId}-heading`}>
        {t("createSuccessHeading")}
      </ModalHeading>
      <Alert
        type="warning"
        headingLevel="h3"
        heading={t("createSuccessAlertHeading")}
        className="margin-top-2"
      >
        {t("createSuccessAlertMessage")}
      </Alert>
      <p>
        {t.rich("createSuccessKeyName", {
          keyName,
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
      <div className="grid-row">
        <div className="grid-col-12 mobile-lg:grid-col-fill">
          <label className="usa-sr-only" htmlFor={keyInputId}>
            {t("createdApiKeyLabel")}
          </label>
          <TextInput
            id={keyInputId}
            name={keyInputId}
            type="text"
            className="maxw-none"
            value={apiKeyId}
            readOnly
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div className="grid-col-12 mobile-lg:grid-col-auto mobile-lg:padding-left-1">
          <CopyKeyButton content={apiKeyId} />
        </div>
      </div>
      <ModalFooter>
        <ModalToggleButton
          modalRef={modalRef}
          closer
          secondary
          onClick={onClose}
          data-testid="close-create-api-key-modal-button"
        >
          {t("done")}
        </ModalToggleButton>
      </ModalFooter>
    </>
  );
}

function SuccessContent({
  modalRef,
  modalId,
  onClose,
  mode,
  keyName,
  originalName = "",
}: {
  modalRef: RefObject<ModalRef | null>;
  modalId: string;
  onClose: () => void;
  mode: "edit" | "delete";
  keyName: string;
  originalName?: string;
}) {
  const isDelete = mode === "delete";
  const t = useTranslations("ApiDashboard.modal");
  const heading = isDelete
    ? t("deleteSuccessHeading")
    : t("editSuccessHeading");
  const message = isDelete
    ? t("deleteSuccessMessage", { keyName })
    : t("editSuccessMessage", { originalName, keyName });

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
  const [apiKeyId, setApiKeyId] = useState<string>();
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
        setApiKeyId((response as { data: ApiKey }).data.key_id);
      }

      if (response && (isDelete || (response as { data: ApiKey }).data)) {
        setSuccess(true);
        onApiKeyUpdated();
      } else {
        console.error("API response missing data:", response);
        setApiError(true);
      }
    } catch (error) {
      if (isCreate && isDuplicateNameError(error)) {
        setValidationError(t("duplicateNameError"));
        return;
      }
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
    setApiKeyId(undefined);
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
        <USWDSIcon name="edit" className="usa-icon--size-3 margin-right-05" />
      ),
      unstyled: true,
      "data-testid": `open-edit-api-key-modal-button-${apiKey?.api_key_id ?? "unknown"}`,
    },
    delete: {
      className: "padding-1 hover:bg-base-lightest",
      children: (
        <USWDSIcon className="usa-icon--size-3 margin-right-05" name="delete" />
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
          // the success state has no form to submit
          if (e.key === "Enter" && !success)
            handleSubmit().catch(console.error);
        }}
        onClose={onClose}
      >
        {success && isCreate ? (
          <CreateSuccessContent
            modalRef={modalRef}
            modalId={modalId}
            onClose={onClose}
            keyName={apiKeyName?.trim() || ""}
            apiKeyId={apiKeyId || ""}
          />
        ) : success && !isCreate ? (
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
            {isCreate && apiError && (
              <Alert
                type="error"
                headingLevel="h3"
                heading={t("createErrorHeading")}
                role="alert"
                className="margin-top-2"
              >
                {t("createErrorMessage")}
              </Alert>
            )}

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

            {!isCreate && apiError && (
              <SimplerAlert
                alertClick={() => setApiError(false)}
                buttonId="apiKeyModalApiError"
                messageText={
                  isEdit ? t("editErrorMessage") : t("deleteErrorMessage")
                }
                type="error"
              />
            )}

            {isDelete ? (
              <DeleteConfirmationInput
                validationError={validationError}
                updateDeleteConfirmation={setDeleteConfirmation}
              />
            ) : isCreate ? (
              <CreateApiKeyInput
                validationError={validationError}
                updateApiKeyName={setApiKeyName}
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
              {isCreate ? (
                <>
                  <Button
                    type="button"
                    className="position-relative"
                    disabled={loading}
                    aria-busy={loading}
                    onClick={() => {
                      handleSubmit().catch(console.error);
                    }}
                    data-testid="create-api-key-submit-button"
                  >
                    {/* label stays rendered while loading so the button keeps its size */}
                    <span
                      className={clsx({ "opacity-0": loading })}
                      aria-hidden={loading}
                    >
                      {t("createSubmitButtonText")}
                    </span>
                    {loading && (
                      <span className="position-absolute top-0 bottom-0 left-0 right-0 display-flex flex-justify-center flex-align-center">
                        <Spinner className="margin-0" />
                        <span className="usa-sr-only">{t("creating")}</span>
                      </span>
                    )}
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
              ) : loading ? (
                <LoadingButton
                  id={`${mode}-api-key-button`}
                  message={isEdit ? t("saving") : t("deleting")}
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
                    {isEdit ? t("saveChanges") : t("deleteButtonText")}
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
