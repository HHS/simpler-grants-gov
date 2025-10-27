import { fetchApiKeys } from "src/services/fetch/fetchers/apiKeyFetcher";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import ApiKeyTable from "src/components/developer/apiDashboard/ApiKeyTable";
import { CreateApiKeyButton } from "src/components/developer/apiDashboard/CreateApiKeyButton";
import ServerErrorAlert from "src/components/ServerErrorAlert";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApiDashboardPage({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ApiDashboard" });
  let apiKeys;

  try {
    apiKeys = await fetchApiKeys();
  } catch (e) {
    console.error("Failed to fetch API keys:", e);
    return (
      <>
        <div className="grid-container">
          <h1 className="margin-top-0">{t("heading")}</h1>
        </div>
        <ServerErrorAlert callToAction={t("errorLoadingKeys")} />
      </>
    );
  }

  return (
    <div className="grid-container">
      <div className="flex-justify margin-bottom-4">
        <h1 className="margin-y-0">{t("heading")}</h1>
        <CreateApiKeyButton />
      </div>

      <ApiKeyTable apiKeys={apiKeys} />
    </div>
  );
}
