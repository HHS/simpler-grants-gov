import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubscriptionForm from "src/app/[locale]/subscribe/SubscriptionForm";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";
import subscribeEmail from 'src/app/actions';

jest.mock("next-intl", () => ({
    useTranslations: () => useTranslationsMock(),
    useMessages: () => mockMessages,
}));

jest.mock("src/app/actions", () => ({
  subscribeEmail: jest.fn(),
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
          validationErrors: {name: ['errors.missing_name'], email: ['errors.missing_email', 'errors.invalid_email']},
        },
        // Mock setState function
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        (() => {}),
      ],
    ],
  };
});

//https://stackoverflow.com/questions/66110028/how-to-test-button-that-call-submit-form-using-jest-and-react-testing-library
const requestSubmit = jest.fn();

   it('shows validation errors', async () => {
         render(<SubscriptionForm />);
         requestSubmit.mockImplementation(event => {
          event.preventDefault();
        });
         const button = screen.getByRole('button', { name: 'form.button' });
  
         await userEvent.click(button);
  
         const validationErrors = screen.getAllByTestId('errorMessage');
  
         console.log(screen)
         console.log(validationErrors)
  
         expect(validationErrors).toHaveLength(2);
    });

describe('SubscriptionForm', () => {
    it('renders', () => {
        render(<SubscriptionForm />);

        const button = screen.getByRole('button', { name: 'form.button' });

        expect(button).toBeInTheDocument();
    });


});
