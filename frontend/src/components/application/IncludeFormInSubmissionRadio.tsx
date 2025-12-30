import { useClientFetch } from "src/hooks/useClientFetch";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Radio } from "@trussworks/react-uswds";

export const IncludeFormInSubmissionRadio = ({
  applicationId,
  formId,
  includeFormInApplicationSubmission,
  applicationStatus,
}: {
  applicationId: string;
  formId: string;
  includeFormInApplicationSubmission?: boolean | null;
  applicationStatus: string;
}) => {
  const router = useRouter();
  const { clientFetch } = useClientFetch<{
    is_included_in_submission: boolean;
  }>("Error submitting update include form in application submission");
  const [includeFormInSubmission, setIncludeFormInSubmission] = useState<
    boolean | null
  >(includeFormInApplicationSubmission ?? null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (value: string | unknown) => {
    const newValue = value === "Yes";
    setIncludeFormInSubmission(newValue); // eagerly set state.
    setLoading(true);
    clientFetch(`/api/applications/${applicationId}/forms/${formId}`, {
      method: "PUT",
      body: JSON.stringify({
        is_included_in_submission: newValue,
      }),
    })
      .then(({ is_included_in_submission }) => {
        if (is_included_in_submission === undefined) {
          throw new Error(
            "Error updating form to be included in submission. Value undefined",
          );
        }
      })
      .catch((err) => {
        // We will fall back to false on any errors to prevent blocking user workflows.
        setIncludeFormInSubmission(false);
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
        router.refresh();
      });
  };

  const radioValue = includeFormInSubmission
    ? "Yes"
    : includeFormInSubmission === false
      ? "No"
      : undefined;
  const disabledValue = applicationStatus === "submitted" ? true : loading;
  const radioId = `include-form${formId}-in-application-submission-radio`;
  return (
    <>
      <Radio
        id={`${radioId}-yes`}
        name={`${radioId}-yes`}
        value={"Yes"}
        disabled={disabledValue}
        onChange={(e) => handleChange(e.target.value)}
        label={"Yes"}
        checked={radioValue === "Yes"}
      />
      <Radio
        id={`${radioId}-no`}
        name={`${radioId}-no`}
        value={"No"}
        disabled={disabledValue}
        onChange={(e) => handleChange(e.target.value)}
        label={"No"}
        checked={radioValue === "No"}
      />
    </>
  );
};
