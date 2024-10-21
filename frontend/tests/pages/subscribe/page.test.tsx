import { identity } from "lodash";
import Subscribe from "src/app/[locale]/subscribe/page";
import { render, screen } from "tests/react-utils";

jest.mock("react-dom", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual("react-dom");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
        () => {
          ("");
        },
      ],
    ],
  };
});

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  unstable_setRequestLocale: identity,
}));

describe("Subscribe", () => {
  it("renders intro text", () => {
    render(<Subscribe />);

    const content = screen.getByText(
      "Subscribe to get Simpler.Grants.gov project updates in your inbox!",
    );

    expect(content).toBeInTheDocument();
  });
});
