// Client-side API key fetching helpers for use with useClientFetch

export const getApiKeysEndpoint = () => "/api/user/api-keys/list";

export const getApiKeysRequestConfig = () => ({
  method: "POST" as const,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
});
