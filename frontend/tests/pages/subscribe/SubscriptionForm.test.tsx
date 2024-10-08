import { render, screen } from "@testing-library/react";
import SubscriptionForm from "src/app/[locale]/subscribe/SubscriptionForm";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";

jest.mock('react-dom', () => {
    const originalModule =
      jest.requireActual('react-dom');
  
    return {
      ...originalModule,
      useFormStatus: jest.fn(() => ({ pending: false })),
      useFormState: jest.fn(() => ([{
        errorMessage: '',
        validationErrors: {}
      }, (state: any, payload: any) => '']),),
    };
  });

jest.mock("next-intl", () => ({
    useTranslations: () => useTranslationsMock(),
    useMessages: () => mockMessages,
}));

describe('SubscriptionForm', () => {
    it('renders', () => {
        render(<SubscriptionForm />);

        const content = screen.getByText("form.button");

        expect(content).toBeInTheDocument();
    });

    it('shows errors', () => {
        render(<SubscriptionForm />);

        const content = screen.getByRole(input, { name: 'form.name' });

        expect(content).toBeInTheDocument();
    });
});