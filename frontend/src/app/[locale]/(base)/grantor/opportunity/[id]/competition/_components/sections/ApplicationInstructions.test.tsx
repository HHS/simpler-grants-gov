import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import {
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";

import { ApplicationInstructions } from "./ApplicationInstructions";

const mockSimplerFileInput = jest.fn();

type MockSimplerFileInputProps = {
  id: string;
  disabled?: boolean;
  postUploadAction: PostUploadAction;
  onDelete: (fileId: string) => Promise<unknown>;
  existingFiles?: UploadFileMetadata[];
};

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("src/components/core/fileInput/SimplerFileInput", () => ({
  SimplerFileInput: (props: MockSimplerFileInputProps) => {
    mockSimplerFileInput(props);
    return (
      <>
        <button
          type="button"
          onClick={() => {
            void props.postUploadAction(
              "file-123",
              new AbortController().signal,
            );
          }}
        >
          {props.id}
        </button>
        <button
          type="button"
          onClick={() => {
            void props.onDelete("file-123");
          }}
        >
          delete-file
        </button>
      </>
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
        screen.getByRole("button", { name: "competition-instruction-file" }),
      ).toBeInTheDocument();
    });

    it("renders an empty pending file ID initially", () => {
      render(<ApplicationInstructions />);

      expect(screen.getByDisplayValue("")).toHaveAttribute(
        "name",
        "pending-file-id",
      );
    });

    it("updates the pending file ID after a successful upload", () => {
      render(<ApplicationInstructions />);

      fireEvent.click(
        screen.getByRole("button", { name: "competition-instruction-file" }),
      );

      expect(screen.getByDisplayValue("file-123")).toHaveAttribute(
        "name",
        "pending-file-id",
      );
    });

    it("clears the pending file ID when the file is deleted", () => {
      render(<ApplicationInstructions />);
      fireEvent.click(
        screen.getByRole("button", { name: "competition-instruction-file" }),
      );

      fireEvent.click(screen.getByRole("button", { name: "delete-file" }));

      expect(screen.getByDisplayValue("")).toHaveAttribute(
        "name",
        "pending-file-id",
      );
    });

    it("passes existing files to the upload widget", () => {
      const existingFiles: UploadFileMetadata[] = [
        {
          id: "file-123",
          fileName: "instructions.pdf",
          updatedAt: "2026-08-20T00:00:00Z",
        },
      ];

      render(<ApplicationInstructions existingFiles={existingFiles} />);

      expect(mockSimplerFileInput).toHaveBeenCalledWith(
        expect.objectContaining({ existingFiles }),
      );
    });

    it("passes the readOnly flag through to the upload widget", () => {
      render(<ApplicationInstructions readOnly />);

      expect(mockSimplerFileInput).toHaveBeenCalledWith(
        expect.objectContaining({ disabled: true }),
      );
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
