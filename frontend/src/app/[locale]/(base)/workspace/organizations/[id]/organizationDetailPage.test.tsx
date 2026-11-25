import { render } from "@testing-library/react";
import OrganizationDetailPage from "src/app/[locale]/(base)/workspace/organizations/[id]/page";

import { JSX, ReactNode } from "react";

// Keep this type minimal so eslint doesn't treat it as propTypes
type OrganizationDetailMinimalProps = {
  organizationId: string;
  externalCollaboratorsEnabled: boolean;
};

const OrganizationDetailMock = jest.fn<
  void,
  [OrganizationDetailMinimalProps]
>();

jest.mock(
  "src/app/[locale]/(base)/workspace/organizations/[id]/_components/OrganizationDetail",
  () => ({
    OrganizationDetail: (props: unknown) => {
      OrganizationDetailMock(props as OrganizationDetailMinimalProps);
      return <div data-testid="organization-detail" />;
    },
  }),
);

jest.mock("src/components/core/AuthorizationGate", () => ({
  AuthorizationGate: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationDetails: () => Promise.resolve({}),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

const cookiesStub = { get: jest.fn() };

jest.mock("next/headers", () => ({
  cookies: () => Promise.resolve(cookiesStub),
}));

const isFeatureEnabledMock = jest.fn<boolean, [string, unknown, unknown]>(
  () => false,
);

jest.mock("src/services/featureFlags/FeatureFlagManager", () => ({
  featureFlagsManager: {
    isFeatureEnabled: (name: string, cookies: unknown, searchParams: unknown) =>
      isFeatureEnabledMock(name, cookies, searchParams),
  },
}));

type PageFn = (args: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string>>;
}) => Promise<JSX.Element>;

const PageTyped = OrganizationDetailPage as unknown as PageFn;

describe("OrganizationDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isFeatureEnabledMock.mockReturnValue(false);
  });

  it("passes the enableExternalCollaborators flag to the organization detail", async () => {
    isFeatureEnabledMock.mockReturnValue(true);
    const searchParams = { _ff: "enableExternalCollaborators:true" };

    render(
      await PageTyped({
        params: Promise.resolve({ id: "org-123" }),
        searchParams: Promise.resolve(searchParams),
      }),
    );

    // search params are passed so a flag set with ?_ff= applies on first load
    expect(isFeatureEnabledMock).toHaveBeenCalledWith(
      "enableExternalCollaborators",
      cookiesStub,
      searchParams,
    );
    expect(OrganizationDetailMock.mock.calls[0][0]).toMatchObject({
      organizationId: "org-123",
      externalCollaboratorsEnabled: true,
    });
  });

  it("hides the external collaborator column when the flag is off", async () => {
    render(
      await PageTyped({
        params: Promise.resolve({ id: "org-123" }),
      }),
    );

    expect(
      OrganizationDetailMock.mock.calls[0][0].externalCollaboratorsEnabled,
    ).toBe(false);
  });
});
