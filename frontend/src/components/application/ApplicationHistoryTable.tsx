import { ApplicationHistory } from "src/types/applicationResponseTypes";

import { useTranslations } from "next-intl";
import { Table, Alert } from "@trussworks/react-uswds";

export type ApplicationHistoryCardProps = ApplicationHistory[];

export const ApplicationHistoryTable = ({
  applicationHistory,
}: {
  applicationHistory: ApplicationHistoryCardProps;
}) => {
  const t = useTranslations("Application.historyTable");

  return (
    <>
      <h3>{t("applicationHistory")}</h3>
      <ApplicationTable applicationHistory={applicationHistory} />
    </>
  );
};

const formatTimestamp = (time: string) => {
  const date = new Date(time);
  return `${date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} ${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short"
  })}`;
};

const getActivityMessage = (activity: ApplicationHistory, message: string) => {
  let additionalData = "";
  switch (activity.application_audit_event) {
    case "attachment_added":
    case "attachment_deleted":
    case "attachment_updated":
      additionalData = activity.target_attachment?.file_name || "";
      break;
    case "form_updated":
      additionalData = activity.target_application_form?.form_name || "";
      break;
    case "user_added":
    case "user_updated":
    case "user_removed":
      additionalData = activity.target_user?.email || "";
      break;
  }
  return `${message}${additionalData}`;
};

const ApplicationTable = ({
  applicationHistory,
}: {
  applicationHistory: ApplicationHistoryCardProps;
}) => {
  const t = useTranslations("Application.historyTable");
  const activityTranslations = useTranslations(
    "Application.historyTable.activities",
  );

  if (!applicationHistory.length) {
    return (
      <Alert type="error" headingLevel="h4" noIcon>{t("error")}</Alert>
    )
  }

  return (
    <Table className="width-full overflow-wrap simpler-application-forms-table">
      <thead>
        <tr>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("timestamp")}
          </th>
          <th
            scope="col"
            className="bg-base-lightest padding-y-205"
            style={{ width: "55%" }}
          >
            {t("activity")}
          </th>
          <th scope="col" className="bg-base-lightest padding-y-205">
            {t("performedBy")}
          </th>
        </tr>
      </thead>
      <tbody>
        {applicationHistory.map((history, index) => (
          <tr
            key={index}
            id={`form-history-${index}`}
            data-testid={`form-history-${index}`}
          >
            <td data-label={t("timestamp")}>
              <div>{formatTimestamp(history.created_at)}</div>
            </td>
            <td data-label={t("activity")}>
              <div>
                {getActivityMessage(
                  history,
                  activityTranslations(history.application_audit_event),
                )}
              </div>
            </td>
            <td data-label={t("performedBy")}>
              <div>{history.user.email}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
