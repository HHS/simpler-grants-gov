"use client";

import { ApiKey } from "src/types/apiKeyTypes";
import { toShortMonthDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";
import ApiKeyModal from "./ApiKeyModal";

interface ApiKeyTableClientProps {
  apiKeys: ApiKey[];
}

const ApiKeyNameDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  return (
    <div>
      <div className="font-sans-md text-bold margin-bottom-05">
        {apiKey.key_name}
      </div>
      <div className="font-sans-xs text-base-dark">{apiKey.key_id}</div>
    </div>
  );
};

const DateDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  const t = useTranslations("ApiDashboard.table.dateLabels");

  return (
    <div>
      <div className="margin-bottom-05">
        <span className="text-bold">{t("created")}</span>{" "}
        {toShortMonthDate(apiKey.created_at)}
      </div>
      <div className="font-sans-xs">
        <span className="text-bold">{t("lastUsed")}</span>{" "}
        {apiKey.last_used ? toShortMonthDate(apiKey.last_used) : t("never")}
      </div>
    </div>
  );
};

const EditActionDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  const router = useRouter();

  const handleApiKeyRenamed = () => {
    router.refresh();
  };

  return (
    <div className="flex-align-center">
      <ApiKeyModal
        mode="edit"
        apiKey={apiKey}
        onApiKeyUpdated={handleApiKeyRenamed}
      />
    </div>
  );
};

const DeleteActionDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  const router = useRouter();

  const handleApiKeyDeleted = () => {
    router.refresh();
  };

  return (
    <div className="flex-align-center">
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
      cellData: <DateDisplay apiKey={apiKey} />,
      stackOrder: 1,
    },
    {
      cellData: <EditActionDisplay apiKey={apiKey} />,
      stackOrder: 2,
    },
    {
      cellData: <DeleteActionDisplay apiKey={apiKey} />,
      stackOrder: 3,
    },
  ];
};

export default function ApiKeyTableClient({ apiKeys }: ApiKeyTableClientProps) {
  const t = useTranslations("ApiDashboard.table");

  const headerContent: TableCellData[] = [
    { cellData: t("headers.apiKey") },
    { cellData: t("headers.dates") },
    { cellData: t("headers.editName") },
    { cellData: t("headers.deleteKey") },
  ];

  const tableRowData = apiKeys.map((apiKey) => toApiKeyTableRow(apiKey));

  return (
    <TableWithResponsiveHeader
      headerContent={headerContent}
      tableRowData={tableRowData}
    />
  );
}
