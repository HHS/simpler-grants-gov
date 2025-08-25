"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";
import ApiKeyTable from "./ApiKeyTable";
import ApiKeyModal from "./ApiKeyModal";

export interface ApiKey {
  api_key_id: string;
  key_name: string;
  key_id: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
}

export default function ApiDashboard() {
  const { user } = useUser();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { clientFetch } = useClientFetch<{ data: ApiKey[] }>(
    "Error fetching API keys",
    { authGatedRequest: true }
  );

  const fetchApiKeys = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const response = await clientFetch(
        "/api/user/api-keys/list",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      
      if (response?.data) {
        setApiKeys(response.data);
      }
    } catch (err) {
      setError("Failed to load API keys");
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
    return (
      <div className="grid-container">
        <h1>API Dashboard</h1>
        <div>Loading API keys...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid-container">
        <h1>API Dashboard</h1>
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
        <h1 className="margin-y-0">API Dashboard</h1>
        <ApiKeyModal mode="create" onApiKeyUpdated={handleApiKeyCreated} />
      </div>
      
      <ApiKeyTable 
        apiKeys={apiKeys} 
        onApiKeyRenamed={handleApiKeyRenamed}
      />
    </div>
  );
}
