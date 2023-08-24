import { render, screen, waitFor } from "@testing-library/react";

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
    expect(document.title).toBe("test title");
  });

  it("Renders meta description content without errors", () => {
    const props = { title: "test title", description: "test description" };
    render(<PageSEO {...props} />);
    const description = document.querySelector(
      "meta[name='description']"
    ) as HTMLTemplateElement;
    expect(description.content).toBe("test description");
  });

  it("Renders the correct title after rerendering", async () => {
    const initialProps = {
      title: "test title",
      description: "test description",
    };
    const updatedProps = {
      title: "updated test title",
      description: "updated test description",
    };
    const { rerender } = render(<PageSEO {...initialProps} />);
    expect(document.title).toBe("test title");
    rerender(<PageSEO {...updatedProps} />);
    expect(document.title).toBe("updated test title");
  });
});
