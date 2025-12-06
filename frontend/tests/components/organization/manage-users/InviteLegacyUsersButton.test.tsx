import { render, screen } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import { axe } from "jest-axe";
import { mockUseTranslations } from "src/utils/testing/intlMocks";

import { InviteLegacyUsersButton } from "src/components/manageUsers/InviteLegacyUsersButton";

jest.mock("next-intl/server", () => ({
  getTranslations: () => mockUseTranslations,
}));

describe("InviteLegacyUserButton", () => {
  it("confirm the URL is correct", async () => {
    const organizationId = "org-123";
    const component = await InviteLegacyUsersButton({ organizationId });
    render(component);

    const legacyInviteButton = await screen.findByRole("link");

    expect(legacyInviteButton).toBeVisible();
    expect(legacyInviteButton).toHaveAttribute(
      "href",
      `/organization/${organizationId}/manage-users/legacy`,
    );
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(
      <InviteLegacyUsersButton organizationId="org-123" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
