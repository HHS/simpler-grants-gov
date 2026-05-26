import { getSession } from "src/services/auth/session";
import { handleListApiKeys } from "src/services/fetch/fetchers/apiKeyFetcher";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import GeneralErrorAlert from "src/components/core/GeneralErrorAlert";
import ApiKeyTable from "src/components/developers/apiDashboard/ApiKeyTable";
import { CreateApiKeyButton } from "src/components/developers/apiDashboard/CreateApiKeyButton";
import Unauthenticated from "../../unauthenticated/page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApiDashboardPage({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ApiDashboard" });
  let apiKeys;

  const session = await getSession();
  if (!session?.token) {
    return <Unauthenticated />;
  }

  try {
    apiKeys = await handleListApiKeys(session.user_id);
  } catch (e) {
    console.error("Failed to fetch API keys:", e);
    return (
      <>
        <div className="grid-container margin-y-5">
          <h1 className="margin-top-0">{t("heading")}</h1>
        </div>
        <GeneralErrorAlert callToAction={t("errorLoadingKeys")} />
      </>
    );
  }

  return (
    <div className="grid-container margin-y-5">
      <div className="flex-justify margin-bottom-4">
        <h1>{t("heading")}</h1>
        <CreateApiKeyButton />
      </div>

      <ApiKeyTable apiKeys={apiKeys} />
    </div>
  );
}
