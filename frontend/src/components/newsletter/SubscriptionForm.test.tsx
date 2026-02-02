import { act, render, screen } from "@testing-library/react";
import { mockMessages, useTranslationsMock } from "src/utils/testing/intlMocks";

import SubscriptionForm from "src/components/newsletter/SubscriptionForm";

const mockSubscribeEmail = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

jest.mock("src/app/[locale]/(base)/newsletter/actions", () => ({
  subscribeEmail: (...args: unknown[]): unknown => mockSubscribeEmail(...args),
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
    act(() => {
      button.click();
    });

    expect(mockSubscribeEmail).toHaveBeenCalledWith(
      { errorMessage: "", validationErrors: {} },
      expect.any(FormData),
    );
  });

  // unclear why, but React server actions are still not working with Jest here
  // action function is replaced with `javascript:throw new Error('A React form was unexpectedly submitted')`
  // See also https://github.com/facebook/react/blob/f83903bfcc5a61811bd1b69b14f0ebbac4754462/packages/react-dom-bindings/src/client/ReactDOMComponent.js#L468
  // - DWS 2-12-25
  it.skip("shows relevant errors returned by action", () => {
    mockSubscribeEmail.mockImplementation(() =>
      Promise.resolve({
        errorMessage: "an error message",
        validationErrors: {
          name: "bad name, sorry",
          email: "this really was not a valid email",
        },
      }),
    );
    const { rerender } = render(<SubscriptionForm />);

    const button = screen.getByRole("button", { name: "form.button" });
    act(() => {
      button.click();
    });

    rerender(<SubscriptionForm />);

    const errorAlerts = screen.getAllByRole("alert");

    expect(errorAlerts).toHaveLength(2);
    expect(errorAlerts[0]).toHaveTextContent("bad name, sorry");
    expect(errorAlerts[1]).toHaveTextContent(
      "this really was not a valid email",
    );
  });
});
