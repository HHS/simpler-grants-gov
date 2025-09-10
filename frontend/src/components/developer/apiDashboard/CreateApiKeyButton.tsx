"use client";

import { useRouter } from "next/navigation";

import ApiKeyModal from "./ApiKeyModal";

export function CreateApiKeyButton() {
  const router = useRouter();

  const handleApiKeyCreated = () => {
    router.refresh();
  };

  return <ApiKeyModal mode="create" onApiKeyUpdated={handleApiKeyCreated} />;
}
