"use client";

import { useUser } from "src/services/auth/useUser";
import { startApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@trussworks/react-uswds";

const CreateApplicationButton = () => {
  const router = useRouter();
  const { user } = useUser();
  const disabled = !user?.token;

  const [loading, setLoading] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    if (!user?.token) return;
    setLoading(true);
    startApplication(user.token)
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
  }, [router, user]);
  return (
    <Button disabled={disabled} onClick={handleSubmit} type="submit">
      {loading ? "loading..." : "Create new application"}
    </Button>
  );
};

export default CreateApplicationButton;
