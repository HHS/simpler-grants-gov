import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { RefObject, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  FormGroup,
  ModalRef,
  ModalToggleButton,
  TextInput,
} from "@trussworks/react-uswds";

export const EditAppFilingNameModalForm = ({
  applicationId,
  applicaitonName,
  modalRef,
}: {
  applicationId: string;
  applicaitonName: string;
  modalRef: RefObject<ModalRef | null>;
}) => {
  const [initialAppName, setInitialAppName] = useState<string>(applicaitonName);
  const [currentValue, setCurrentValue] = useState<string>(applicaitonName);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations(
    "Application.information.editApplicationFilingNameModal",
  );
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled =
    currentValue.trim() === "" || currentValue === initialAppName;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
    setError(null);
  };

  const handleUpdateAppFilingName = () => {
    setIsSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("application_name", currentValue);

    try {
      fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        body: formData,
      }).catch((error) => console.error(error));

      setInitialAppName(currentValue.trim());
      modalRef.current?.toggleModal();
      router.refresh();
    } catch (err) {
      setError("An error occurred while updating the application name.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormGroup>
      <label htmlFor="edit-application-filing-name">{t("label")}</label>
      <p className="margin-top-0 text-gray-50 line-height-sans-2 font-sans-2xs">
        {t("helperText")}
      </p>
      {error && <p className="text-red">{error}</p>}

      <div>
        <TextInput
          ref={inputRef}
          id="edit-application-filing-name"
          name="edit-application-filing-name"
          key="edit-application-filing-name"
          defaultValue={initialAppName}
          type="text"
          required
          onChange={handleChange}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (!isDisabled && !isSaving) {
                handleUpdateAppFilingName();
              }
            }
          }}
        />
      </div>
      <div className="margin-top-3">
        <ButtonGroup>
          <Button
            type="button"
            onClick={handleUpdateAppFilingName}
            disabled={isDisabled || isSaving}
          >
            {t("buttonAction")}
          </Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
          >
            {t("buttonCancel")}
          </ModalToggleButton>
        </ButtonGroup>
      </div>
    </FormGroup>
  );
};
