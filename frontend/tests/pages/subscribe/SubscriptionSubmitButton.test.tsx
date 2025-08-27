import { render, screen } from "@testing-library/react";
import { mockMessages, useTranslationsMock } from "src/utils/testing/intlMocks";

import { SubscriptionSubmitButton } from "src/components/newsletter/SubscriptionSubmitButton";

jest.mock("react-dom", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual("react-dom");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...originalModule,
    useFormStatus: jest.fn(() => ({ pending: false })),
  };
});

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

describe("SubscriptionSubmitButton", () => {
  it("renders", () => {
    render(<SubscriptionSubmitButton />);

    const content = screen.getByText("form.button");

    expect(content).toBeInTheDocument();
  });
});
