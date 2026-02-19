"use client";

import { ApiKey } from "src/types/apiKeyTypes";
import { toShortMonthDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import CopyIcon from "src/components/CopyIcon";
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
      <div className="font-sans-md margin-bottom-05">{apiKey.key_name}</div>
    </div>
  );
};

const ApiKeySecretDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  return (
    <div>
      <div className="font-sans-s text-base-dark grid-row">
        <span className="margin-right-2 grid-col-6">
          {apiKey.key_id.slice(0, 3) + "..." + apiKey.key_id.slice(-3)}
        </span>
        <CopyIcon
          content={apiKey.key_id}
          className="usa-icon--size-2 grid-col-6"
        />
      </div>
    </div>
  );
};

const ApiKeyStatusDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  const t = useTranslations("ApiDashboard.table.statuses");
  return (
    <div>
      <div className="font-sans-md margin-bottom-05">
        {apiKey.is_active ? t("active") : t("inactive")}
      </div>
    </div>
  );
};

const CreatedDateDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  return <div>{toShortMonthDate(apiKey.created_at)}</div>;
};

const LastUsedDateDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  const t = useTranslations("ApiDashboard.table.dateLabels");

  return (
    <div>
      {apiKey.last_used ? toShortMonthDate(apiKey.last_used) : t("never")}
    </div>
  );
};

const ModifyActionDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  const router = useRouter();

  const handleApiKeyRenamed = () => {
    router.refresh();
  };
  const handleApiKeyDeleted = () => {
    router.refresh();
  };

  return (
    <div className="grid-row">
      <div className="flex-align-center">
        <ApiKeyModal
          mode="edit"
          apiKey={apiKey}
          onApiKeyUpdated={handleApiKeyRenamed}
        />
      </div>
      <div className="flex-align-center">
        <ApiKeyModal
          mode="delete"
          apiKey={apiKey}
          onApiKeyUpdated={handleApiKeyDeleted}
        />
      </div>
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
      cellData: <ApiKeyStatusDisplay apiKey={apiKey} />,
      stackOrder: 1,
    },
    {
      cellData: <ApiKeySecretDisplay apiKey={apiKey} />,
      stackOrder: 2,
    },

    {
      cellData: <CreatedDateDisplay apiKey={apiKey} />,
      stackOrder: 3,
    },
    {
      cellData: <LastUsedDateDisplay apiKey={apiKey} />,
      stackOrder: 4,
    },
    {
      cellData: <ModifyActionDisplay apiKey={apiKey} />,
      stackOrder: 5,
    },
  ];
};

export default function ApiKeyTableClient({ apiKeys }: ApiKeyTableClientProps) {
  const t = useTranslations("ApiDashboard.table");

  const headerContent: TableCellData[] = [
    { cellData: t("headers.apiKey") },
    { cellData: t("headers.status") },
    { cellData: t("headers.secret") },
    { cellData: t("headers.created") },
    { cellData: t("headers.lastUsed") },
    { cellData: t("headers.modify") },
  ];

  const tableRowData = apiKeys.map((apiKey) => toApiKeyTableRow(apiKey));

  return (
    <TableWithResponsiveHeader
      headerContent={headerContent}
      tableRowData={tableRowData}
    />
  );
}
