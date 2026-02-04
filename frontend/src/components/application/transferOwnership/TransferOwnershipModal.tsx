import { useClientFetch } from "src/hooks/useClientFetch";
import { useUserOrganizations } from "src/hooks/useUserOrganizations";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type RefObject } from "react";
import {
  Alert,
  Button,
  ModalFooter,
  ModalHeading,
  ModalToggleButton,
  type ModalRef,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";
import { USWDSIcon } from "src/components/USWDSIcon";
import { TransferOwnershipOrganizationSelect } from "./TransferOwnershipOrganizationSelect";

interface TransferOwnershipModalProps {
  applicationId: string;
  modalId: string;
  modalRef: RefObject<ModalRef | null>;
  onAfterClose: () => void;
}

type TransferOwnershipSuccessResponse = {
  message: string;
  data: {
    application_id: string;
  };
};

export const TransferOwnershipModal = ({
  applicationId,
  modalId,
  modalRef,
  onAfterClose,
}: TransferOwnershipModalProps) => {
  const { organizations, isLoading, hasError } = useUserOrganizations();

  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState<string>("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] =
    useState<boolean>(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string>("");

  const t = useTranslations("Application.transferOwnershipModal");
  const router = useRouter();

  const { clientFetch } = useClientFetch<TransferOwnershipSuccessResponse>(
    t("transferErrorMessage"),
    { authGatedRequest: true },
  );

  const onClose = useCallback((): void => {
    setSubmitErrorMessage("");
    onAfterClose();
  }, [onAfterClose]);

  const handleOrganizationChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      setSelectedOrganizationId(event.target.value);
      setSubmitErrorMessage("");
    },
    [],
  );

  const handleTransfer = useCallback((): void => {
    if (selectedOrganizationId.trim().length === 0 || isSubmittingTransfer) {
      return;
    }

    setIsSubmittingTransfer(true);
    setSubmitErrorMessage("");

    (async (): Promise<void> => {
      try {
        await clientFetch(
          `/api/applications/${applicationId}/transfer-ownership`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organization_id: selectedOrganizationId }),
          },
        );

        modalRef.current?.toggleModal?.();
        onAfterClose();
        router.refresh();
      } catch (error: unknown) {
        setSubmitErrorMessage(t("transferErrorMessage"));
      } finally {
        setIsSubmittingTransfer(false);
      }
    })().catch(() => {
      setIsSubmittingTransfer(false);
      setSubmitErrorMessage(t("transferErrorMessage"));
    });
  }, [
    applicationId,
    clientFetch,
    isSubmittingTransfer,
    modalRef,
    onAfterClose,
    router,
    selectedOrganizationId,
    t,
  ]);

  const modalMainBodyText = useMemo(
    () =>
      t.rich("body", {
        strong: (content) => <strong>{content}</strong>,
        p: (content) => <p>{content}</p>,
      }),
    [t],
  );

  const contactSupportText = useMemo(
    () =>
      t.rich("contactSupport", {
        tel: (content) => {
          const phoneNumber = String(content);
          return <a href={`tel:${phoneNumber}`}>{phoneNumber}</a>;
        },
        link: (content) => {
          const email = String(content);
          return <a href={`mailto:${email}`}>{email}</a>;
        },
      }),
    [t],
  );

  const shouldShowErrorAlert: boolean =
    hasError || submitErrorMessage.trim().length > 0;

  const confirmButtonDisabled: boolean =
    isLoading ||
    isSubmittingTransfer ||
    selectedOrganizationId.trim().length === 0;

  return (
    <SimplerModal
      modalId={modalId}
      modalRef={modalRef}
      className="text-wrap maxw-tablet-lg"
      onClose={onClose}
    >
      <div aria-live="polite" style={{ minHeight: "3rem" }}>
        <Alert
          headingLevel="h2"
          type="error"
          noIcon
          slim
          className={shouldShowErrorAlert ? "" : "display-none"}
        >
          {submitErrorMessage.trim().length > 0
            ? submitErrorMessage
            : t("failedFetchingOrganizationErrorMessage")}
          <br />
          {contactSupportText}
        </Alert>
      </div>

      <ModalHeading className="margin-top-2">{t("title")}</ModalHeading>
      <div>{modalMainBodyText}</div>

      <TransferOwnershipOrganizationSelect
        onOrganizationChange={handleOrganizationChange}
        organizations={organizations}
        selectedOrganization={selectedOrganizationId}
        isDisabled={isLoading || isSubmittingTransfer}
      />

      <Alert
        className="margin-top-4"
        heading={t("warningTitle")}
        headingLevel="h2"
        type="warning"
        noIcon
      >
        {t("warningBody")}
      </Alert>

      <ModalFooter className="margin-top-4">
        <Button
          type="button"
          onClick={handleTransfer}
          data-testid="transfer-ownership-confirm"
          disabled={confirmButtonDisabled}
        >
          <USWDSIcon name="settings" />
          {t("actionConfirm")}
        </Button>

        <ModalToggleButton
          modalRef={modalRef}
          closer
          onClick={onClose}
          data-testid="transfer-ownership-cancel"
          unstyled
        >
          {t("actionCancel")}
        </ModalToggleButton>
      </ModalFooter>
    </SimplerModal>
  );
};