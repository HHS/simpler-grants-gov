"use client";

import { useIsSSR } from "src/hooks/useIsSSR";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";
import { useUser } from "src/services/auth/useUser";
import { deleteSavedSearch } from "src/services/fetch/fetchers/clientSavedSearchFetcher";

import { useTranslations } from "next-intl";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import {
  Button,
  Modal,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import Loading from "src/components/Loading";
import SimplerAlert from "src/components/SimplerAlert";
import { USWDSIcon } from "src/components/USWDSIcon";

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

export function DeleteSavedSearchModal({
  savedSearchId,
  deleteText,
}: {
  savedSearchId: string;
  deleteText: string;
}) {
  const modalId = useMemo(
    () => `delete-save-search-${savedSearchId}`,
    [savedSearchId],
  );

  const t = useTranslations("SavedSearches.deleteModal");
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();
  const { replaceQueryParams } = useSearchParamUpdater();
  const isSSR = useIsSSR();

  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [updated, setUpdated] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    setLoading(true);
    deleteSavedSearch(savedSearchId, user?.token)
      .then(() => {
        setUpdated(true);
        // this should trigger a page refresh, which will trigger refetching saved searches,
        // which will update the name in the list
        replaceQueryParams({ status: `${savedSearchId}-${Date.now()}` });
      })
      .catch((error) => {
        setApiError(true);
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, replaceQueryParams, savedSearchId]);

  const onClose = useCallback(() => {
    setUpdated(false);
    setApiError(false);
    setLoading(false);
  }, []);

  return (
    <>
      <ModalToggleButton
        modalRef={modalRef}
        opener
        data-testid={`open-delete-saved-search-modal-button-${savedSearchId}`}
        type="button"
        className="padding-1 hover:bg-base-lightest"
        unstyled
      >
        <USWDSIcon name="edit" key="delete-saved-search" />
        {deleteText}
      </ModalToggleButton>
      <Modal
        renderToPortal={!isSSR}
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
            {loading ? (
              <Loading />
            ) : (
              <>
                {apiError && (
                  <SimplerAlert
                    alertClick={() => setApiError(false)}
                    buttonId={`deleteSavedSearchApiError-${savedSearchId}`}
                    messageText={t("apiError")}
                    type="error"
                  />
                )}

                <ModalFooter>
                  <Button
                    type={"button"}
                    onClick={handleSubmit}
                    data-testid={`delete-saved-search-button-${savedSearchId}`}
                  >
                    {t("deleteText")}
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
