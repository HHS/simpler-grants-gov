"use client";

import clsx from "clsx";
import { useUser } from "src/services/auth/useUser";
import { saveSearch } from "src/services/fetch/fetchers/clientSavedSearchFetcher";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { RefObject, useCallback, useRef, useState } from "react";
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
}: {
  validationError?: string;
  updateSavedSearchName: (name: string) => void;
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
          id="saved-search-input"
          name="save-search"
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
  const t = useTranslations("Search.saveSearch.modal");
  return (
    <>
      <ModalHeading id={`${modalId}-heading`}>{t("successTitle")}</ModalHeading>
      <div className="usa-prose">
        <p className="font-sans-2xs margin-y-4">{t("successDescription")}</p>
      </div>
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

export function SaveSearchModal() {
  const modalId = "save-search";

  const t = useTranslations("Search.saveSearch.modal");
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [validationError, setValidationError] = useState<string>();
  const [savedSearchName, setSavedSearchName] = useState<string>();
  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [saved, setSaved] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    if (validationError) {
      setValidationError(undefined);
    }
    if (!savedSearchName) {
      setValidationError(t("emptyNameError"));
      return;
    }
    setLoading(true);
    saveSearch(savedSearchName, searchParams, user?.token)
      .then((_data) => {
        setSaved(true);
      })
      .catch((error) => {
        setApiError(true);
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [savedSearchName, user, searchParams, t, validationError]);

  const onClose = useCallback(() => {
    setSaved(false);
    setApiError(false);
    setLoading(false);
    setValidationError(undefined);
    setSavedSearchName("");
  }, []);

  return (
    <>
      <div className="usa-nav__primary margin-top-0 padding-top-2px text-no-wrap desktop:order-last margin-left-auto">
        <div className="usa-nav__primary-item border-0">
          <ModalToggleButton
            modalRef={modalRef}
            opener
            className="usa-nav__link font-sans-2xs display-flex text-normal border-0"
            data-testid="open-save-search-modal-button"
          >
            <USWDSIcon
              className="usa-icon margin-right-05 margin-left-neg-05"
              name="add_circle_outline"
              key="save-search"
            />
            {t("saveText")}
          </ModalToggleButton>
        </div>
      </div>
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
        {saved ? (
          <SuccessContent
            modalRef={modalRef}
            modalId={modalId}
            onClose={onClose}
          />
        ) : (
          <>
            <ModalHeading id={`${modalId}-heading`}>{t("title")}</ModalHeading>
            <div className="usa-prose">
              <p className="font-sans-2xs margin-y-4">{t("description")}</p>
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
