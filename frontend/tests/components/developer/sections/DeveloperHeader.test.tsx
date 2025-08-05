import { render, screen } from "tests/react-utils";
import DeveloperHeader from "src/components/developer/sections/DeveloperHeader";

describe("DeveloperHeader", () => {
  it("renders without crashing", () => {
    render(<DeveloperHeader />);
    expect(screen.getByText("Developer Portal")).toBeInTheDocument();
  });
}); 