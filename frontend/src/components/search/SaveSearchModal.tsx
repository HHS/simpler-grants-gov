"use client";

import clsx from "clsx";
import { debounce } from "lodash";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  Button,
  ErrorMessage,
  FormGroup,
  Modal,
  ModalFooter,
  ModalHeading,
  ModalRef,
  ModalToggleButton,
  TextInput,
} from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

const saveSearch = (name: string) => {
  console.log("~~~ saving search", name);
};

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
      <label htmlFor="saved-search-input">{t("inputLabel")}</label>
      {validationError && <ErrorMessage>{validationError}</ErrorMessage>}
      <div className="usa-search usa-search--big" role="search">
        <TextInput
          ref={inputRef}
          className={clsx("usa-input", "maxw-none", {
            "usa-input--error": !!validationError,
          })}
          id="saved-search-input"
          name="query"
          defaultValue={""}
          onChange={(e) => updateSavedSearchName(e.target?.value)}
          type="text"
        />
      </div>
    </FormGroup>
  );
}

export function SaveSearchModal() {
  const modalId = "save-search";

  const t = useTranslations("Search.saveSearch.modal");
  const modalRef = useRef<ModalRef>(null);
  const [validationError, setValidationError] = useState<string>();
  const [savedSearchName, setSavedSearchName] = useState<string>();

  const updateSavedSearchName = debounce(setSavedSearchName, 50);

  const handleSubmit = () => {
    if (validationError) {
      setValidationError(undefined);
    }
    if (!savedSearchName) {
      setValidationError(t("emptyNameError"));
    }
    saveSearch(savedSearchName);
  };

  return (
    <>
      <div className="usa-nav__primary margin-top-0 padding-top-2px text-no-wrap desktop:order-last margin-left-auto">
        <div className="usa-nav__primary-item border-0">
          <ModalToggleButton
            modalRef={modalRef}
            opener
            className="usa-nav__link font-sans-2xs display-flex text-normal border-0"
            data-testid="sign-in-button"
          >
            <USWDSIcon
              className="usa-icon margin-right-05 margin-left-neg-05"
              name="add_circle_outline"
              key="save-search"
            />
            {t("saveText")}
          </ModalToggleButton>
        </div>
      </div>
      <Modal
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
        <ModalHeading id={`${modalId}-heading`}>{t("title")}</ModalHeading>
        <div className="usa-prose">
          <p className="font-sans-2xs margin-y-4">{t("description")}</p>
        </div>
        <SaveSearchInput
          validationError={validationError}
          updateSavedSearchName={updateSavedSearchName}
        />
        <ModalFooter>
          <Button type={"button"} onClick={handleSubmit}>
            {t("saveText")}
          </Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
          >
            {t("cancelText")}
          </ModalToggleButton>
        </ModalFooter>
      </Modal>
    </>
  );
}
