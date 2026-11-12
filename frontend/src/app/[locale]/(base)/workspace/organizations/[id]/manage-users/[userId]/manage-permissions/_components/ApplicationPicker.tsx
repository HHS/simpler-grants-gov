"use client";

import { useTranslations } from "next-intl";
import { Checkbox, Fieldset, Grid } from "@trussworks/react-uswds";

import { PermissionsApplication } from "./mockPermissionsData";

interface ApplicationPickerProps {
  applications: PermissionsApplication[];
  selectedApplicationIds: string[];
  disabled: boolean;
  onToggle: (applicationId: string, checked: boolean) => void;
}

export const ApplicationPicker = ({
  applications,
  selectedApplicationIds,
  disabled,
  onToggle,
}: ApplicationPickerProps) => {
  const t = useTranslations("ManagePermissions.updatePermissions");

  const selectedApplications = applications.filter(({ applicationId }) =>
    selectedApplicationIds.includes(applicationId),
  );

  return (
    <Grid
      row
      gap
      className="margin-top-3 tablet:margin-left-4"
      data-testid="application-picker"
    >
      <Grid tablet={{ col: 7 }}>
        <Fieldset
          legend={t("applicationListLegend")}
          className="text-bold"
          disabled={disabled}
        >
          <div className="border border-base-light maxh-mobile overflow-y-auto text-normal">
            {applications.map(({ applicationId, applicationName }) => (
              <Checkbox
                key={applicationId}
                id={`application-${applicationId}`}
                name="selectedApplications"
                value={applicationId}
                label={applicationName}
                className="margin-0 padding-x-1 padding-bottom-1 border-bottom border-base-lighter"
                checked={selectedApplicationIds.includes(applicationId)}
                disabled={disabled}
                onChange={(event) =>
                  onToggle(applicationId, event.target.checked)
                }
              />
            ))}
          </div>
        </Fieldset>
      </Grid>
      <Grid tablet={{ col: 5 }}>
        <h4 className="margin-top-2 margin-bottom-1">
          {t("selectedApplicationsHeading")}
        </h4>
        {selectedApplications.length > 0 ? (
          <ul
            className="usa-list margin-top-0"
            data-testid="selected-applications"
          >
            {selectedApplications.map(({ applicationId, applicationName }) => (
              <li key={applicationId}>{applicationName}</li>
            ))}
          </ul>
        ) : (
          <p className="margin-top-0" data-testid="no-applications-selected">
            {t("noApplicationsSelected")}
          </p>
        )}
      </Grid>
    </Grid>
  );
};
