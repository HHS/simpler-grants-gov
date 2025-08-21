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

import { Alert } from "@trussworks/react-uswds";
import { SimplerModal } from "src/components/SimplerModal";
import { USWDSIcon } from "src/components/USWDSIcon";

function CreateApiKeyInput({
  validationError,
  updateApiKeyName,
}: {
  validationError?: string;
  updateApiKeyName: (name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <FormGroup error={!!validationError}>
      <label htmlFor="create-api-key-input">
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
          id="create-api-key-input"
          name="create-api-key"
          defaultValue=""
          onChange={(e) => updateApiKeyName(e.target?.value)}
          type="text"
          required
          aria-required
          placeholder="e.g., Production API Key"
        />
      </div>
    </FormGroup>
  );
}

function SuccessContent({
  modalRef,
  modalId,
  onClose,
  createdKeyName,
}: {
  modalRef: RefObject<ModalRef | null>;
  modalId: string;
  onClose: () => void;
  createdKeyName: string;
}) {
  return (
    <>
      <ModalHeading id={`${modalId}-heading`}>
        API Key Created Successfully
      </ModalHeading>
      <Alert
        type="success"
        heading="Success!"
        headingLevel="h4"
      >
        Your API key "{createdKeyName}" has been created successfully.
      </Alert>
      <ModalFooter>
        <ModalToggleButton
          modalRef={modalRef}
          closer
          onClick={onClose}
          data-testid="close-create-api-key-modal-button"
        >
          Close
        </ModalToggleButton>
      </ModalFooter>
    </>
  );
}

interface CreateApiKeyModalProps {
  onApiKeyCreated: () => void;
}

export default function CreateApiKeyModal({ onApiKeyCreated }: CreateApiKeyModalProps) {
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();

  const [validationError, setValidationError] = useState<string>();
  const [apiKeyName, setApiKeyName] = useState<string>();
  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [created, setCreated] = useState<boolean>();

  const { clientFetch } = useClientFetch<{ data: any }>(
    "Error creating API key",
    { authGatedRequest: true }
  );

  const handleSubmit = useCallback(async () => {
    if (!apiKeyName?.trim()) {
      setValidationError("API key name is required");
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
        "/api/user/api-keys",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key_name: apiKeyName.trim(),
          }),
        }
      );

      if (response?.data) {
        setCreated(true);
        onApiKeyCreated();
      } else {
        console.error("API response missing data:", response);
        setApiError(true);
      }
    } catch (error) {
      setApiError(true);
      console.error("Error creating API key:", error);
    } finally {
      setLoading(false);
    }
  }, [apiKeyName, user?.user_id, clientFetch, onApiKeyCreated]);

  const onClose = useCallback(() => {
    setValidationError(undefined);
    setApiError(false);
    setLoading(false);
    setCreated(false);
    setApiKeyName("");
  }, []);

  return (
    <>
      <ModalToggleButton
        modalRef={modalRef}
        opener
        data-testid="open-create-api-key-modal-button"
        type="button"
        className="usa-button"
      >
        <USWDSIcon
          className="usa-icon margin-right-05"
          name="add_circle_outline"
        />
        Create API Key
      </ModalToggleButton>
      
      <SimplerModal
        modalRef={modalRef}
        className="text-wrap"
        modalId="create-api-key"
        titleText={created ? undefined : "Create New API Key"}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        onClose={onClose}
      >
        {created ? (
          <SuccessContent
            modalRef={modalRef}
            modalId="create-api-key"
            onClose={onClose}
            createdKeyName={apiKeyName || ""}
          />
        ) : (
          <>
            {apiError && (
              <Alert
                type="error"
                heading="Error"
                headingLevel="h4"
              >
                There was an error creating your API key. Please try again.
              </Alert>
            )}
            <CreateApiKeyInput
              validationError={validationError}
              updateApiKeyName={setApiKeyName}
            />
            <ModalFooter>
              <Button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                data-testid="create-api-key-submit-button"
              >
                {loading ? "Creating..." : "Create API Key"}
              </Button>
              <ModalToggleButton
                modalRef={modalRef}
                closer
                unstyled
                className="padding-105 text-center"
                data-testid="cancel-create-api-key-button"
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
