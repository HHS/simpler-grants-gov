"use client";

import { getForms } from "src/services/fetch/fetchers/allFormsFetcher";
import { getCompetitionDetails } from "src/services/fetch/fetchers/competitionsFetcher";
import SessionStorage from "src/services/sessionStorage/sessionStorage";
import { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import {
  Button,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/core/SimplerModal";

export const FormSelectModal = async (competitionId: string) => {
  const competitionFormsResponse = await getCompetitionDetails(competitionId);
  const allFormsResponse = await getForms();
  const selectedForms: Record<string, boolean> = {};
  const t = useTranslations("FormSelectModal");
  const formModalRef = useRef<ModalRef | null>(null);
  const handleSubmit = () => {
    formModalRef.current?.toggleModal();
  };
  const onClose = () => {
    formModalRef.current?.toggleModal();
  };
  competitionFormsResponse.competition_forms.forEach((form) => {
    selectedForms[form.form.form_id] = form.is_required;
  });
  console.log(allFormsResponse);
  return (
    <SimplerModal
      modalId={"piv-required-modal"}
      modalRef={formModalRef}
      titleText={t("title")}
      className="text-wrap"
    >
      <p>{t("header")}</p>
      <ModalFooter>
        <Button
          type="button"
          onClick={handleSubmit}
          data-testid="save-search-button"
        >
          {t("buttons.save")}
        </Button>
        <ModalToggleButton
          modalRef={formModalRef}
          closer
          unstyled
          className="padding-105 text-center"
          onClick={onClose}
        >
          {t("buttons.cancel")}
        </ModalToggleButton>
      </ModalFooter>
    </SimplerModal>
  );
};
