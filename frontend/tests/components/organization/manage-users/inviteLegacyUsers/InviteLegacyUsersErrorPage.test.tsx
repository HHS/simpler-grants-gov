import { render, screen } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import { axe } from "jest-axe";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { InviteLegacyUsersErrorPage } from "src/components/manageUsers/inviteLegacyUsers/InviteLegacyUsersErrorPage";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

type Breadcrumb = { title: string; path: string };
type BreadcrumbsProps = { breadcrumbList: Breadcrumb[] };

const BreadcrumbsMock = jest.fn<void, [BreadcrumbsProps]>();

jest.mock("src/components/Breadcrumbs", () => ({
  __esModule: true,
  default: (props: BreadcrumbsProps) => {
    BreadcrumbsMock(props);
    return <nav data-testid="breadcrumbs" />;
  },
}));

describe("InviteLegacyUsersErrorPage", () => {
  it("shows the appropriate error message", () => {
    const component = InviteLegacyUsersErrorPage({
      organizationId: "org-123",
    });
    render(component);
    expect(screen.getByText("dataLoadingError")).toBeVisible();
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(
      <InviteLegacyUsersErrorPage organizationId="org-123" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
