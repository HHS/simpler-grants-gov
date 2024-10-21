import { render, screen } from "@testing-library/react";
import { mockMessages, useTranslationsMock } from "tests/utils/intMocks";

import { SubscriptionSubmitButton } from "src/components/subscribe/SubscriptionSubmitButton";

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
