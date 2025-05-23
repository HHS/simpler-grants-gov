"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { useIsSSR } from "src/hooks/useIsSSR";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import {
  Button,
  Modal,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { LoadingButton } from "src/components/LoadingButton";
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
  queryName,
}: {
  savedSearchId: string;
  deleteText: string;
  queryName: string;
}) {
  const modalId = useMemo(
    () => `delete-save-search-${savedSearchId}`,
    [savedSearchId],
  );

  const t = useTranslations("SavedSearches.deleteModal");
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();
  const isSSR = useIsSSR();
  const { clientFetch } = useClientFetch<Response>(
    "Error deleting saved search",
    { jsonResponse: false, authGatedRequest: true },
  );
  const router = useRouter();

  const [apiError, setApiError] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const [updated, setUpdated] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    setLoading(true);
    if (!user?.token) {
      return;
    }
    clientFetch("/api/user/saved-searches", {
      method: "DELETE",
      body: JSON.stringify({ searchId: savedSearchId }),
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
  }, [user?.token, savedSearchId, router, clientFetch]);

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
            <p className="font-sans-2xs margin-y-4">
              {t("description")} &quot;{queryName}&quot;?
            </p>
            {apiError && (
              <SimplerAlert
                alertClick={() => setApiError(false)}
                buttonId={`deleteSavedSearchApiError-${savedSearchId}`}
                messageText={t("apiError")}
                type="error"
              />
            )}

            <ModalFooter>
              {loading ? (
                <LoadingButton
                  id={`delete-saved-search-button-${savedSearchId}`}
                  message={t("loading")}
                />
              ) : (
                <>
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
                </>
              )}
            </ModalFooter>
          </>
        )}
      </Modal>
    </>
  );
}
