import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";

// Ensure the client fetch used by the component delegates to `global.fetch`,
// which the tests mock below. Must mock before importing the component.
jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: async (url: string, options?: RequestInit) => {
      const res = await (global.fetch as unknown as jest.Mock)(url, options);
      return res.json();
    },
  }),
}));

import SubscriptionForm from "src/app/[locale]/(base)/newsletter/_components/SubscriptionForm";

const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

describe("SubscriptionForm", () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("renders", () => {
    render(<SubscriptionForm />);

    const button = screen.getByRole("button", { name: "form.button" });

    expect(button).toBeInTheDocument();
  });

  it("calls /api/newsletter/subscribe on submit", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      }),
    ) as jest.Mock;

    const { container } = render(<SubscriptionForm />);

    const nameInput = container.querySelector('#name') as HTMLInputElement;
    const emailInput = container.querySelector('#email') as HTMLInputElement;
    const button = screen.getByRole("button", { name: "form.button" });

    act(() => {
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    });

    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/newsletter/subscribe",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("redirects to confirmation page on success", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      }),
    ) as jest.Mock;

    const { container } = render(<SubscriptionForm />);

    const nameInput = container.querySelector('#name') as HTMLInputElement;
    const emailInput = container.querySelector('#email') as HTMLInputElement;
    const button = screen.getByRole("button", { name: "form.button" });

    act(() => {
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    });

    act(() => {
      button.click();
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/newsletter/confirmation");
    });
  });

  it("shows server error message on failure", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: false, errorCode: "server" }),
      }),
    ) as jest.Mock;

    const { container } = render(<SubscriptionForm />);

    const nameInput = container.querySelector('#name') as HTMLInputElement;
    const emailInput = container.querySelector('#email') as HTMLInputElement;
    const button = screen.getByRole("button", { name: "form.button" });

    act(() => {
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    });

    act(() => {
      button.click();
    });

    await waitFor(() => {
      const errorAlerts = screen.getAllByRole("alert");
      expect(errorAlerts.length).toBeGreaterThanOrEqual(1);
    });
  });
});
