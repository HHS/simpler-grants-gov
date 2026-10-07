"use client";

import { useClientFetch } from "src/hooks/useClientFetch";

import { useMemo, useState } from "react";

/*
  Shared save / unsave state for an opportunity.
  Tracks the locally toggled saved state, whether a request is in flight,
  whether the last request failed, and whether a result message should be shown.
*/
export const useOpportunitySave = ({
  opportunityId,
  opportunitySaved,
}: {
  opportunityId: string;
  opportunitySaved: boolean;
}) => {
  const { clientFetch: updateSaved } = useClientFetch<{ type: string }>(
    "Error updating saved opportunity",
  );

  const [locallySaved, setLocallySaved] = useState<boolean | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [savedError, setSavedError] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayAsSaved = useMemo(() => {
    return locallySaved === null ? opportunitySaved : locallySaved;
  }, [locallySaved, opportunitySaved]);

  const closeMessage = () => {
    setShowMessage(false);
  };

  const toggleSaved = () => {
    if (loading) return;
    setLoading(true);
    // clear the result of any previous attempt so a stale error or message isn't shown
    setSavedError(false);
    setShowMessage(false);

    const method = displayAsSaved ? "DELETE" : "POST";
    updateSaved("/api/user/saved-opportunities", {
      method,
      body: JSON.stringify({ opportunityId }),
    })
      .then((data) => {
        setLocallySaved(data.type === "save");
      })
      .catch((e) => {
        setSavedError(true);
        console.error(e);
      })
      .finally(() => {
        setShowMessage(true);
        setLoading(false);
      });
  };

  return {
    closeMessage,
    displayAsSaved,
    loading,
    savedError,
    showMessage,
    toggleSaved,
  };
};
