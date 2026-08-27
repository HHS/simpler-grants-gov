import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { SubmissionWindow } from "./SubmissionWindow";

describe("SubmissionWindow", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the section header and subheader", () => {
      render(<SubmissionWindow />);

      expect(
        screen.getByRole("heading", { name: "header" }),
      ).toBeInTheDocument();
      expect(screen.getByText("subHeader")).toBeInTheDocument();
    });

    it("renders Open date field with correct label and help text", () => {
      render(<SubmissionWindow />);

      expect(screen.getByText("submissionsOpen")).toBeInTheDocument();
      expect(screen.getByText("submissionsOpenHint")).toBeInTheDocument();
    });

    it("renders Public close date field with correct label and help text", () => {
      render(<SubmissionWindow />);

      expect(screen.getByText("submissionsClose")).toBeInTheDocument();
      expect(screen.getByText("submissionsCloseHint")).toBeInTheDocument();
    });

    it("renders Extension period field with correct label and help text", () => {
      render(<SubmissionWindow />);

      expect(screen.getByText("extensionPeriod")).toBeInTheDocument();
      expect(screen.getByText("extensionPeriodHint")).toBeInTheDocument();
    });

    it("renders Public close date as required", () => {
      render(<SubmissionWindow />);

      const requiredIndicator = screen.getByText("*");
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass("usa-hint--required");
    });

    it("does not render expected number of applicants field", () => {
      render(<SubmissionWindow />);

      expect(
        screen.queryByText(/how many applications/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/expected number of applicants/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Extension period field validation", () => {
    it("renders Extension period as a number input", () => {
      render(<SubmissionWindow />);

      const extensionInput = screen.getByRole("spinbutton", {
        name: /extensionperiod/i,
      });
      expect(extensionInput).toBeInTheDocument();
      expect(extensionInput).toHaveAttribute("type", "number");
    });

    it("has minimum value of 0", () => {
      render(<SubmissionWindow />);

      const extensionInput = screen.getByRole("spinbutton", {
        name: /extensionperiod/i,
      });
      expect(extensionInput).toHaveAttribute("min", "0");
    });

    it("has step of 1 for whole numbers", () => {
      render(<SubmissionWindow />);

      const extensionInput = screen.getByRole("spinbutton", {
        name: /extensionperiod/i,
      });
      expect(extensionInput).toHaveAttribute("step", "1");
    });

    it("prevents decimal point input via keyboard", () => {
      render(<SubmissionWindow />);

      const extensionInput = screen.getByRole("spinbutton", {
        name: /extensionperiod/i,
      });

      const event = fireEvent.keyDown(extensionInput, {
        key: ".",
        code: "Period",
      });

      // fireEvent returns false if preventDefault() was called
      expect(event).toBe(false);
    });

    it("prevents comma input via keyboard", () => {
      render(<SubmissionWindow />);

      const extensionInput = screen.getByRole("spinbutton", {
        name: /extensionperiod/i,
      });

      const event = fireEvent.keyDown(extensionInput, {
        key: ",",
        code: "Comma",
      });

      expect(event).toBe(false);
    });

    it("prevents scientific notation (e) input via keyboard", () => {
      render(<SubmissionWindow />);

      const extensionInput = screen.getByRole("spinbutton", {
        name: /extensionperiod/i,
      });

      const eventLowerE = fireEvent.keyDown(extensionInput, {
        key: "e",
        code: "KeyE",
      });
      const eventUpperE = fireEvent.keyDown(extensionInput, {
        key: "E",
        code: "KeyE",
      });

      expect(eventLowerE).toBe(false);
      expect(eventUpperE).toBe(false);
    });

    it("allows numeric input via keyboard", () => {
      render(<SubmissionWindow />);

      const extensionInput = screen.getByRole("spinbutton", {
        name: /extensionperiod/i,
      });

      const event = fireEvent.keyDown(extensionInput, {
        key: "5",
        code: "Digit5",
      });

      expect(event).toBe(true);
    });

    it("prevents pasting decimal values", () => {
      render(<SubmissionWindow />);

      const extensionInput = screen.getByRole("spinbutton", {
        name: /extensionperiod/i,
      });

      const pasteEvent = fireEvent.paste(extensionInput, {
        clipboardData: {
          getData: () => "4.5",
        },
      });

      // fireEvent returns false if preventDefault() was called
      expect(pasteEvent).toBe(false);
    });

    it("prevents pasting values with commas", () => {
      render(<SubmissionWindow />);

      const extensionInput = screen.getByRole("spinbutton", {
        name: /extensionperiod/i,
      });

      const pasteEvent = fireEvent.paste(extensionInput, {
        clipboardData: {
          getData: () => "1,000",
        },
      });

      expect(pasteEvent).toBe(false);
    });

    it("allows pasting whole number values", () => {
      render(<SubmissionWindow />);

      const extensionInput = screen.getByRole("spinbutton", {
        name: /extensionperiod/i,
      });

      const pasteEvent = fireEvent.paste(extensionInput, {
        clipboardData: {
          getData: () => "10",
        },
      });

      // fireEvent returns true if preventDefault() was NOT called
      expect(pasteEvent).toBe(true);
    });
  });

  describe("date fields", () => {
    it("renders opening_date DatePicker with correct id", () => {
      render(<SubmissionWindow />);

      const openingDateInput = screen.getAllByTestId(
        "date-picker-external-input",
      )[0];
      expect(openingDateInput).toHaveAttribute("id", "opening_date");
    });

    it("renders closing_date DatePicker with correct id", () => {
      render(<SubmissionWindow />);

      const closingDateInput = screen.getAllByTestId(
        "date-picker-external-input",
      )[1];
      expect(closingDateInput).toHaveAttribute("id", "closing_date");
    });

    it("renders both date pickers with correct placeholder", () => {
      render(<SubmissionWindow />);

      const dateInputs = screen.getAllByPlaceholderText("mm/dd/yyyy");
      expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("accessibility", () => {
    it("passes accessibility scan when rendered", async () => {
      const { container } = render(<SubmissionWindow />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
