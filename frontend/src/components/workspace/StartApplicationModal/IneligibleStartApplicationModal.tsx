import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { UserOrganization } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { RefObject } from "react";
import {
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";
import { StartApplicationDescription } from "./StartApplicationDescription";

export const IneligibleApplicationStart = ({
  organizations,
  applicantTypes,
  modalRef,
  onClose,
  cancelText,
}: {
  organizations: UserOrganization[];
  applicantTypes: ApplicantTypes[];
  modalRef: RefObject<ModalRef | null>;
  onClose: () => void;
  cancelText: string;
}) => {
  const t = useTranslations("OpportunityListing.startApplicationModal");
  return (
    <SimplerModal
      modalRef={modalRef}
      className="text-wrap maxw-tablet-lg font-sans-xs"
      modalId="start-application"
      titleText={t("ineligibleTitle")}
      onClose={onClose}
    >
      <StartApplicationDescription
        organizations={organizations}
        applicantTypes={applicantTypes}
      />
      <ModalFooter>
        <ModalToggleButton
          modalRef={modalRef}
          closer
          className="padding-105 text-center"
          onClick={onClose}
        >
          {cancelText}
        </ModalToggleButton>
      </ModalFooter>
    </SimplerModal>
  );
};
