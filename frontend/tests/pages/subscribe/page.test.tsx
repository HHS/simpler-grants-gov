import { render, screen, waitFor } from "@testing-library/react";
import { identity } from "lodash";
import Subscribe from "src/app/[locale]/subscribe/page";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";

//TODO: This mock is not working as expected, I suspect
jest.mock("react-dom", () => {
  const originalModule = jest.requireActual("react-dom");

  return {
    ...originalModule,
    useFormStatus: jest.fn(() => ({ pending: false })),
    useFormState: () => [
      [
        {
          // Return a mock state object
          errorMessage: "errors.server",
          validationErrors: {
            name: ["errors.missing_name"],
            email: ["errors.missing_email", "errors.invalid_email"],
          },
        },
        // Mock setState function
        () => {},
      ],
    ],
  };
});

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  unstable_setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

jest.mock("src/app/actions", () => ({
  __esModule: true,
  default: jest.fn(), // The server action that is called when the form is submitted
}));

describe("Subscribe", () => {
  it("renders intro text", () => {
    render(<Subscribe />);

    const content = screen.getByText("Subscribe.intro");

    expect(content).toBeInTheDocument();
  });

  // it("passes accessibility scan", async () => {
  //   const { container } = render(<Subscribe />);
  //   const results = await waitFor(() => axe(container));

  //   expect(results).toHaveNoViolations();
  // });
});
