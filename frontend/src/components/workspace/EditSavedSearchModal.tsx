"use client";

import clsx from "clsx";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
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

function SaveSearchInput({
  validationError,
  updateSavedSearchName,
  id,
  defaultValue = "",
}: {
  validationError?: string;
  updateSavedSearchName: (name: string) => void;
  id: string;
  defaultValue?: string;
}) {
  const t = useTranslations("Search.saveSearch.modal");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <FormGroup error={!!validationError}>
      <label htmlFor="saved-search-input">
        {t.rich("inputLabel", {
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
          id={`edit-saved-search-input-${id}`}
          name={`edit-saved-search-${id}`}
          defaultValue={defaultValue}
          onChange={(e) => updateSavedSearchName(e.target?.value)}
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
  const t = useTranslations("SavedSearches.editModal");
  return (
    <>
      <ModalHeading
        id={`${modalId}-heading`}
      >{`"${originalName}" ${t("updatedNotification")} "${updatedName}"`}</ModalHeading>
      <ModalFooter>
        <ModalToggleButton
          modalRef={modalRef}
          closer
          unstyled
          onClick={onClose}
        >
          {t("closeText")}
        </ModalToggleButton>
      </ModalFooter>
    </>
  );
}

export function EditSavedSearchModal({
  savedSearchId,
  editText,
  queryName,
}: {
  savedSearchId: string;
  editText: string;
  queryName: string;
}) {
  const modalId = useMemo(
    () => `edit-save-search-${savedSearchId}`,
    [savedSearchId],
  );

  const t = useTranslations("SavedSearches.editModal");
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();
  const { clientFetch } = useClientFetch<Response>(
    "Error updating saved search",
    { jsonResponse: false, authGatedRequest: true },
  );
  const router = useRouter();

  const [validationError, setValidationError] = useState<string>();
  const [originalName] = useState<string>(queryName);
  const [savedSearchName, setSavedSearchName] = useState<string>();
  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [updated, setUpdated] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    if (validationError) {
      setValidationError(undefined);
    }
    // known issue: we will hit this case after closing and reopening the modal, even if there is
    // a valid string in the input
    if (!savedSearchName) {
      setValidationError(t("emptyNameError"));
      return;
    }
    if (!user?.token) return;
    setLoading(true);
    clientFetch("/api/user/saved-searches", {
      method: "PUT",
      body: JSON.stringify({ name: savedSearchName, searchId: savedSearchId }),
    })
      .then(() => {
        setUpdated(true);
        router.refresh();
      })
      .catch((error) => {
        setApiError(true);
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    savedSearchName,
    t,
    user?.token,
    validationError,
    savedSearchId,
    clientFetch,
    router,
  ]);

  const onClose = useCallback(() => {
    setUpdated(false);
    setApiError(false);
    setLoading(false);
    setValidationError(undefined);
    setSavedSearchName("");
  }, []);

  return (
    <>
      <ModalToggleButton
        modalRef={modalRef}
        opener
        data-testid={`open-edit-saved-search-modal-button-${savedSearchId}`}
        type="button"
        className="padding-1 hover:bg-base-lightest"
        unstyled
      >
        <USWDSIcon name="edit" key="edit-saved-search" />
        {editText}
      </ModalToggleButton>
      <SimplerModal
        modalRef={modalRef}
        className="text-wrap"
        modalId={modalId}
        titleText={updated ? undefined : `${t("title")} ${queryName}`}
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
            updatedName={savedSearchName || ""} // setValidationError results in savedSearchName to always be savedSearchName
            onClose={onClose}
          />
        ) : (
          <>
            {apiError && (
              <SimplerAlert
                alertClick={() => setApiError(false)}
                buttonId={`editSavedSearchApiError-${savedSearchId}`}
                messageText={t("apiError")}
                type="error"
              />
            )}
            <SaveSearchInput
              validationError={validationError}
              updateSavedSearchName={setSavedSearchName}
              id={savedSearchId}
              defaultValue={queryName}
            />
            <ModalFooter>
              {loading ? (
                <LoadingButton
                  id={`edit-saved-search-button-${savedSearchId}`}
                  message={t("loading")}
                />
              ) : (
                <>
                  <Button
                    type={"button"}
                    onClick={handleSubmit}
                    data-testid={`edit-saved-search-button-${savedSearchId}`}
                  >
                    {t("saveText")}
                  </Button>
                  <ModalToggleButton
                    modalRef={modalRef}
                    closer
                    unstyled
                    onClick={onClose}
                  >
                    {t("cancelText")}
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
