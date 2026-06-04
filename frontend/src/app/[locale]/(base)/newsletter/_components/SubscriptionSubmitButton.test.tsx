import { render, screen } from "@testing-library/react";
import { SubscriptionSubmitButton } from "src/app/[locale]/(base)/newsletter/_components/SubscriptionSubmitButton";

jest.mock("react-dom", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalModule = jest.requireActual("react-dom");

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...originalModule,
    useFormStatus: jest.fn(() => ({ pending: false })),
  };
});

describe("SubscriptionSubmitButton", () => {
  it("renders", () => {
    render(<SubscriptionSubmitButton />);

    const content = screen.getByText("form.button");

    expect(content).toBeInTheDocument();
  });
});
