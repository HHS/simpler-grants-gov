import { render, screen } from "@testing-library/react";

import PageSEO from "src/components/PageSEO";

jest.mock("next/head", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: Array<React.ReactElement> }) => {
      return <>{children}</>;
    },
  };
});

describe("PageSEO", () => {
  it("Renders title without errors", () => {
    const props = { title: "test title", description: "test description" };
    render(<PageSEO {...props} />);
    const title = screen.getByText("test title");
    expect(title).toBeInTheDocument();
  });

  it("Renders meta description content without errors", () => {
    const props = { title: "test title", description: "test description" };
    render(<PageSEO {...props} />);
    const description = screen.getByTestId("meta-description");
    expect(description).toBeInTheDocument();
  });

  it("Renders the correct title after rerendering", () => {
    const initialProps = {
      title: "test title",
      description: "test description",
    };
    const updatedProps = {
      title: "updated test title",
      description: "updated test description",
    };
    const { rerender } = render(<PageSEO {...initialProps} />);
    const title = screen.getByText("test title");
    expect(title).toBeInTheDocument();
    rerender(<PageSEO {...updatedProps} />);
    const oldTitle = screen.queryByText("test title");
    const updatedtitle = screen.getByText("updated test title");
    expect(oldTitle).not.toBeInTheDocument();
    expect(updatedtitle).toBeInTheDocument();
  });
});
