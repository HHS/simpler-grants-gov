import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubscriptionForm from "src/app/[locale]/subscribe/SubscriptionForm";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";

jest.mock('react-dom', () => {
    const originalModule =
      jest.requireActual('react-dom');
  
    return {
      ...originalModule,
      useFormStatus: jest.fn(() => ({ pending: false })),
      useFormState: () => [
        [
          {
            // Return a mock state object
            errorMessage: "",
            validationErrors: {name: ['errors.missing_name'], email: ['errors.missing_email', 'errors.invalid_email']},
          },
          // Mock setState function
          jest.fn(),
        ],
      ],
    };
  });

jest.mock("next-intl", () => ({
    useTranslations: () => useTranslationsMock(),
    useMessages: () => mockMessages,
}));

describe('SubscriptionForm', () => {
    it('renders', () => {
        render(<SubscriptionForm />);

        const button = screen.getByRole('button', { name: 'form.button' });

        expect(button).toBeInTheDocument();
    });

    it('shows validation errors', async () => {
        render(<SubscriptionForm />);

        const button = screen.getByRole('button', { name: 'form.button' });

        await userEvent.click(button);

        const validationErrors = screen.getAllByTestId('errorMessage');

        expect(validationErrors).toHaveLength(2);
    });

    it('shows error message on server failure', async () => {
        render(<SubscriptionForm />);

        const name = screen.getByRole('textbox', { name: 'form.name (form.req)' });
        const email = screen.getByRole('textbox', { name: 'form.email (form.req)' });

        const button = screen.getByRole('button', { name: 'form.button' });

        await userEvent.type(name, 'Iris');
        await userEvent.type(email, 'iris@example.com');

        await userEvent.click(button);

        const errorMessage = screen.getByText('errors.server');

        expect(errorMessage).toBeInTheDocument();
    });
});