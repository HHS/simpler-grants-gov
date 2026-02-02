import { RefObject } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";
import { EditAppFilingNameModalBody } from "./EditAppFilingNameModalBody";
import { EditAppFilingNameModalForm } from "./EditAppFilingNameModalForm";

export const EditAppFilingNameModal = ({
  applicationId,
  applicationName,
  modalId,
  modalRef,
  opportunityName,
  titleText,
}: {
  applicationId: string;
  applicationName: string;
  modalId: string;
  modalRef: RefObject<ModalRef | null>;
  opportunityName: string | null;
  titleText: string;
}) => {
  return (
    <SimplerModal
      modalId={modalId}
      modalRef={modalRef}
      titleText={titleText}
      className="text-wrap"
    >
      <EditAppFilingNameModalBody opportunityName={opportunityName} />
      <EditAppFilingNameModalForm
        applicationId={applicationId}
        applicaitonName={applicationName}
        modalRef={modalRef}
      />
    </SimplerModal>
  );
};
