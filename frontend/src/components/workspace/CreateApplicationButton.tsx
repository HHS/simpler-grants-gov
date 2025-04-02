"use client";

import { startApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@trussworks/react-uswds";

const CreateApplicatinButton = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    setLoading(true);
    startApplication("insecuretoken")
      .then((data) => {
        const { applicationId } = data;
        router.push(`/formPrototype/${applicationId}`);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);
  return (
    <Button onClick={handleSubmit} type="submit">
      {loading ? "loading..." : "Create new application"}
    </Button>
  );
};

export default CreateApplicatinButton;
