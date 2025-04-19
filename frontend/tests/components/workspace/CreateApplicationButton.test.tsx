import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CreateApplicatinButton from "src/components/workspace/CreateApplicationButton";

const routerPush = jest.fn(() => Promise.resolve(true));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/test") as jest.Mock<string>,
  useRouter: () => ({
    push: routerPush,
  }),
}));

const mockStartApplication = jest.fn((_token) => Promise.resolve(true));

jest.mock("src/services/fetch/fetchers/clientApplicationFetcher", () => ({
  startApplication: (token: string) => mockStartApplication(token),
}));

describe("CreateApplicatinButton", () => {
  afterEach(() => {
    mockStartApplication.mockReset();
  });

  it("button click fires startApplication", async () => {
    const user = userEvent.setup();
    render(<CreateApplicatinButton />);

    const appButton = await screen.findByText("Create new application");
    await user.click(appButton);
    expect(mockStartApplication).toHaveBeenCalled();
  });
});
