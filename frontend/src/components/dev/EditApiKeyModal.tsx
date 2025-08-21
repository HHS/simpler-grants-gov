"use client";

import clsx from "clsx";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";

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
import { ApiKey } from "./ApiDashboard";

function EditApiKeyInput({
  validationError,
  updateApiKeyName,
  defaultValue = "",
}: {
  validationError?: string;
  updateApiKeyName: (name: string) => void;
  defaultValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <FormGroup error={!!validationError}>
      <label htmlFor="edit-api-key-input">
        API Key Name{" "}
        <span className="usa-hint usa-hint--required">*</span>
      </label>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
      <div className="usa-search usa-search--big" role="search">
        <TextInput
          ref={inputRef}
          className={clsx("usa-input", "maxw-none", {
            "usa-input--error": !!validationError,
          })}
          id="edit-api-key-input"
          name="edit-api-key"
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

function SuccessContent({
  modalRef,
  modalId,
  originalName,
  updatedName,
  onClose,
}: {
  modalRef: RefObject<ModalRef | null>;
  modalId: string;
  originalName: string;
  updatedName: string;
  onClose: () => void;
}) {
  return (
    <>
      <ModalHeading id={`${modalId}-heading`}>
        API Key Renamed Successfully
      </ModalHeading>
      <SimplerAlert
        type="success"
        heading="Success!"
        message={`Your API key has been renamed from "${originalName}" to "${updatedName}".`}
      />
      <ModalFooter>
        <ModalToggleButton
          modalRef={modalRef}
          closer
          onClick={onClose}
          data-testid="close-edit-api-key-modal-button"
        >
          Close
        </ModalToggleButton>
      </ModalFooter>
    </>
  );
}

interface EditApiKeyModalProps {
  apiKey: ApiKey;
  onApiKeyRenamed: () => void;
}

export default function EditApiKeyModal({ apiKey, onApiKeyRenamed }: EditApiKeyModalProps) {
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();

  const [validationError, setValidationError] = useState<string>();
  const [apiKeyName, setApiKeyName] = useState<string>();
  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [updated, setUpdated] = useState<boolean>();
  const [originalName] = useState(apiKey.key_name);

  const { clientFetch } = useClientFetch<{ data: any }>(
    "Error renaming API key",
    { authGatedRequest: true }
  );

  const handleSubmit = useCallback(async () => {
    const newName = apiKeyName?.trim() || apiKey.key_name;
    
    if (!newName) {
      setValidationError("API key name is required");
      return;
    }

    if (newName === apiKey.key_name) {
      setValidationError("Please enter a different name");
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

      const response = await clientFetch(
        `/api/user/api-keys/${apiKey.api_key_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key_name: newName,
          }),
        }
      );

      if (response?.data) {
        setUpdated(true);
        onApiKeyRenamed();
      }
    } catch (error) {
      setApiError(true);
      console.error("Error renaming API key:", error);
    } finally {
      setLoading(false);
    }
  }, [apiKeyName, apiKey, user?.user_id, clientFetch, onApiKeyRenamed]);

  const onClose = useCallback(() => {
    setValidationError(undefined);
    setApiError(false);
    setLoading(false);
    setUpdated(false);
    setApiKeyName("");
  }, []);

  const modalId = `edit-api-key-${apiKey.api_key_id}`;

  return (
    <>
      <ModalToggleButton
        modalRef={modalRef}
        opener
        data-testid={`open-edit-api-key-modal-button-${apiKey.api_key_id}`}
        type="button"
        className="padding-1 hover:bg-base-lightest"
        unstyled
      >
        <USWDSIcon name="edit" className="margin-right-05" />
        Edit Name
      </ModalToggleButton>
      
      <SimplerModal
        modalRef={modalRef}
        className="text-wrap"
        modalId={modalId}
        titleText={updated ? undefined : `Edit API Key: ${apiKey.key_name}`}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        onClose={onClose}
      >
        {updated ? (
          <SuccessContent
            modalRef={modalRef}
            modalId={modalId}
            originalName={originalName}
            updatedName={apiKeyName || apiKey.key_name}
            onClose={onClose}
          />
        ) : (
          <>
            {apiError && (
              <SimplerAlert
                type="error"
                heading="Error"
                message="There was an error renaming your API key. Please try again."
              />
            )}
            <EditApiKeyInput
              validationError={validationError}
              updateApiKeyName={setApiKeyName}
              defaultValue={apiKey.key_name}
            />
            <ModalFooter>
              <LoadingButton
                loading={loading}
                loadingText="Saving..."
                onClick={handleSubmit}
                data-testid="edit-api-key-submit-button"
              >
                Save Changes
              </LoadingButton>
              <ModalToggleButton
                modalRef={modalRef}
                closer
                unstyled
                className="padding-105 text-center"
                data-testid="cancel-edit-api-key-button"
              >
                Cancel
              </ModalToggleButton>
            </ModalFooter>
          </>
        )}
      </SimplerModal>
    </>
  );
}
