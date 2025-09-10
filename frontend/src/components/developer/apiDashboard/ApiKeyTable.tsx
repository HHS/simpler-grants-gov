import { ApiKey } from "src/types/apiKeyTypes";

import { useTranslations } from "next-intl";

import ApiKeyTableClient from "./ApiKeyTableClient";

interface ApiKeyTableProps {
  apiKeys: ApiKey[];
}

export default function ApiKeyTable({ apiKeys }: ApiKeyTableProps) {
  const t = useTranslations("ApiDashboard.table");

  if (!apiKeys.length) {
    return (
      <div className="usa-alert usa-alert--info">
        <div className="usa-alert__body">
          <p className="usa-alert__text">{t("emptyState")}</p>
        </div>
      </div>
    );
  }

  return <ApiKeyTableClient apiKeys={apiKeys} />;
}
