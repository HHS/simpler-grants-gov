import { ApplicationHistory } from "src/types/applicationResponseTypes";

import { useTranslations } from "next-intl";
import { Alert } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";

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
    timeZoneName: "short",
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
  const tableHeaders: TableCellData[] = [
    { cellData: t("timestamp") },
    { cellData: t("activity"), style: { width: "55%" } },
    { cellData: t("performedBy") },
  ];

  const transformTableRowData = (histories: ApplicationHistoryCardProps) =>
    histories.map((history) => {
      return [
        { cellData: formatTimestamp(history.created_at) },
        {
          cellData: getActivityMessage(
            history,
            activityTranslations(history.application_audit_event),
          ),
        },
        { cellData: history.user.email },
      ];
    });

  if (!applicationHistory.length) {
    return (
      <Alert type="error" headingLevel="h4" noIcon>
        {t("error")}
      </Alert>
    );
  }

  return (
    <TableWithResponsiveHeader
      headerContent={tableHeaders}
      tableRowData={transformTableRowData(applicationHistory)}
    />
  );
};
