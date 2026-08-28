import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import {
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";

import { ApplicationInstructions } from "./ApplicationInstructions";

const mockSimplerFileInput = jest.fn();
const mockDeleteCompetitionInstructionAction = jest.fn<
  Promise<unknown>,
  [string, string, string]
>();

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/actions",
  () => ({
    deleteCompetitionInstructionAction: (
      opportunityId: string,
      competitionId: string,
      instructionId: string,
    ): Promise<unknown> =>
      mockDeleteCompetitionInstructionAction(
        opportunityId,
        competitionId,
        instructionId,
      ),
  }),
);

const applicationInstructionsProps = {
  opportunityId: "opp-123",
  competitionId: "competition-123",
};

type MockSimplerFileInputProps = {
  id: string;
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
            void props.onDelete(props.existingFiles?.[0]?.id ?? "file-123");
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
      render(<ApplicationInstructions {...applicationInstructionsProps} />);

      expect(
        screen.getByRole("heading", { name: "header" }),
      ).toBeInTheDocument();
      expect(screen.getByText("subHeader")).toBeInTheDocument();
    });

    it("renders the upload label and widget", () => {
      render(<ApplicationInstructions {...applicationInstructionsProps} />);

      expect(screen.getByText("uploadAFile")).toBeInTheDocument();
      expect(screen.getByText("multipleFiles")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "competition-instruction-file" }),
      ).toBeInTheDocument();
    });

    it("renders an empty pending file ID initially", () => {
      render(<ApplicationInstructions {...applicationInstructionsProps} />);

      expect(screen.getByDisplayValue("")).toHaveAttribute(
        "name",
        "pending-file-id",
      );
    });

    it("updates the pending file ID after a successful upload", () => {
      render(<ApplicationInstructions {...applicationInstructionsProps} />);

      fireEvent.click(
        screen.getByRole("button", { name: "competition-instruction-file" }),
      );

      expect(screen.getByDisplayValue("file-123")).toHaveAttribute(
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

      render(
        <ApplicationInstructions
          {...applicationInstructionsProps}
          existingFiles={existingFiles}
        />,
      );

      expect(mockSimplerFileInput).toHaveBeenCalledWith(
        expect.objectContaining({ existingFiles }),
      );
    });

    it("deletes the first existing file", async () => {
      const existingFiles: UploadFileMetadata[] = [
        {
          id: "instruction-123",
          fileName: "instructions.pdf",
          updatedAt: "2026-08-20T00:00:00Z",
        },
      ];
      mockDeleteCompetitionInstructionAction.mockResolvedValue({});

      render(
        <ApplicationInstructions
          {...applicationInstructionsProps}
          existingFiles={existingFiles}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "delete-file" }));

      expect(mockDeleteCompetitionInstructionAction).toHaveBeenCalledWith(
        "opp-123",
        "competition-123",
        "instruction-123",
      );
      await waitFor(() => {
        expect(mockSimplerFileInput).toHaveBeenLastCalledWith(
          expect.objectContaining({ existingFiles: [] }),
        );
      });
    });

    it("does not delete a file when existingFiles is empty", () => {
      render(
        <ApplicationInstructions
          {...applicationInstructionsProps}
          existingFiles={[]}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "delete-file" }));

      expect(mockDeleteCompetitionInstructionAction).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("passes accessibility scan when rendered", async () => {
      const { container } = render(
        <ApplicationInstructions {...applicationInstructionsProps} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
