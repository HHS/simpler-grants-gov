"use client";

import {
  ApplicationSubmitApiResponse,
  FormValidationErrors,
} from "src/types/applicationResponseTypes";

interface ClientApplicationStartResponse {
  message: string;
  applicationId: string;
}

export const startApplication = async (
  applicationName: string,
  competitionId: string,
  token?: string,
): Promise<ClientApplicationStartResponse> => {
  if (!token) {
    throw new Error(`Error starting application`);
  }
  const res = await fetch("/api/applications/start", {
    method: "POST",
    body: JSON.stringify({
      applicationName,
      competitionId,
    }),
  });

  if (res.ok && res.status === 200) {
    return (await res.json()) as ClientApplicationStartResponse;
  } else {
    throw new Error(`Error starting application: ${res.status}`, {
      cause: `${res.status}`,
    });
  }
};

export const submitApplication = async (
  applicationId: string,
): Promise<FormValidationErrors> => {
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
