"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import {
  getApiKeysEndpoint,
  getApiKeysRequestConfig,
} from "src/services/fetch/fetchers/apiKeyClientHelpers";
import { ApiKey } from "src/types/apiKeyTypes";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@trussworks/react-uswds";

import ApiKeyModal from "src/components/developer/apiDashboard/ApiKeyModal";
import ApiKeyTable from "src/components/developer/apiDashboard/ApiKeyTable";
import { USWDSIcon } from "src/components/USWDSIcon";
import Spinner from "src/components/Spinner";

export default function ApiDashboardPage() {
  const { user } = useUser();
  const t = useTranslations("ApiDashboard");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { clientFetch } = useClientFetch<{ data: ApiKey[] }>(
    "Error fetching API keys",
    { authGatedRequest: true },
  );

  const fetchApiKeys = async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      const response = await clientFetch(
        getApiKeysEndpoint(),
        getApiKeysRequestConfig(),
      );

      if (response?.data) {
        setApiKeys(response.data);
      }
    } catch (err) {
      setError(t("errorLoadingKeys"));
      console.error("Error fetching API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [user?.user_id]);

  const handleApiKeyCreated = () => {
    fetchApiKeys(); // Refresh the list
  };

  const handleApiKeyRenamed = () => {
    fetchApiKeys(); // Refresh the list
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="grid-container">
        <div className="usa-alert usa-alert--error">
          <div className="usa-alert__body">
            <p className="usa-alert__text">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid-container">
      <div className="display-flex flex-justify margin-bottom-4">
        <h1 className="margin-y-0">{t("heading")}</h1>
        <ApiKeyModal mode="create" onApiKeyUpdated={handleApiKeyCreated} />
      </div>

      <ApiKeyTable apiKeys={apiKeys} onApiKeyRenamed={handleApiKeyRenamed} />
    </div>
  );
}
