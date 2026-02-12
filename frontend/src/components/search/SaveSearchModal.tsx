import clsx from "clsx";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import { filterSearchParams } from "src/utils/search/searchFormatUtils";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
          id="saved-search-input"
          name="save-search"
          defaultValue={""}
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
      <p>
        {t.rich("successDescription", {
          workspaceLink: (chunks) => (
            <Link href="/saved-search-queries">{chunks}</Link>
          ),
        })}
      </p>
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

// note that this is client component, but not marked as "use client" because to do so
// would cause an error when passing the function prop from parent client component see:
// https://github.com/vercel/next.js/discussions/46795
export function SaveSearchModal({ onSave }: { onSave: (id: string) => void }) {
  const t = useTranslations("Search.saveSearch.modal");
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [validationError, setValidationError] = useState<string>();
  const [savedSearchName, setSavedSearchName] = useState<string>();
  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [saved, setSaved] = useState<boolean>();
  const { clientFetch } = useClientFetch<{ id: string }>(
    "Error posting saved search",
  );
  const handleSubmit = useCallback(() => {
    if (validationError) {
      setValidationError(undefined);
    }
    if (!savedSearchName) {
      setValidationError(t("emptyNameError"));
      return;
    }
    if (!user?.token) {
      return;
    }
    // send up a filtered set of params, converted to an object
    // we will do the further filter and pagination object building on the server
    const savedSearchParams = filterSearchParams(
      Object.fromEntries(searchParams.entries()),
    );

    setLoading(true);
    clientFetch("/api/user/saved-searches", {
      method: "POST",
      body: JSON.stringify({ ...savedSearchParams, name: savedSearchName }),
    })
      .then((data) => {
        if (!data?.id) {
          throw new Error("saved search ID not returned from API");
        }
        setSaved(true);
        onSave(data.id);
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
    user?.token,
    searchParams,
    t,
    validationError,
    onSave,
    clientFetch,
  ]);

  const onClose = useCallback(() => {
    setSaved(false);
    setApiError(false);
    setLoading(false);
    setValidationError(undefined);
    setSavedSearchName("");
  }, []);

  return (
    <>
      <div className="flex-1">
        <ModalToggleButton
          modalRef={modalRef}
          opener
          data-testid="open-save-search-modal-button"
          type="button"
          className="padding-1 hover:bg-base-lightest"
          unstyled
        >
          <USWDSIcon
            className="usa-icon margin-right-05 margin-left-neg-05"
            name="add_circle_outline"
            key="save-search"
          />
          {t("saveText")}
        </ModalToggleButton>
      </div>
      <SimplerModal
        modalRef={modalRef}
        className="text-wrap"
        modalId={"save-search"}
        titleText={saved ? undefined : t("title")}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        onClose={onClose}
      >
        {saved ? (
          <SuccessContent
            modalRef={modalRef}
            modalId={"save-search"}
            onClose={onClose}
          />
        ) : (
          <>
            <p>{t("description")}</p>
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
              {loading ? (
                <LoadingButton id="save-search-button" message={t("loading")} />
              ) : (
                <>
                  <Button
                    type="button"
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
                </>
              )}
            </ModalFooter>
          </>
        )}
      </SimplerModal>
    </>
  );
}
