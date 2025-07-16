"use client";

import { useTranslations } from "next-intl";
import { RefObject, useActionState, useEffect, useRef } from "react";
import {
  Button,
  ButtonGroup,
  FormGroup,
  ModalRef,
  ModalToggleButton,
  TextInput,
} from "@trussworks/react-uswds";

import {
  updateAppFilingNameAction,
  UpdateAppFilingNameActionState,
} from "./actions";

export const EditAppFilingNameModalForm = ({
  applicationId,
  applicaitonName,
  modalRef,
}: {
  applicationId: string;
  applicaitonName: string;
  modalRef: RefObject<ModalRef | null>;
}) => {
  const t = useTranslations(
    "Application.information.editApplicationFilingNameModal",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, isPending] = useActionState(
    updateAppFilingNameAction,
    { success: false, error: null } satisfies UpdateAppFilingNameActionState,
  );

  useEffect(() => {
    if (state?.success) {
      modalRef.current?.toggleModal();
    }
  }, [state?.success, modalRef]);

  return (
    <form action={formAction}>
      <input type="hidden" name="application_id" value={applicationId} />
      <FormGroup>
        <label htmlFor="edit-application-filing-name">{t("label")}</label>
        <p className="margin-top-0 text-gray-50 line-height-sans-2 font-sans-2xs">
          {t("helperText")}
        </p>
        {state?.error && <p className="text-red">{state.error}</p>}
        <TextInput
          ref={inputRef}
          id="edit-application-filing-name"
          name="application_name"
          defaultValue={applicaitonName}
          type="text"
          required
        />
        <div className="margin-top-3">
          <ButtonGroup>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : t("buttonAction")}
            </Button>
            <ModalToggleButton
              modalRef={modalRef}
              closer
              unstyled
              type="button"
              className="padding-105 text-center"
            >
              {t("buttonCancel")}
            </ModalToggleButton>
          </ButtonGroup>
        </div>
      </FormGroup>
    </form>
  );
};
