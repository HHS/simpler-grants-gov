import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SubscriptionForm from "src/app/[locale]/(base)/newsletter/_components/SubscriptionForm";

// Mock useClientFetch to delegate to the already-mocked `global.fetch` in tests.
jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: async (url: string, options?: RequestInit) => {
      const fn = global.fetch as unknown as jest.MockedFunction<typeof fetch>;
      const res = await fn(url, options);
      // `Response.json()` returns `any`; allow this in the test mock
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res.json();
    },
  }),
}));

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
      } as unknown as Response),
    ) as unknown as typeof global.fetch;

    render(<SubscriptionForm />);

    const inputs = screen.getAllByTestId("textInput");
    const nameInput = inputs.find((i) => i.id === "name")!;
    const emailInput = inputs.find((i) => i.id === "email")!;
    const button = screen.getByRole("button", { name: "form.button" });

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    fireEvent.click(button);

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
      } as unknown as Response),
    ) as unknown as typeof global.fetch;

    render(<SubscriptionForm />);

    const inputs = screen.getAllByTestId("textInput");
    const nameInput = inputs.find((i) => i.id === "name")!;
    const emailInput = inputs.find((i) => i.id === "email")!;
    const button = screen.getByRole("button", { name: "form.button" });

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/newsletter/confirmation");
    });
  });

  it("shows server error message on failure", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: false, errorCode: "server" }),
      } as unknown as Response),
    ) as unknown as typeof global.fetch;

    render(<SubscriptionForm />);

    const inputs = screen.getAllByTestId("textInput");
    const nameInput = inputs.find((i) => i.id === "name")!;
    const emailInput = inputs.find((i) => i.id === "email")!;
    const button = screen.getByRole("button", { name: "form.button" });

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    fireEvent.click(button);

    await waitFor(() => {
      const errorAlerts = screen.getAllByRole("alert");
      expect(errorAlerts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows a field-level email error when the API returns invalidEmail", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({ success: false, errorCode: "invalidEmail" }),
      } as unknown as Response),
    ) as unknown as typeof global.fetch;

    render(<SubscriptionForm />);

    const inputs = screen.getAllByTestId("textInput");
    const nameInput = inputs.find((i) => i.id === "name")!;
    const emailInput = inputs.find((i) => i.id === "email")!;
    const button = screen.getByRole("button", { name: "form.button" });

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("errors.invalidEmail")).toBeInTheDocument();
    });
  });

  it("shows a try-again message when the API returns tooManyRequests", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({ success: false, errorCode: "tooManyRequests" }),
      } as unknown as Response),
    ) as unknown as typeof global.fetch;

    render(<SubscriptionForm />);

    const inputs = screen.getAllByTestId("textInput");
    const nameInput = inputs.find((i) => i.id === "name")!;
    const emailInput = inputs.find((i) => i.id === "email")!;
    const button = screen.getByRole("button", { name: "form.button" });

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("errors.tooManyRequests")).toBeInTheDocument();
    });
  });
});
