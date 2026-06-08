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
    const dateOne = new Date("04 Dec 1995");
    const dateTwo = new Date("04 Dec 1996");
    render(
      <FileInputExistingFiles
        existingFiles={[
          {
            id: "1",
            fileName: "file name 1",
            fileSize: 1,
            mimeType: "file",
            updatedAt: dateOne.getTime(),
          },
          {
            id: "2",
            fileName: "file name 2",
            fileSize: 2,
            mimeType: "file",
            updatedAt: dateTwo.getTime(),
          },
        ]}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("file name 1")).toBeInTheDocument();
    expect(screen.getByText("file name 2")).toBeInTheDocument();
  });
  it("displays file size and timestamp for each file present", () => {
    const dateOne = new Date("04 Dec 1995");
    const dateTwo = new Date("04 Dec 1996");
    render(
      <FileInputExistingFiles
        existingFiles={[
          {
            id: "1",
            fileName: "file name 1",
            fileSize: 1000,
            mimeType: "file",
            updatedAt: dateOne.getTime(),
          },
          {
            id: "2",
            fileName: "file name 2",
            fileSize: 2000,
            mimeType: "file",
            updatedAt: dateTwo.getTime(),
          },
        ]}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByText("1000 | savedOn 1995")).toBeInTheDocument();
    expect(screen.getByText("2000 | savedOn 1996")).toBeInTheDocument();
  });
  it("displays a delete button for each provided file", async () => {
    const dateOne = new Date("04 Dec 1995");
    const dateTwo = new Date("04 Dec 1996");
    render(
      <FileInputExistingFiles
        existingFiles={[
          {
            id: "1",
            fileName: "file name 1",
            fileSize: 1000,
            mimeType: "file",
            updatedAt: dateOne.getTime(),
          },
          {
            id: "2",
            fileName: "file name 2",
            fileSize: 2000,
            mimeType: "file",
            updatedAt: dateTwo.getTime(),
          },
        ]}
        onDelete={jest.fn()}
      />,
    );
    const deleteButtons = await screen.findAllByRole("button", {
      name: "delete",
    });
    expect(deleteButtons).toHaveLength(2);
  });
  it("calls onDelete with the id for each file on delete button click", async () => {
    const dateOne = new Date("04 Dec 1995");
    const dateTwo = new Date("04 Dec 1996");
    const onDeleteMock = jest.fn();
    render(
      <FileInputExistingFiles
        existingFiles={[
          {
            id: "1",
            fileName: "file name 1",
            fileSize: 1000,
            mimeType: "file",
            updatedAt: dateOne.getTime(),
          },
          {
            id: "2",
            fileName: "file name 2",
            fileSize: 2000,
            mimeType: "file",
            updatedAt: dateTwo.getTime(),
          },
        ]}
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
