"use client";

import { ApiKey } from "src/types/apiKeyTypes";
import { toLongMonthDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/core/TableWithResponsiveHeader";
import { useApiKeyAlert } from "./ApiKeyAlertProvider";
import ApiKeyModal from "./ApiKeyModal";

interface ApiKeyTableClientProps {
  apiKeys: ApiKey[];
}

const ApiKeyNameDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  return (
    <div>
      <div className="font-sans-md margin-bottom-05">{apiKey.key_name}</div>
    </div>
  );
};

const CreatedDateDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  return <div>{toLongMonthDate(apiKey.created_at)}</div>;
};

const LastUsedDateDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  const t = useTranslations("ApiDashboard.table.dateLabels");

  return (
    <div>
      {apiKey.last_used ? toLongMonthDate(apiKey.last_used) : t("never")}
    </div>
  );
};

const ActionsDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  const router = useRouter();
  const t = useTranslations("ApiDashboard");
  const { showAlert } = useApiKeyAlert();

  const handleApiKeyRenamed = (renamedKey?: ApiKey) => {
    showAlert(
      t("renameSuccessMessage", {
        originalName: apiKey.key_name,
        keyName: renamedKey?.key_name ?? "",
      }),
    );
    router.refresh();
  };
  const handleApiKeyDeleted = () => {
    showAlert(t("deleteSuccessMessage", { keyName: apiKey.key_name }));
    router.refresh();
  };

  return (
    <div className="display-flex flex-align-center flex-wrap">
      <div className="margin-right-2">
        <ApiKeyModal
          mode="edit"
          apiKey={apiKey}
          onApiKeyUpdated={handleApiKeyRenamed}
        />
      </div>
      <ApiKeyModal
        mode="delete"
        apiKey={apiKey}
        onApiKeyUpdated={handleApiKeyDeleted}
      />
    </div>
  );
};

const toApiKeyTableRow = (apiKey: ApiKey): TableCellData[] => {
  return [
    {
      cellData: <ApiKeyNameDisplay apiKey={apiKey} />,
      stackOrder: 0,
    },
    {
      cellData: <CreatedDateDisplay apiKey={apiKey} />,
      stackOrder: 1,
    },
    {
      cellData: <LastUsedDateDisplay apiKey={apiKey} />,
      stackOrder: 2,
    },
    {
      cellData: <ActionsDisplay apiKey={apiKey} />,
      stackOrder: 3,
    },
  ];
};

export default function ApiKeyTableClient({ apiKeys }: ApiKeyTableClientProps) {
  const t = useTranslations("ApiDashboard.table");

  const headerContent: TableCellData[] = [
    { cellData: t("headers.keyName") },
    { cellData: t("headers.created") },
    { cellData: t("headers.lastUsed") },
    { cellData: t("headers.actions") },
  ];

  const tableRowData = apiKeys.map((apiKey) => toApiKeyTableRow(apiKey));

  return (
    <TableWithResponsiveHeader
      headerContent={headerContent}
      tableRowData={tableRowData}
      rowKeys={apiKeys.map((apiKey) => apiKey.api_key_id)}
    />
  );
}
