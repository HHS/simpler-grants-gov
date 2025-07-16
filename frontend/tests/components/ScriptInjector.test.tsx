import { render, screen } from "@testing-library/react";

import { ClientScriptInjector } from "src/components/ScriptInjector";

const usePathnameMock = jest.fn();
const mockGate = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock() as string,
}));

jest.mock("src/utils/injectableScripts", () => ({
  injectableScriptConfig: {
    test: {
      tag: <a href="wherever">a link</a>,
      gate: () => mockGate() as unknown,
    },
  },
}));

describe("ScriptInjector", () => {
  afterEach(() => jest.resetAllMocks());
  beforeEach(() => {
    usePathnameMock.mockReturnValue("/fakepath");
  });
  it("inserts tag in config if gate function returns true", () => {
    mockGate.mockReturnValue(true);
    render(<ClientScriptInjector />);
    expect(screen.getByRole("link", { name: "a link" })).toBeInTheDocument();
  });
  it("does not insert tag in config if gate function returns false", () => {
    mockGate.mockReturnValue(false);
    render(<ClientScriptInjector />);
    expect(
      screen.queryByRole("link", { name: "a link" }),
    ).not.toBeInTheDocument();
  });
});
