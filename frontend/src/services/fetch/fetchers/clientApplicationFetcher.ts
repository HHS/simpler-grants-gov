"use client";

interface ClientApplicationStartResponse {
  message: string;
  applicationId: string;
}

export const startApplication = async (
  token?: string,
): Promise<ClientApplicationStartResponse> => {
  if (!token) {
    throw new Error(`Error starting application`);
  }
  const res = await fetch("/api/applications/start", {
    method: "POST",
  });
  if (res.ok && res.status === 200) {
    return (await res.json()) as ClientApplicationStartResponse;
  } else {
    throw new Error(`Error starting application: ${res.status}`);
  }
};
