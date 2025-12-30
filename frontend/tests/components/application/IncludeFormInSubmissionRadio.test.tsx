import { render, screen } from "@testing-library/react";



import { IncludeFormInSubmissionRadio } from "src/components/application/IncludeFormInSubmissionRadio";


const clientFetchMock = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

describe("IncludeFormInSubmissionRadio", () => {
  const applicationId = "app-123";
  const formId = "form-456";
  const applicationStatus = "submitted";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with value 'Yes' when includeFormInApplicationSubmission is true", () => {
    render(
      <IncludeFormInSubmissionRadio
        applicationId={applicationId}
        formId={formId}
        includeFormInApplicationSubmission={true}
        applicationStatus={applicationStatus}
      />,
    );
    const yesRadio = screen.getByDisplayValue("Yes");
    expect(yesRadio).toBeChecked();
  });

  it("renders with value 'No' when includeFormInApplicationSubmission is false", () => {
    render(
      <IncludeFormInSubmissionRadio
        applicationId={applicationId}
        formId={formId}
        includeFormInApplicationSubmission={false}
        applicationStatus={applicationStatus}
      />,
    );
    const noRadio = screen.getByDisplayValue("No");
    expect(noRadio).toBeChecked();
  });

  it("renders with no selection when includeFormInApplicationSubmission is null", () => {
    render(
      <IncludeFormInSubmissionRadio
        applicationId={applicationId}
        formId={formId}
        includeFormInApplicationSubmission={null}
        applicationStatus={applicationStatus}
      />,
    );
    const yesRadio = screen.getByDisplayValue("Yes");
    const noRadio = screen.getByDisplayValue("No");
    expect(yesRadio).not.toBeChecked();
    expect(noRadio).not.toBeChecked();
  });
});
