"use client";

import { isEqual } from "lodash";

import { useTranslations } from "next-intl";
import { useNavigationGuard } from "next-navigation-guard";
import { createRef, FormEvent, useState } from "react";
import {
  Button,
  Checkbox,
  Fieldset,
  Form,
  ModalRef,
  Radio,
} from "@trussworks/react-uswds";

import { ApplicationPicker } from "./ApplicationPicker";
import { ConfirmPermissionsModal } from "./ConfirmPermissionsModal";
import {
  ApplicationAccessScope,
  ManagedUserPermissions,
  PermissionsApplication,
} from "./mockPermissionsData";

type PermissionFormValues = Pick<
  ManagedUserPermissions,
  "accessScope" | "selectedApplicationIds" | "isExternal"
>;

interface UpdatePermissionsFormProps {
  initialValues: PermissionFormValues;
  applications: PermissionsApplication[];
}

// Selections are kept while "all" is chosen so they come back if the user
// switches to "selected" again, but they don't count as a change and are
// cleared on save.
const normalizeValues = (
  values: PermissionFormValues,
): PermissionFormValues => ({
  ...values,
  selectedApplicationIds:
    values.accessScope === "selected"
      ? [...values.selectedApplicationIds].sort()
      : [],
});

export const UpdatePermissionsForm = ({
  initialValues,
  applications,
}: UpdatePermissionsFormProps) => {
  const t = useTranslations("ManagePermissions.updatePermissions");

  const [savedValues, setSavedValues] =
    useState<PermissionFormValues>(initialValues);
  const [values, setValues] = useState<PermissionFormValues>(initialValues);
  // SimplerModal is opened through a ref object. Created once with useState so
  // it stays the same across renders.
  const [confirmModalRef] = useState(() => createRef<ModalRef>());

  const hasUnsavedChanges = !isEqual(
    normalizeValues(values),
    normalizeValues(savedValues),
  );

  useNavigationGuard({
    enabled: hasUnsavedChanges,
    confirm: () => window.confirm(t("unsavedChangesWarning")),
  });

  const setAccessScope = (accessScope: ApplicationAccessScope) =>
    setValues((current) => ({ ...current, accessScope }));

  const toggleApplication = (applicationId: string, checked: boolean) =>
    setValues((current) => ({
      ...current,
      selectedApplicationIds: checked
        ? [...current.selectedApplicationIds, applicationId]
        : current.selectedApplicationIds.filter((id) => id !== applicationId),
    }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    confirmModalRef.current?.toggleModal(undefined, true);
  };

  // No API call yet. Confirming only marks the current values as saved so the
  // unsaved changes warning stops showing.
  const confirmSave = () => {
    const saved = normalizeValues(values);
    setSavedValues(saved);
    setValues(saved);
    confirmModalRef.current?.toggleModal(undefined, false);
  };

  return (
    <section
      id="update-permissions"
      tabIndex={-1}
      data-testid="update-permissions"
    >
      <h2 className="font-sans-xl margin-top-0 margin-bottom-3">
        {t("heading")}
      </h2>
      <Form onSubmit={handleSubmit} large className="maxw-full">
        <h3 className="margin-bottom-1">{t("submissionHeading")}</h3>
        <p className="margin-top-1 margin-bottom-5">
          {t("submissionDescription")}
        </p>

        <h3 className="margin-bottom-1">{t("accessLegend")}</h3>
        <p className="margin-top-1 maxw-tablet">{t("accessDescription")}</p>
        <Fieldset legend={t("accessLegend")} legendStyle="srOnly">
          <Radio
            id="application-access-all"
            name="applicationAccess"
            value="all"
            label={<span className="text-bold">{t("accessAll")}</span>}
            labelDescription={t("accessAllDescription")}
            checked={values.accessScope === "all"}
            onChange={() => setAccessScope("all")}
          />
          <Radio
            id="application-access-selected"
            name="applicationAccess"
            value="selected"
            label={<span className="text-bold">{t("accessSelected")}</span>}
            labelDescription={t("accessSelectedDescription")}
            checked={values.accessScope === "selected"}
            onChange={() => setAccessScope("selected")}
          />
        </Fieldset>
        <ApplicationPicker
          applications={applications}
          selectedApplicationIds={values.selectedApplicationIds}
          disabled={values.accessScope !== "selected"}
          onToggle={toggleApplication}
        />

        <h3 className="margin-top-5 margin-bottom-1">{t("externalHeading")}</h3>
        <p className="margin-top-1 maxw-tablet">{t("externalDescription")}</p>
        <p className="maxw-tablet">{t("externalPurpose")}</p>
        <Checkbox
          id="mark-user-external"
          name="isExternal"
          label={t("externalCheckbox")}
          checked={values.isExternal}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              isExternal: event.target.checked,
            }))
          }
        />

        <h3 className="margin-top-4 margin-bottom-1">{t("saveHeading")}</h3>
        <p className="margin-top-1 maxw-tablet">{t("saveDescription")}</p>
        <Button type="submit" data-testid="save-permission-updates">
          {t("saveButton")}
        </Button>
      </Form>
      <hr className="border-base-lighter margin-top-4" />
      <ConfirmPermissionsModal
        modalRef={confirmModalRef}
        onConfirm={confirmSave}
      />
    </section>
  );
};
