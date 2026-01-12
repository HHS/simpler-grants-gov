import { useUserOrganizations } from "src/hooks/useUserOrganizations";

import { useTranslations } from "next-intl";
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

export const TransferOwnershipModal = ({
  modalId,
  modalRef,
}: {
  modalId: string;
  modalRef: RefObject<ModalRef | null>;
}) => {
  const { organizations, isLoading, hasError } = useUserOrganizations();
  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState<string>("");

  const t = useTranslations("Application.transferOwnershipModal");

  const handleTransfer = useCallback((): void => {
    // Intentionally empty
  }, []);

  const onClose = useCallback((): void => {
    // Intentionally empty
  }, []);

  const handleOrganizationChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      setSelectedOrganizationId(event.target.value);
    },
    [],
  );

  const modalMainBodyText = useMemo(
    () =>
      t.rich("body", {
        strong: (content) => <strong>{content}</strong>,
        p: (content) => <p>{content}</p>,
      }),
    [t],
  );

  const productSupportText = useMemo(
    () =>
      t.rich("footer.productSupport", {
        link: (content) => <a href="mailto:simpler@grants.gov">{content}</a>,
        tel: (content) => {
          const phoneNumber = String(content);
          return <a href={`tel:${phoneNumber}`}>{phoneNumber}</a>;
        },
      }),
    [t],
  );

  const alternativeMethodsOfApplyingText = useMemo(
    () =>
      t.rich("footer.alternativeMethodsOfApplying", {
        link: (content) => {
          const urlText = String(content);
          return <a href={`https://${urlText}`}>{urlText}</a>;
        },
      }),
    [t],
  );

  return (
    <SimplerModal
      modalId={modalId}
      modalRef={modalRef}
      className="text-wrap maxw-tablet-lg"
    >
      <div aria-live="polite" style={{ minHeight: "3rem" }}>
        <Alert
          headingLevel="h2"
          type="error"
          slim
          className={hasError ? "" : "display-none"}
        >
          {t("errorMessage")}
        </Alert>
      </div>

      <ModalHeading className="margin-top-2">{t("title")}</ModalHeading>
      <div>{modalMainBodyText}</div>

      <TransferOwnershipOrganizationSelect
        onOrganizationChange={handleOrganizationChange}
        organizations={organizations}
        selectedOrganization={selectedOrganizationId}
        isDisabled={isLoading}
      />

      <Alert
        className="margin-top-4"
        heading={t("warningTitle")}
        headingLevel="h2"
        type="warning"
      >
        {t("warningBody")}
      </Alert>

      <ModalFooter className="margin-top-4">
        <Button
          type="button"
          onClick={handleTransfer}
          data-testid="transfer-ownership-confirm"
          disabled
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

      <div className="margin-top-4">
        <p>
          {productSupportText}
          <br />
          {alternativeMethodsOfApplyingText}
        </p>
      </div>
    </SimplerModal>
  );
};
