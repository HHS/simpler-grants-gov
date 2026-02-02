"use client";

import {
  ApplicationSubmitApiResponse,
  ApplicationSubmitResponse,
} from "src/types/applicationResponseTypes";

export const submitApplication = async (
  applicationId: string,
): Promise<ApplicationSubmitResponse> => {
  const res = await fetch(`/api/applications/${applicationId}/submit`, {
    method: "POST",
  });

  if ((res.ok && res.status === 200) || res.status === 422) {
    const message = (await res.json()) as ApplicationSubmitApiResponse;
    return message.data;
  } else {
    throw new Error(`Error submitting application: ${res.status}`, {
      cause: `${res.status}`,
    });
  }
};
