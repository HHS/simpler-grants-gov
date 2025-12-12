import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { ApplicationHistory } from "src/types/applicationResponseTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import historyMock from "stories/components/application/history.mock.json";

import { ApplicationHistoryTable } from "src/components/application/ApplicationHistoryTable";

const applicationHistory = historyMock as ApplicationHistory[];

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("ApplicationHistoryTable", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(
      <ApplicationHistoryTable applicationHistory={applicationHistory} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("Contains history entries", () => {
    render(<ApplicationHistoryTable applicationHistory={applicationHistory} />);

    expect(screen.getByText("application_created")).toBeInTheDocument();
    expect(screen.getByText("application_name_changed")).toBeInTheDocument();
    expect(screen.getByText("application_submitted")).toBeInTheDocument();
    expect(screen.getByText("application_submit_rejected")).toBeInTheDocument();
    expect(
      screen.getByText("attachment_added", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("attachment_deleted", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("user_added", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("form_updated", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("attachment_updated", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("submission_create")).toBeInTheDocument();
    expect(
      screen.getByText("user_updated", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("user_removed", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("organization_added")).toBeInTheDocument();
  });
});
