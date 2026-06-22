import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// import { formatDateWithNoPreformattedExpectations } from "src/utils/dateUtil";

import { FileInputExistingFiles } from "./FileInputExistingFiles";

jest.mock("src/utils/fileUtils/formatFileSizeUtil", () => ({
  formatFileSize: (fileSize: number) => fileSize.toString(),
}));

jest.mock("src/utils/dateUtil", () => ({
  // for ease of testing, this will take the epoch ms, and return the year
  formatDateWithNoPreformattedExpectations: (date: Date) => {
    return date.getFullYear();
  },
}));

const generateFile = (date: Date, index: number) => ({
  id: index.toString(),
  fileName: `file name ${index}`,
  fileSize: index,
  mimeType: "file",
  updatedAt: date.toString(),
});

const testDateOne = new Date("04 Dec 1995");
const testDateTwo = new Date("04 Dec 1996");

describe("FileInputExistingFiles", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("displays nothing if no existing files are passed", () => {
    render(<FileInputExistingFiles existingFiles={[]} onDelete={jest.fn()} />);
    expect(
      screen.queryByTestId("file-input-existing-files"),
    ).not.toBeInTheDocument();
  });
  it("displays file name for each file present", () => {
    const fileOne = generateFile(testDateOne, 1);
    const fileTwo = generateFile(testDateTwo, 2);
    render(
      <FileInputExistingFiles
        existingFiles={[fileOne, fileTwo]}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("file name 1")).toBeInTheDocument();
    expect(screen.getByText("file name 2")).toBeInTheDocument();
  });
  it("displays file size and timestamp for each file present", () => {
    const fileOne = generateFile(testDateOne, 1);
    const fileTwo = generateFile(testDateTwo, 2);
    render(
      <FileInputExistingFiles
        existingFiles={[fileOne, fileTwo]}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("1 | savedOn 1995")).toBeInTheDocument();
    expect(screen.getByText("2 | savedOn 1996")).toBeInTheDocument();
  });
  it("displays a delete button for each provided file", async () => {
    const fileOne = generateFile(testDateOne, 1);
    const fileTwo = generateFile(testDateTwo, 2);
    render(
      <FileInputExistingFiles
        existingFiles={[fileOne, fileTwo]}
        onDelete={jest.fn()}
      />,
    );
    const deleteButtons = await screen.findAllByRole("button", {
      name: "delete",
    });
    expect(deleteButtons).toHaveLength(2);
  });
  it("calls onDelete with file metadata for each file on delete button click", async () => {
    const onDeleteMock = jest.fn();
    const fileOne = generateFile(testDateOne, 1);
    const fileTwo = generateFile(testDateTwo, 2);
    render(
      <FileInputExistingFiles
        existingFiles={[fileOne, fileTwo]}
        onDelete={onDeleteMock}
      />,
    );

    const deleteButtons = await screen.findAllByRole("button", {
      name: "delete",
    });
    expect(deleteButtons).toHaveLength(2);

    const firstButton = deleteButtons[0];
    const secondButton = deleteButtons[1];

    await userEvent.click(firstButton);
    expect(onDeleteMock).toHaveBeenCalledTimes(1);
    expect(onDeleteMock).toHaveBeenCalledWith({
      fileName: "file name 1",
      fileSize: 1,
      id: "1",
      mimeType: "file",
      updatedAt: testDateOne.toString(),
    });

    await userEvent.click(secondButton);
    expect(onDeleteMock).toHaveBeenCalledTimes(2);
    expect(onDeleteMock).toHaveBeenCalledWith({
      fileName: "file name 2",
      fileSize: 2,
      id: "2",
      mimeType: "file",
      updatedAt: testDateTwo.toString(),
    });
  });
});
