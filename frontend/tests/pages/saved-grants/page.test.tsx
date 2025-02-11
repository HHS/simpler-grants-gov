import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import SavedGrants from "src/app/[locale]/saved-grants/page";
import { localeParams, mockUseTranslations } from "src/utils/testing/intlMocks";

jest.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve(mockUseTranslations),
}));

describe("Saved Grants page", () => {
  it("renders intro text for user with no saved grants", async () => {
    const component = await SavedGrants({ params: localeParams });
    render(component);

    const content = screen.getByText("SavedGrants.heading");

    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const component = await SavedGrants({ params: localeParams });
    const { container } = render(component);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
