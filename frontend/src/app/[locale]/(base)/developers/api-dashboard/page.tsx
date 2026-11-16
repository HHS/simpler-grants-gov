import {
  ApiKeyAlert,
  ApiKeyAlertProvider,
} from "src/app/[locale]/(base)/developers/api-dashboard/_components/ApiKeyAlertProvider";
import ApiKeyTable from "src/app/[locale]/(base)/developers/api-dashboard/_components/ApiKeyTable";
import { CreateApiKeyButton } from "src/app/[locale]/(base)/developers/api-dashboard/_components/CreateApiKeyButton";
import { getSession } from "src/services/auth/session";
import { handleListApiKeys } from "src/services/fetch/fetchers/apiKeyFetcher";
import { logger } from "src/services/logger/simplerLogger";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import GeneralErrorAlert from "src/components/core/GeneralErrorAlert";
import { UnauthenticatedMessage } from "src/components/core/UnauthenticatedMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApiDashboardPage({ params }: LocalizedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ApiDashboard" });
  let apiKeyResponse;

  const session = await getSession();
  if (!session?.token) {
    return <UnauthenticatedMessage />;
  }

  try {
    apiKeyResponse = await handleListApiKeys(session.user_id);
  } catch (e) {
    logger.error({ err: e }, "Failed to fetch API keys");
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
    // wraps the whole page so opening any API key modal clears the API key confirmation
    <ApiKeyAlertProvider>
      <div className="grid-container margin-y-5">
        <h1>{t("heading")}</h1>
        <div className="margin-bottom-4">
          <CreateApiKeyButton />
        </div>

        <ApiKeyAlert />
        <ApiKeyTable apiKeys={apiKeyResponse.data} />
      </div>
    </ApiKeyAlertProvider>
  );
}
