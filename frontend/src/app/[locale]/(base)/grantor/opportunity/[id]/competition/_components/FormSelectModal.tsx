"use client";

import { FormType } from "src/types/allFormsResponseTypes";
import { Competition } from "src/types/competitionsResponseTypes";

import { useTranslations } from "next-intl";
import { CSSProperties, RefObject, useState } from "react";
import {
  Button,
  Grid,
  GridContainer,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
  Radio,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/core/SimplerModal";
import { USWDSIcon } from "src/components/core/USWDSIcon";

const checkboxStyle: CSSProperties = { width: 20, height: 20 };

const alwaysRequiredForms: Record<string, boolean> = {
  "1623b310-85be-496a-b84b-34bdee22a68a": true, // SF 424. As we start to support other form families, this will be replaced with a more complex function
};

const resetTableForms = (
  forms: FormType[],
  selectedForms: Record<string, boolean>,
) => {
  return forms.map((form) => {
    return {
      ...form,
      isSelected: typeof selectedForms[form.form_id] !== "undefined",
      isRequired:
        typeof selectedForms[form.form_id] === "undefined" ||
        selectedForms[form.form_id],
    };
  });
};
const resetSelectedForms = (competition: Competition) => {
  const formHolder: Record<string, boolean> = { ...alwaysRequiredForms };
  competition.competition_forms.forEach((form) => {
    formHolder[form.form.form_id] = form.is_required;
  });
  return formHolder;
};

export const FormSelectModal = ({
  competition,
  forms,
  formModalRef,
  submitCompetitionForms,
}: {
  competition: Competition;
  forms: FormType[];
  formModalRef: RefObject<ModalRef | null>;
  submitCompetitionForms: (
    competitionId: string,
    body: { forms: { form_id: string; is_required: boolean }[] },
  ) => Promise<void>;
}) => {
  const toggleSelectAll = () => {
    if (Object.keys(selectedForms).length >= forms.length - 1) {
      tableForms.forEach((form) => {
        form.isSelected = false;
      });
      setTableForms(tableForms);
      setSelectedForms({ ...alwaysRequiredForms });
    } else {
      const formHolder: Record<string, boolean> = {};
      tableForms.forEach((form) => {
        form.isSelected = true;
        formHolder[form.form_id] = form.isRequired;
      });
      setTableForms(tableForms);
      setSelectedForms(formHolder);
    }
  };
  const [selectedForms, setSelectedForms] = useState<Record<string, boolean>>(
    resetSelectedForms(competition),
  );
  const [tableForms, setTableForms] = useState(
    resetTableForms(forms, selectedForms),
  );
  const t = useTranslations("FormSelectModal");
  const handleSubmit = () => {
    submitCompetitionForms(competition.competition_id, {
      forms: Object.keys(selectedForms).map((key) => {
        return { form_id: key, is_required: selectedForms[key] };
      }),
    })
      .then(() => {
        setTableForms(resetTableForms(forms, selectedForms));
        return formModalRef.current?.toggleModal();
      })
      .catch((e) => {
        console.error("Rejected Promise", e);
      });
  };

  const handleCleanup = () => {
    const clearedSelectedForms = resetSelectedForms(competition);
    const clearedTableForms = resetTableForms(forms, clearedSelectedForms);
    setSelectedForms(clearedSelectedForms);
    setTableForms(clearedTableForms);
  };

  const onClose = () => {
    handleCleanup();
    formModalRef.current?.toggleModal();
  };
  return (
    <SimplerModal
      modalId={"piv-required-modal"}
      modalRef={formModalRef}
      titleText={t("title")}
      onClose={handleCleanup}
      className="text-wrap maxw-tablet-lg"
    >
      <div className="form-modal-header">{t("heading")}</div>
      <div style={{ padding: 0, overflowY: "scroll", height: "60vh" }}>
        <GridContainer>
          <Grid row className="form-modal-select-all">
            <Grid col={1} className="centered-content">
              <input
                type="checkbox"
                checked={Object.keys(selectedForms).length >= forms.length - 1}
                style={checkboxStyle}
                onChange={() => {
                  toggleSelectAll();
                }}
              />
            </Grid>
            <Grid col={11}>{t("selectAll")}</Grid>
          </Grid>
          {tableForms.map((form, index) => {
            const alwaysRequired = !!alwaysRequiredForms[form.form_id];
            return (
              <Grid
                row
                className={`form-modal-rows ${alwaysRequired ? "form-modal-always-required" : "form-modal-optional"}`}
                key={`forms-table-row-${index}`}
              >
                <Grid col={1} className="centered-content">
                  {!alwaysRequired ? (
                    <input
                      type="checkbox"
                      checked={
                        typeof selectedForms[form.form_id] !== "undefined"
                      }
                      style={checkboxStyle}
                      onChange={(e) => {
                        if (e.target.checked) {
                          form.isSelected = true;
                          setTableForms(tableForms);
                          setSelectedForms({
                            ...selectedForms,
                            [form.form_id]: form.isRequired,
                          });
                        } else {
                          form.isSelected = false;
                          setTableForms(tableForms);
                          setSelectedForms((current) => {
                            const { [form.form_id]: _id, ...rest } = current;
                            return rest;
                          });
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
                      fontSize: 14,
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
                      <span className="always-required-label">
                        Always Required
                      </span>
                    ) : (
                      <></>
                    )}
                  </div>
                  <div style={{ fontSize: 16 }}>{form.name.split(" (")[0]}</div>
                </Grid>
                <Grid col={6} className="centered-content">
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
                  ) : (
                    <span>
                      <Radio
                        id={`form-required-yes-${index}`}
                        name={`is_form_required_${index}`}
                        label={t("requiredStates.required")}
                        value="true"
                        checked={form.isRequired}
                        disabled={
                          typeof selectedForms[form.form_id] === "undefined"
                        }
                        onChange={(e) => {
                          form.isRequired = e.target.checked;
                          setTableForms(tableForms);
                          setSelectedForms({
                            ...selectedForms,
                            [form.form_id]: e.target.checked,
                          });
                        }}
                      />
                      <Radio
                        id={`form-required-no-${index}`}
                        name={`is_form_required_${index}`}
                        label={t("requiredStates.conditional")}
                        value="false"
                        checked={!form.isRequired}
                        disabled={
                          typeof selectedForms[form.form_id] === "undefined"
                        }
                        onChange={(e) => {
                          form.isRequired = !e.target.checked;
                          setTableForms(tableForms);
                          setSelectedForms({
                            ...selectedForms,
                            [form.form_id]: !e.target.checked,
                          });
                        }}
                      />
                    </span>
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
  );
};
