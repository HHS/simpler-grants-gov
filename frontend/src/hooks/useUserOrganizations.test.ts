import { renderHook, waitFor } from "@testing-library/react";
import type { UserOrganization } from "src/types/userTypes";

import { useUserOrganizations } from "./useUserOrganizations";

type ClientFetchFunction = (
  input: string,
  init?: RequestInit,
) => Promise<unknown>;

const clientFetchMock: jest.MockedFunction<ClientFetchFunction> = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: clientFetchMock,
  }),
}));

function buildOrganization(
  organizationId: string,
  legalBusinessName: string,
): UserOrganization {
  return {
    organization_id: organizationId,
    sam_gov_entity: { legal_business_name: legalBusinessName },
  } as UserOrganization;
}

describe("useUserOrganizations", () => {
  beforeEach(() => {
    clientFetchMock.mockReset();
  });

  it("returns organizations on success", async () => {
    clientFetchMock.mockResolvedValue([
      buildOrganization("org-1", "Alpha Org"),
    ]);

    const { result } = renderHook(() => useUserOrganizations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.organizations).toHaveLength(1);
    expect(result.current.organizations[0]?.organization_id).toBe("org-1");
    expect(result.current.hasError).toBe(false);

    expect(clientFetchMock).toHaveBeenCalledWith("/api/user/organizations", {
      method: "GET",
    });
  });

  it("returns empty organizations and hasError=true on failure", async () => {
    clientFetchMock.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useUserOrganizations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.organizations).toEqual([]);
    expect(result.current.hasError).toBe(true);
  });

  it("treats non-array responses as empty without throwing", async () => {
    clientFetchMock.mockResolvedValue({ unexpected: true });

    const { result } = renderHook(() => useUserOrganizations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.organizations).toEqual([]);
    expect(result.current.hasError).toBe(false);
  });
});
