import { render, screen } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import {
  generateMetadata,
  ManageUsersPage,
} from "src/app/[locale]/(base)/organization/[id]/manage-users/page";

jest.mock("src/components/manageUsers/ManageUsersPageContent", () => ({
  ManageUsersPageContent: ({ organizationId }: { organizationId: string }) => (
    <div data-testid="manage-users-page-content">
      Manage users for org: {organizationId}
    </div>
  ),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => {
    if (key === "ManageUsers.pageTitle") return "Manage users page title";
    if (key === "Index.metaDescription") return "Manage users meta description";
    return key;
  },
}));

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default: (
    WrappedComponent: React.ComponentType<Record<string, unknown>>,
    _featureFlagName: string,
    _onDisabled: () => void,
  ) =>
    function Wrapped(props: Record<string, unknown>) {
      return <WrappedComponent {...props} />;
    },
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("ManageUsersPage", () => {
  it("renders the manage users page content with the organizationId", async () => {
    const params = Promise.resolve({ locale: "en", id: "org-123" });

    const component = await ManageUsersPage({ params });
    render(component);

    const content = await screen.findByTestId("manage-users-page-content");
    expect(content).toBeVisible();
    expect(content).toHaveTextContent("Manage users for org: org-123");
  });
});

describe("generateMetadata", () => {
  it("returns translated title and description", async () => {
    const params = Promise.resolve({ locale: "en", id: "org-123" });

    const result = await generateMetadata({ params });

    expect(result).toEqual({
      title: "Manage users page title",
      description: "Manage users meta description",
    });
  });
});
