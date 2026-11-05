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
      <>
        <h2>{t("emptyStateHeading")}</h2>
        <p>{t("emptyStateDescription")}</p>
      </>
    );
  }

  return <ApiKeyTableClient apiKeys={apiKeys} />;
}
