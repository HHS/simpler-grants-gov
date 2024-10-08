import { render, screen } from "@testing-library/react";
import { SubscriptionSubmitButton } from "src/app/[locale]/subscribe/SubscriptionSubmitButton";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";

jest.mock('react-dom', () => {
    const originalModule =
      jest.requireActual('react-dom');
  
    return {
      ...originalModule,
      useFormStatus: jest.fn(() => ({ pending: false })),
    };
  });

jest.mock("next-intl", () => ({
    useTranslations: () => useTranslationsMock(),
    useMessages: () => mockMessages,
}));

describe('SubscriptionSubmitButton', () => {
    it('renders', () => {
        render(<SubscriptionSubmitButton />);

        const content = screen.getByText("form.button");

        expect(content).toBeInTheDocument();
    });
});