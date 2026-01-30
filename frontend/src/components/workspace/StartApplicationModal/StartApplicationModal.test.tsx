import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeUserOrganization } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { createRef } from "react";

import { StartApplicationModal } from "src/components/workspace/StartApplicationModal/StartApplicationModal";

const mockRouterPush = jest.fn();
const clientFetchMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

describe("StartApplicationModal", () => {
  beforeEach(() => {
    mockRouterPush.mockResolvedValue(true);
    clientFetchMock.mockReset();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("displays validation error if submitted without a name", async () => {
    render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
        modalRef={createRef()}
        applicantTypes={["individual"]}
        organizations={[]}
        token={"a token"}
        loading={false}
      />,
    );

    expect(
      screen.queryByText("fields.name.validationError"),
    ).not.toBeInTheDocument();

    const saveButton = await screen.findByTestId("application-start-save");
    await userEvent.click(saveButton);

    const validationError = await screen.findByText(
      "fields.name.validationError",
    );

    expect(validationError).toBeInTheDocument();
  });

  it("allows starting without an organization and sends intendsToAddOrganization=true", async () => {
    clientFetchMock.mockResolvedValue({ applicationId: "999" });
    render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
        modalRef={createRef()}
        applicantTypes={["organization"]}
        organizations={[fakeUserOrganization]}
        token={"a token"}
        loading={false}
      />,
    );

    const saveButton = await screen.findByTestId("application-start-save");
    const input = await screen.findByTestId("textInput");

    await userEvent.type(input, "new application");
    await userEvent.click(saveButton);

    expect(clientFetchMock).toHaveBeenCalledWith("/api/applications/start", {
      method: "POST",
      body: JSON.stringify({
        applicationName: "new application",
        competitionId: "1",
        intendsToAddOrganization: true,
      }),
    });
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(`/applications/999`);
    });
  });
  it("displays an API error if API returns an error", async () => {
    clientFetchMock.mockRejectedValue(new Error());
    render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
        modalRef={createRef()}
        applicantTypes={["individual"]}
        organizations={[]}
        token={"a token"}
        loading={false}
      />,
    );

    const saveButton = await screen.findByTestId("application-start-save");
    const input = await screen.findByTestId("textInput");
    await userEvent.type(input, "new application");
    await userEvent.click(saveButton);

    const error = await screen.findByText("error");
    expect(error).toBeInTheDocument();
  });

  it("displays a login error if API returns 401", async () => {
    clientFetchMock.mockRejectedValue(new Error("401 error", { cause: "401" }));
    render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
        modalRef={createRef()}
        applicantTypes={["individual"]}
        organizations={[]}
        token={"a token"}
        loading={false}
      />,
    );

    const saveButton = await screen.findByTestId("application-start-save");
    const input = await screen.findByTestId("textInput");
    await userEvent.type(input, "new application");
    await userEvent.click(saveButton);

    const error = await screen.findByText("loggedOut");
    expect(error).toBeInTheDocument();
  });
  it("re-routes on successful save when an organization is selected and sends organizationId", async () => {
    clientFetchMock.mockResolvedValue({ applicationId: "999" });
    render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
        modalRef={createRef()}
        applicantTypes={["organization"]}
        organizations={[fakeUserOrganization]}
        token={"a token"}
        loading={false}
      />,
    );

    const saveButton = await screen.findByTestId("application-start-save");
    const input = await screen.findByTestId("textInput");
    const select = await screen.findByTestId("Select");
    await userEvent.type(input, "new application");
    await userEvent.selectOptions(select, fakeUserOrganization.organization_id);

    await userEvent.click(saveButton);
    expect(clientFetchMock).toHaveBeenCalledWith("/api/applications/start", {
      method: "POST",
      body: JSON.stringify({
        applicationName: "new application",
        competitionId: "1",
        organizationId: fakeUserOrganization.organization_id,
        intendsToAddOrganization: false,
      }),
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(`/applications/999`);
    });
  });
  it("renders the standard modal even when competition is org-only and user has no orgs", async () => {
    render(
      <StartApplicationModal
        competitionId="1"
        opportunityTitle="blessed opportunity"
        modalRef={createRef()}
        applicantTypes={["organization"]}
        organizations={[]}
        token={"a token"}
        loading={false}
      />,
    );

    expect(await screen.findByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByText("ineligibleTitle")).not.toBeInTheDocument();
  });
});
