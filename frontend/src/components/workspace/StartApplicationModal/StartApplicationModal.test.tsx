import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeUserOrganization } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { createRef } from "react";

import { StartApplicationModal } from "src/components/workspace/StartApplicationModal/StartApplicationModal";

// ---- Mocks ----
const mockRouterPush = jest.fn<Promise<boolean>, [string]>();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

type ClientFetch = (url: string, options?: RequestInit) => Promise<unknown>;

const clientFetchMock: jest.MockedFunction<ClientFetch> = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: clientFetchMock,
  }),
}));

function renderModal(
  overrides?: Partial<React.ComponentProps<typeof StartApplicationModal>>,
) {
  return render(
    <StartApplicationModal
      competitionId="1"
      opportunityTitle="blessed opportunity"
      modalRef={createRef()}
      applicantTypes={["individual"]}
      organizations={[]}
      token="a token"
      loading={false}
      {...overrides}
    />,
  );
}

describe("StartApplicationModal", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockRouterPush.mockResolvedValue(true);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    (console.error as unknown as jest.Mock).mockRestore?.();
  });

  it("renders key content (opportunity title + save button)", () => {
    renderModal();

    expect(screen.getByTestId("opportunity-title")).toHaveTextContent(
      "applyingFor",
    );
    expect(screen.getByTestId("application-start-save")).toBeInTheDocument();
  });

  it("shows name validation error when Save clicked without a name", async () => {
    const user = userEvent.setup();
    renderModal({ applicantTypes: ["individual"] });

    expect(
      screen.queryByText("fields.name.validationError"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId("application-start-save"));

    expect(
      await screen.findByText("fields.name.validationError"),
    ).toBeInTheDocument();

    // should not call API when invalid
    expect(clientFetchMock).not.toHaveBeenCalled();
  });

  it("shows organization validation error when competition requires org and none selected", async () => {
    const user = userEvent.setup();

    renderModal({
      applicantTypes: ["organization"],
      organizations: [fakeUserOrganization],
    });

    expect(
      screen.queryByText("fields.organizationSelect.validationError"),
    ).not.toBeInTheDocument();

    // name is also required, but we can satisfy name so we isolate the org validation
    await user.type(screen.getByTestId("textInput"), "new application");

    await user.click(screen.getByTestId("application-start-save"));

    expect(
      await screen.findByText("fields.organizationSelect.validationError"),
    ).toBeInTheDocument();

    expect(clientFetchMock).not.toHaveBeenCalled();
  });

  it("shows generic API error when request fails (non-401)", async () => {
    const user = userEvent.setup();
    clientFetchMock.mockRejectedValue(new Error("nope"));

    renderModal({ applicantTypes: ["individual"] });

    await user.type(screen.getByTestId("textInput"), "new application");
    await user.click(screen.getByTestId("application-start-save"));

    expect(await screen.findByText("error")).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("shows logged-out error when request fails with cause=401", async () => {
    const user = userEvent.setup();
    clientFetchMock.mockRejectedValue(new Error("401 error", { cause: "401" }));

    renderModal({ applicantTypes: ["individual"] });

    await user.type(screen.getByTestId("textInput"), "new application");
    await user.click(screen.getByTestId("application-start-save"));

    expect(await screen.findByText("loggedOut")).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("submits expected payload and routes on success", async () => {
    const user = userEvent.setup();
    clientFetchMock.mockResolvedValue({ applicationId: "999" });

    renderModal({
      applicantTypes: ["organization"],
      organizations: [fakeUserOrganization],
      competitionId: "1",
    });

    await user.type(screen.getByTestId("textInput"), "new application");
    await user.selectOptions(
      screen.getByTestId("Select"),
      fakeUserOrganization.organization_id,
    );

    await user.click(screen.getByTestId("application-start-save"));

    await waitFor(() => {
      expect(clientFetchMock).toHaveBeenCalledTimes(1);
    });

    expect(clientFetchMock).toHaveBeenCalledWith(
      "/api/applications/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          applicationName: "new application",
          competitionId: "1",
          organization: fakeUserOrganization.organization_id,
        }),
      }),
    );

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/workspace/applications/application/999",
      );
    });
  });

  it("renders the ineligible view when org-only and user has no organizations", () => {
    renderModal({
      applicantTypes: ["organization"],
      organizations: [],
    });

    // ineligible component should replace the normal form inputs
    expect(screen.queryByTestId("textInput")).not.toBeInTheDocument();
    expect(screen.getByText("ineligibleTitle")).toBeInTheDocument();
  });
});
