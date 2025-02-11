import { render, screen } from "@testing-library/react";
import { ValidationError } from "src/errors";
import { mockMessages, useTranslationsMock } from "src/utils/testing/intlMocks";

import SubscriptionForm from "src/components/subscribe/SubscriptionForm";

const mockSubscribeEmail = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

jest.mock("react-dom", () => {
  return {
    ...jest.requireActual<typeof import("react-dom")>("react-dom"),
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

jest.mock("src/app/[locale]/subscribe/actions", () => ({
  subscribeEmail: (...args) => mockSubscribeEmail(...args),
}));

describe("SubscriptionForm", () => {
  it("renders", () => {
    render(<SubscriptionForm />);

    const button = screen.getByRole("button", { name: "form.button" });

    expect(button).toBeInTheDocument();
  });

  it("calls subscribeEmail action on submit", () => {
    mockSubscribeEmail.mockImplementation(() => Promise.resolve());
    render(<SubscriptionForm />);

    const button = screen.getByRole("button", { name: "form.button" });
    button.click();

    expect(mockSubscribeEmail).toHaveBeenCalledWith(
      { errorMessage: "", validationErrors: {} },
      expect.any(FormData),
    );
  });

  it("shows relevant errors returned by action", () => {
    mockSubscribeEmail.mockImplementation(() =>
      Promise.resolve({
        errorMessage: "an error message",
        validationErrors: {
          name: "bad name, sorry",
          email: "this really was not a valid email",
        },
      }),
    );
    render(<SubscriptionForm />);

    const button = screen.getByRole("button", { name: "form.button" });
    button.click();

    expect(mockSubscribeEmail).toHaveBeenCalled();
  });
});
