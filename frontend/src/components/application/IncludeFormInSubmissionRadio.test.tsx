import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "tests/react-utils";

import { IncludeFormInSubmissionRadio } from "./IncludeFormInSubmissionRadio";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolveOuter!: (value: T) => void;
  let rejectOuter!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolve, reject) => {
    resolveOuter = resolve;
    rejectOuter = reject;
  });

  return { promise, resolve: resolveOuter, reject: rejectOuter };
}

const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

type ClientFetch = (
  url: string,
  options?: RequestInit,
) => Promise<{ is_included_in_submission: boolean }>;

const clientFetchMock: jest.MockedFunction<ClientFetch> = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: clientFetchMock,
  }),
}));

describe("IncludeFormInSubmissionRadio", () => {
  const applicationId = "app-123";
  const formId = "form-456";

  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    refreshMock.mockClear();
    clientFetchMock.mockReset();
    consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation((): void => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("clicking Yes optimistically checks Yes, disables radios, PUTs correct payload, then refreshes", async () => {
    const user = userEvent.setup();
    const req = deferred<{ is_included_in_submission: boolean }>();

    clientFetchMock.mockReturnValue(req.promise);

    render(
      <IncludeFormInSubmissionRadio
        applicationId={applicationId}
        formId={formId}
        includeFormInApplicationSubmission={false}
      />,
    );

    await user.click(screen.getByLabelText("Yes"));

    expect(screen.getByLabelText("Yes")).toBeChecked();

    await waitFor(() => {
      expect(screen.getByLabelText("Yes")).toBeDisabled();
    });

    await waitFor(() => {
      expect(screen.getByLabelText("No")).toBeDisabled();
    });

    expect(clientFetchMock).toHaveBeenCalledWith(
      `/api/applications/${applicationId}/forms/${formId}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ is_included_in_submission: true }),
      }),
    );

    req.resolve({ is_included_in_submission: true });

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByLabelText("Yes")).toBeEnabled();
    expect(screen.getByLabelText("No")).toBeEnabled();
  });

  it("on failure: stays optimistic briefly, then falls back to No and refreshes", async () => {
    const user = userEvent.setup();
    const req = deferred<{ is_included_in_submission: boolean }>();

    clientFetchMock.mockReturnValue(req.promise);

    render(
      <IncludeFormInSubmissionRadio
        applicationId={applicationId}
        formId={formId}
        includeFormInApplicationSubmission={false}
      />,
    );

    await user.click(screen.getByLabelText("Yes"));
    expect(screen.getByLabelText("Yes")).toBeChecked();

    req.reject(new Error("network"));

    await waitFor(() => {
      expect(screen.getByLabelText("No")).toBeChecked();
    });

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    expect(console.error).toHaveBeenCalled();
  });

  it("starts with undefined when includeFormInApplicationSubmission is null", () => {
    render(
      <IncludeFormInSubmissionRadio
        applicationId={applicationId}
        formId={formId}
        includeFormInApplicationSubmission={null}
      />,
    );

    expect(screen.getByLabelText("Yes")).not.toBeChecked();
    expect(screen.getByLabelText("No")).not.toBeChecked();
  });
});
