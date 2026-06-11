import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FileInputExistingFiles } from "./FileInputExistingFiles";

jest.mock("src/utils/fileUtils/formatFileSizeUtil", () => ({
  formatFileSize: (fileSize: number) => fileSize.toString(),
}));

jest.mock("src/utils/dateUtil", () => ({
  // for ease of testing, this will take the epoch ms, and return the year
  formatDate: (dateMs: number | string) => {
    return new Date(Number(dateMs)).getFullYear();
  },
}));

const generateFile = (date: Date, index: number) => ({
  id: index.toString(),
  fileName: `file name ${index}`,
  fileSize: index,
  mimeType: "file",
  updatedAt: date.getTime(),
});

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
    const fileOne = generateFile(new Date("04 Dec 1995"), 1);
    const fileTwo = generateFile(new Date("04 Dec 1996"), 2);
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
    const fileOne = generateFile(new Date("04 Dec 1995"), 1);
    const fileTwo = generateFile(new Date("04 Dec 1996"), 2);
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
    const fileOne = generateFile(new Date("04 Dec 1995"), 1);
    const fileTwo = generateFile(new Date("04 Dec 1996"), 2);
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
  it("calls onDelete with the id for each file on delete button click", async () => {
    const onDeleteMock = jest.fn();
    const fileOne = generateFile(new Date("04 Dec 1995"), 1);
    const fileTwo = generateFile(new Date("04 Dec 1996"), 2);
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
    expect(onDeleteMock).toHaveBeenCalledWith("1");

    await userEvent.click(secondButton);
    expect(onDeleteMock).toHaveBeenCalledTimes(2);
    expect(onDeleteMock).toHaveBeenCalledWith("2");
  });
});
