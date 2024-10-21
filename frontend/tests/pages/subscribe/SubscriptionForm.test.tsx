import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubscriptionForm from "src/app/[locale]/subscribe/SubscriptionForm";
import subscribeEmail from "src/app/actions";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

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
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
      ],
    ],
  };
});

describe("SubscriptionForm", () => {
  it("renders", () => {
    render(<SubscriptionForm />);

    const button = screen.getByRole("button", { name: "form.button" });

    expect(button).toBeInTheDocument();
  });
});
