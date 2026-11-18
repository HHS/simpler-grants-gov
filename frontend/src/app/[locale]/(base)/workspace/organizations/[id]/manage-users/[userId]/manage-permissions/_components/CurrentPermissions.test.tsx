import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { CurrentPermissions } from "./CurrentPermissions";

describe("CurrentPermissions", () => {
  it("shows the read-only role and what it includes", () => {
    render(<CurrentPermissions roleName="Collaborator" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "heading" }),
    ).toBeInTheDocument();
    expect(screen.getByText("roleSummary")).toBeInTheDocument();
    expect(screen.getByText("applicationsLabel")).toBeInTheDocument();
    expect(screen.getByText("formsLabel")).toBeInTheDocument();
    expect(screen.getByText("savedOpportunitiesLabel")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <CurrentPermissions roleName="Collaborator" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
