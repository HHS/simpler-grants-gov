import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { ApplicationInstructions } from "./ApplicationInstructions";

const mockSimplerFileInput = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("src/components/core/fileInput/SimplerFileInput", () => ({
  SimplerFileInput: (props: any) => {
    mockSimplerFileInput(props);
    return (
      <button type="button" onClick={() => props.postUploadAction("file-123")}>
        {props.id}
      </button>
    );
  },
}));

describe("ApplicationInstructions", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the section header and subheader", () => {
      render(<ApplicationInstructions />);

      expect(
        screen.getByRole("heading", { name: "header" }),
      ).toBeInTheDocument();
      expect(screen.getByText("subHeader")).toBeInTheDocument();
    });

    it("renders the upload label and widget", () => {
      render(<ApplicationInstructions />);

      expect(screen.getByText("uploadAFile")).toBeInTheDocument();
      expect(screen.getByText("multipleFiles")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "simpler-file-upload" }),
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("passes accessibility scan when rendered", async () => {
      const { container } = render(<ApplicationInstructions />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
