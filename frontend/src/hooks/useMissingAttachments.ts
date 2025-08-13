import { useState, useEffect } from "react";
import { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import { Attachment, FormsWithMissingAttachments } from "src/types/attachmentTypes";
import { getFormsWithMissingAttachments } from "src/utils/attachment/getFormsWithMissingAttachments";

export function useMissingAttachments(
  token: string | null,
  applicationForms: ApplicationFormDetail[],
  applicationId: string,
  applicationAttachments: Attachment[],
) {
  const [missingAttachments, setMissingAttachments] = useState<FormsWithMissingAttachments[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!token || !applicationId || applicationForms.length === 0) {
      setMissingAttachments([]);
      return;
    }

    setLoading(true);
    setError(null);

    getFormsWithMissingAttachments(token, applicationForms, applicationId, applicationAttachments)
      .then(setMissingAttachments)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [token, applicationForms, applicationId, applicationAttachments]);

  return { missingAttachments, loading, error };
}
