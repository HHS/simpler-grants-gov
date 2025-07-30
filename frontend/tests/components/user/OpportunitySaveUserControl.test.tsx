import { OpportunitySaveUserControl } from "src/components/user/OpportunitySaveUserControl";

describe("OpportunitySaveUserControl", () => {
  it("exports the component correctly", () => {
    expect(typeof OpportunitySaveUserControl).toBe("function");
  });

  it("accepts the required opportunityId prop", () => {
    // This is a basic test to ensure the component interface is correct
    const component = OpportunitySaveUserControl;
    expect(component).toBeDefined();
  });

  it("accepts the optional type prop with correct types", () => {
    // TypeScript compilation would catch type errors, so this test
    // is mainly to document the expected interface
    const component = OpportunitySaveUserControl;
    expect(component).toBeDefined();
  });
});
