"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";
import { EditAppFilingNameModal } from "./EditAppFilingNameModal";

interface EditAppFilingNameProps {
  applicationId: string;
  applicationName: string;
  opportunityName: string | null;
}

export const EditAppFilingName = ({
  applicationId,
  applicationName,
  opportunityName,
}: EditAppFilingNameProps) => {
  const t = useTranslations("Application");
  const modalRef = useRef<ModalRef>(null);

  return (
    <>
      <ModalToggleButton
        modalRef={modalRef}
        unstyled
        opener
        className="usa-nav__link font-sans-2xs text-normal border-0 margin-left-1"
        data-testid="sign-in-button"
      >
        <USWDSIcon className="usa-icon margin-right-01" name="edit" />
        {t("information.editApplicationFilingNameModal.buttonText")}
      </ModalToggleButton>
      <EditAppFilingNameModal
        applicationId={applicationId}
        applicationName={applicationName}
        modalId="edit-application-filing-name-modal"
        modalRef={modalRef}
        opportunityName={opportunityName}
        titleText={t("information.editApplicationFilingNameModal.title")}
      />
    </>
  );
};
