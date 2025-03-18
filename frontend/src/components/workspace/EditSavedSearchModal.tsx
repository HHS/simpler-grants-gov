"use client";

import clsx from "clsx";
import { useUser } from "src/services/auth/useUser";
import { editSavedSearchName } from "src/services/fetch/fetchers/clientSavedSearchFetcher";

import { useTranslations } from "next-intl";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import {
  Button,
  ErrorMessage,
  FormGroup,
  Modal,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
  TextInput,
} from "@trussworks/react-uswds";

import Loading from "src/components/Loading";
import SimplerAlert from "src/components/SimplerAlert";
import { USWDSIcon } from "src/components/USWDSIcon";

function SaveSearchInput({
  validationError,
  updateSavedSearchName,
  id,
}: {
  validationError?: string;
  updateSavedSearchName: (name: string) => void;
  id: string;
}) {
  const t = useTranslations("Search.saveSearch.modal");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <FormGroup error={!!validationError}>
      <label htmlFor="saved-search-input">{t("inputLabel")}</label>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
      <div className="usa-search usa-search--big" role="search">
        <TextInput
          ref={inputRef}
          className={clsx("usa-input", "maxw-none", {
            "usa-input--error": !!validationError,
          })}
          id={`edit-saved-search-input-${id}`}
          name={`save-search-${id}`}
          defaultValue={""}
          onChange={(e) => updateSavedSearchName(e.target?.value)}
          type="text"
        />
      </div>
    </FormGroup>
  );
}

function SuccessContent({
  modalRef,
  modalId,
  onClose,
}: {
  modalRef: RefObject<ModalRef | null>;
  modalId: string;
  onClose: () => void;
}) {
  const t = useTranslations("SavedSearches.editModal");
  return (
    <>
      <ModalHeading id={`${modalId}-heading`}>{t("successTitle")}</ModalHeading>
      <ModalFooter>
        <ModalToggleButton
          modalRef={modalRef}
          closer
          unstyled
          className="padding-105 text-center"
          onClick={onClose}
        >
          {t("closeText")}
        </ModalToggleButton>
      </ModalFooter>
    </>
  );
}

// note that this is client component, but not marked as "use client" because to do so
// would cause an error when passing the function prop from parent client component see:
// https://github.com/vercel/next.js/discussions/46795
export function EditSavedSearchModal({
  // onSave,
  savedSearchId,
  editText,
}: {
  // onSave: () => void;
  savedSearchId: string;
  editText: string;
}) {
  const modalId = useMemo(
    () => `edit-save-search-${savedSearchId}`,
    [savedSearchId],
  );

  const t = useTranslations("SavedSearches.editModal");
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();

  const [validationError, setValidationError] = useState<string>();
  const [savedSearchName, setSavedSearchName] = useState<string>();
  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [updated, setUpdated] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    if (validationError) {
      setValidationError(undefined);
    }
    if (!savedSearchName) {
      setValidationError(t("emptyNameError"));
      return;
    }
    setLoading(true);
    editSavedSearchName(savedSearchName, savedSearchId, user?.token)
      .then(() => {
        setUpdated(true);
        // onSave();
      })
      .catch((error) => {
        setApiError(true);
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [savedSearchName, user, t, validationError]);

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
        data-testid="open-save-search-modal-button"
        type="button"
        className="padding-1 hover:bg-base-lightest"
        unstyled
      >
        <USWDSIcon name="edit" key="edit-saved-search" />
        {editText}
      </ModalToggleButton>
      <Modal
        ref={modalRef}
        forceAction
        className="text-wrap"
        aria-labelledby={`${modalId}-heading`}
        aria-describedby={`${modalId}-description`}
        id={modalId}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
      >
        {updated ? (
          <SuccessContent
            modalRef={modalRef}
            modalId={modalId}
            onClose={onClose}
          />
        ) : (
          <>
            <ModalHeading id={`${modalId}-heading`}>{t("title")}</ModalHeading>
            <div className="usa-prose">
              <p className="font-sans-2xs margin-y-4">
                {t.rich("description", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
            {loading ? (
              <Loading />
            ) : (
              <>
                {apiError && (
                  <SimplerAlert
                    alertClick={() => setApiError(false)}
                    buttonId="saveSearchApiError"
                    messageText={t("apiError")}
                    type="error"
                  />
                )}
                <SaveSearchInput
                  validationError={validationError}
                  updateSavedSearchName={setSavedSearchName}
                  id={savedSearchId}
                />
                <ModalFooter>
                  <Button
                    type={"button"}
                    onClick={handleSubmit}
                    data-testid="save-search-button"
                  >
                    {t("saveText")}
                  </Button>
                  <ModalToggleButton
                    modalRef={modalRef}
                    closer
                    unstyled
                    className="padding-105 text-center"
                    onClick={onClose}
                  >
                    {t("cancelText")}
                  </ModalToggleButton>
                </ModalFooter>
              </>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
