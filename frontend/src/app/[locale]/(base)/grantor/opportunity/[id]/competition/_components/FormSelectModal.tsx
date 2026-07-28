"use client";

import { getForms } from "src/services/fetch/fetchers/allFormsFetcher";
import SessionStorage from "src/services/sessionStorage/sessionStorage";
import { FormType } from "src/types/allFormsResponseTypes";
import { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { CSSProperties, RefObject, useEffect, useRef, useState } from "react";
import {
  Button,
  Grid,
  GridContainer,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/core/SimplerModal";
import { USWDSIcon } from "src/components/core/USWDSIcon";

type TableFormType = FormType & {
  selected?: boolean;
  isRequired?: boolean;
};

const centeredStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const getStyle = (alwaysRequired: boolean) => {
  const style: CSSProperties = {
    border: "1px",
    borderStyle: "solid",
    borderRadius: "4px",
    marginBottom: "8px",
  };
  if (alwaysRequired) {
    style.borderColor = "#5ABF95";
    style.backgroundColor = "#DBF6ED";
  } else {
    style.borderColor = "#E6E6E2";
  }
  return style;
};

export const FormSelectModal = ({
  competition,
  forms,
}: {
  competition: Competition;
  forms: FormType[];
}) => {
  const selectedForms: Record<string, boolean> = {};
  const tableForms: TableFormType[] = [...forms];
  const formModalRef = useRef<ModalRef | null>(null);
  const t = useTranslations("FormSelectModal");
  const handleSubmit = () => {
    formModalRef.current?.toggleModal();
  };
  const onClose = () => {
    formModalRef.current?.toggleModal();
  };
  useEffect(() => {
    competition.competition_forms.forEach((form) => {
      selectedForms[form.form.form_id] = form.is_required;
      const matchingForm = tableForms.find(
        (tableForm) => tableForm.form_id === form.form.form_id,
      );
      if (matchingForm) {
        matchingForm.selected = true;
        matchingForm.isRequired = form.is_required;
      }
    });
  }, [competition]);
  return (
    <>
      <ModalToggleButton
        modalRef={formModalRef}
        opener
        className="margin-y-2 usa-button usa-button--secondary usa-button--big"
        type="button"
      >
        Open Modal Test
      </ModalToggleButton>
      <SimplerModal
        modalId={"piv-required-modal"}
        modalRef={formModalRef}
        titleText={t("title")}
        className="text-wrap maxw-tablet-lg"
      >
        <p>{t("heading")}</p>
        <div style={{ padding: 0, overflowY: "scroll", height: "60vh" }}>
          <GridContainer>
            {tableForms.map((form, index) => {
              const alwaysRequired = !index;
              return (
                <Grid row style={getStyle(alwaysRequired)}>
                  <Grid col={1} style={centeredStyle}>
                    {!alwaysRequired ? (
                      <input
                        type="checkbox"
                        checked={form.selected}
                        style={{ width: "20px" }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectedForms[form.form_id] = true;
                            form.selected = true;
                          } else {
                            delete selectedForms[form.form_id];
                            form.selected = false;
                          }
                        }}
                      />
                    ) : (
                      <></>
                    )}
                  </Grid>
                  <Grid col={5} style={{ fontWeight: "bold" }}>
                    <div
                      style={{
                        fontSize: "14px",
                      }}
                    >
                      {form.short_name.split("_")[0].substring(0, 25)}{" "}
                      <span
                        style={{
                          color: "#76766A",
                          fontWeight: "normal",
                        }}
                      >
                        v{form.current_version.major_version}.
                        {form.current_version.minor_version}
                      </span>
                      {alwaysRequired ? (
                        <span
                          style={{
                            backgroundColor: "#2E8367",
                            color: "white",
                            fontWeight: "normal",
                            marginLeft: "8px",
                            fontSize: 12,
                            paddingLeft: 4,
                            paddingRight: 4,
                            paddingTop: 2,
                            paddingBottom: 2,
                            borderRadius: 2,
                          }}
                        >
                          Always Required
                        </span>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div style={{ fontSize: "16px" }}>
                      {form.name.split(" (")[0]}
                    </div>
                  </Grid>
                  <Grid col={6} style={centeredStyle}>
                    {alwaysRequired ? (
                      <span style={{ color: "#286846" }}>
                        <span style={{ position: "relative", top: 5 }}>
                          <USWDSIcon
                            name="check_circle_outline"
                            className="usa-icon usa-icon--size-3"
                          />
                        </span>
                        <span>Auto added</span>
                      </span>
                    ) : form.isRequired || !form.selected ? (
                      "REQUIRED"
                    ) : (
                      "CONDITIONALLY REQUIRED"
                    )}
                  </Grid>
                </Grid>
              );
            })}
          </GridContainer>
        </div>
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
    </>
  );
};
