import { act, render, screen, waitFor } from "@testing-library/react";
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

    render(<SubscriptionForm />);

    const button = screen.getByRole("button", { name: "form.button" });
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

    render(<SubscriptionForm />);

    const button = screen.getByRole("button", { name: "form.button" });
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

    render(<SubscriptionForm />);

    const button = screen.getByRole("button", { name: "form.button" });
    act(() => {
      button.click();
    });

    await waitFor(() => {
      const errorAlerts = screen.getAllByRole("alert");
      expect(errorAlerts.length).toBeGreaterThanOrEqual(1);
    });
  });
});
