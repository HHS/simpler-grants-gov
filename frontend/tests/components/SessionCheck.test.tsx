import { render } from "tests/react-utils";

import { SessionCheck } from "src/components/user/SessionCheck";

const mockUseUser = jest.fn();
const mockPush = jest.fn();
const mockUseRouter = jest.fn(() => ({
  push: mockPush,
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: (): unknown => mockUseUser(),
}));

jest.mock("next/navigation", () => ({
  useRouter: (): unknown => mockUseRouter(),
}));

describe("SessionCheck", () => {
  afterEach(() => jest.clearAllMocks());
  it("does nothing until user is defined", () => {
    mockUseUser.mockReturnValue({ user: undefined });
    render(<SessionCheck />);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does nothing if user is logged in", () => {
    mockUseUser.mockReturnValue({ user: { token: "a token" } });
    render(<SessionCheck />);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to unauthenticated page if user is not logged in", () => {
    mockUseUser.mockReturnValue({ user: { token: "" } });
    render(<SessionCheck />);
    expect(mockPush).toHaveBeenCalledWith("/unauthenticated");
  });
});
