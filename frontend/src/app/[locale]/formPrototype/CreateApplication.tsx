"use client";

import { useUser } from "src/services/auth/useUser";
import { startApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";

import { useCallback, useState } from "react";
import { Button } from "@trussworks/react-uswds";

const CreateApplicatinButton = () => {
  const { user } = useUser();

  const [loading, setLoading] = useState<boolean>();

  const handleSubmit = useCallback(() => {
    setLoading(true);
    console.log("wtf");
    startApplication("test")
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);
  return (
    <Button onClick={handleSubmit} type="submit">
      {loading ? "loading..." : "Create new application"}
    </Button>
  );
};

export default CreateApplicatinButton;
