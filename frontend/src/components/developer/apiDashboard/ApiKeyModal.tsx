"use client";

import clsx from "clsx";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";

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
import { ApiKey } from "src/types/apiTypes";

interface ApiKeyModalProps {
  mode: "create" | "edit";
  apiKey?: ApiKey; // Required for edit mode
  onApiKeyUpdated: () => void; // Called after successful create or edit
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
  mode: "create" | "edit";
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
  mode: "create" | "edit";
  keyName: string;
  originalName?: string;
}) {
  const isCreate = mode === "create";
  const t = useTranslations("ApiDashboard.modal");
  const heading = isCreate ? t("createSuccessHeading") : t("editSuccessHeading");
  
  let message: string;
  if (isCreate) {
    message = t("createSuccessMessage", { keyName });
  } else {
    message = t("editSuccessMessage", { originalName, keyName });
  }

  return (
    <>
      <ModalHeading id={`${modalId}-heading`}>
        {heading}
      </ModalHeading>
      <SimplerAlert
        type="success"
        buttonId="success-alert-close"
        messageText={message}
        alertClick={onClose}
      />
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
  triggerButtonProps = {}
}: ApiKeyModalProps) {
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();
  const t = useTranslations("ApiDashboard.modal");

  const [validationError, setValidationError] = useState<string>();
  const [apiKeyName, setApiKeyName] = useState<string>();
  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [success, setSuccess] = useState<boolean>();
  const [originalName] = useState(apiKey?.key_name);

  const isCreate = mode === "create";
  const isEdit = mode === "edit";

  // Validation for edit mode
  if (isEdit && !apiKey) {
    throw new Error("ApiKey is required when mode is 'edit'");
  }

  const { clientFetch } = useClientFetch<{ data: any }>(
    `Error ${isCreate ? 'creating' : 'renaming'} API key`,
    { authGatedRequest: true }
  );

  const handleSubmit = useCallback(async () => {
    const nameToSubmit = apiKeyName?.trim() || (isEdit ? apiKey?.key_name : "");
    
    if (!nameToSubmit) {
      setValidationError(t("nameRequiredError"));
      return;
    }

    // For edit mode, check if name actually changed
    if (isEdit && nameToSubmit === apiKey?.key_name) {
      setValidationError(t("nameChangedError"));
      return;
    }

    if (!user?.user_id) {
      setApiError(true);
      return;
    }

    try {
      setLoading(true);
      setApiError(false);
      setValidationError(undefined);

      let url: string;
      let method: string;
      
      if (isCreate) {
        url = "/api/user/api-keys";
        method = "POST";
      } else {
        url = `/api/user/api-keys/${apiKey!.api_key_id}`;
        method = "PUT";
      }

      const response = await clientFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_name: nameToSubmit,
        }),
      });

      if (response?.data) {
        setSuccess(true);
        onApiKeyUpdated();
      } else {
        console.error("API response missing data:", response);
        setApiError(true);
      }
    } catch (error) {
      setApiError(true);
      console.error(`Error ${isCreate ? 'creating' : 'renaming'} API key:`, error);
    } finally {
      setLoading(false);
    }
  }, [apiKeyName, apiKey, user?.user_id, clientFetch, onApiKeyUpdated, isCreate, isEdit]);

  const onClose = useCallback(() => {
    setValidationError(undefined);
    setApiError(false);
    setLoading(false);
    setSuccess(false);
    setApiKeyName("");
  }, []);

  const modalId = isCreate ? "create-api-key" : `edit-api-key-${apiKey?.api_key_id}`;
  const titleText = success ? undefined : (
    isCreate ? t("createTitle") : t("editTitle", { keyName: apiKey?.key_name })
  );

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
      "data-testid": `open-edit-api-key-modal-button-${apiKey?.api_key_id}`,
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
          if (e.key === "Enter") handleSubmit();
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
            <p>{isCreate ? t("createDescription") : t("editDescription")}</p>
            {apiError && (
              <SimplerAlert
                alertClick={() => setApiError(false)}
                buttonId="apiKeyModalApiError"
                messageText={isCreate ? t("createErrorMessage") : t("editErrorMessage")}
                type="error"
              />
            )}
            <ApiKeyInput
              validationError={validationError}
              updateApiKeyName={setApiKeyName}
              defaultValue={isEdit ? apiKey?.key_name : ""}
              mode={mode}
            />
            <ModalFooter>
              {loading ? (
                <LoadingButton 
                  id={`${mode}-api-key-button`} 
                  message={isCreate ? t("creating") : t("saving")} 
                />
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    data-testid={`${mode}-api-key-submit-button`}
                  >
                    {isCreate ? t("createButtonText") : t("saveChanges")}
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
