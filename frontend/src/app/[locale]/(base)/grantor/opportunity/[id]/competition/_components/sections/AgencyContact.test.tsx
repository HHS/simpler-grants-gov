import { fireEvent, render, screen } from "@testing-library/react";
import { AgencyContact } from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/sections/AgencyContact";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

describe("AgencyContact", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("rendering", () => {
    it("renders the section header and subheader", () => {
      render(<AgencyContact />);

      expect(
        screen.getByRole("heading", { name: "header" }),
      ).toBeInTheDocument();
      expect(screen.getByText("subHeader")).toBeInTheDocument();
    });

    it("renders all form fields with correct labels", () => {
      render(<AgencyContact />);

      expect(screen.getByText("fullName")).toBeInTheDocument();
      expect(screen.getByText("personTitle")).toBeInTheDocument();
      expect(screen.getByText("emailAddress")).toBeInTheDocument();
      expect(screen.getByText("phoneNumber")).toBeInTheDocument();
    });

    it("disables all form fields when readOnly is true", () => {
      render(<AgencyContact readOnly />);

      expect(screen.getByRole("textbox", { name: /fullname/i })).toBeDisabled();
      expect(
        screen.getByRole("textbox", { name: /persontitle/i }),
      ).toBeDisabled();
      expect(
        screen.getByRole("textbox", { name: /emailaddress/i }),
      ).toBeDisabled();
      expect(
        screen.getByRole("textbox", { name: /phonenumber/i }),
      ).toBeDisabled();
    });

    it("populates form fields from contactInfo", () => {
      render(
        <AgencyContact contactInfo="John Doe | Manager | john@example.com | 555-0100" />,
      );

      expect(screen.getByRole("textbox", { name: /fullname/i })).toHaveValue(
        "John Doe",
      );
      expect(screen.getByRole("textbox", { name: /persontitle/i })).toHaveValue(
        "Manager",
      );
      expect(
        screen.getByRole("textbox", { name: /emailaddress/i }),
      ).toHaveValue("john@example.com");
      expect(screen.getByRole("textbox", { name: /phonenumber/i })).toHaveValue(
        "555-0100",
      );
    });

    it("leaves the optional title empty when contactInfo has three values", () => {
      render(
        <AgencyContact contactInfo="John Doe | john@example.com | 555-0100" />,
      );

      expect(screen.getByRole("textbox", { name: /fullname/i })).toHaveValue(
        "John Doe",
      );
      expect(screen.getByRole("textbox", { name: /persontitle/i })).toHaveValue(
        "",
      );
      expect(
        screen.getByRole("textbox", { name: /emailaddress/i }),
      ).toHaveValue("john@example.com");
      expect(screen.getByRole("textbox", { name: /phonenumber/i })).toHaveValue(
        "555-0100",
      );
    });
  });

  describe("email validation", () => {
    it("shows required error when email field is blurred empty", () => {
      render(<AgencyContact />);

      const emailInput = screen.getByRole("textbox", { name: /emailaddress/i });
      fireEvent.blur(emailInput);

      expect(screen.getByText("error.requiredEmail")).toBeInTheDocument();
    });

    it("shows format error when email field is blurred with invalid email", () => {
      render(<AgencyContact />);

      const emailInput = screen.getByRole("textbox", { name: /emailaddress/i });
      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.blur(emailInput);

      expect(screen.getByText("error.invalidEmail")).toBeInTheDocument();
    });

    it("clears the error when user starts typing after an error", () => {
      render(<AgencyContact />);

      const emailInput = screen.getByRole("textbox", { name: /emailaddress/i });

      // Trigger an error
      fireEvent.blur(emailInput);
      expect(screen.getByText("error.requiredEmail")).toBeInTheDocument();

      // Type a character to clear the error
      fireEvent.change(emailInput, { target: { value: "a" } });
      expect(screen.queryByText("error.requiredEmail")).not.toBeInTheDocument();
    });

    it("clears error on blur when a valid email is entered", () => {
      render(<AgencyContact />);

      const emailInput = screen.getByRole("textbox", { name: /emailaddress/i });

      // Trigger an error
      fireEvent.blur(emailInput);
      expect(screen.getByText("error.requiredEmail")).toBeInTheDocument();

      // Enter a valid email and blur
      fireEvent.change(emailInput, {
        target: { value: "test@example.com" },
      });
      fireEvent.blur(emailInput);
      expect(screen.queryByText("error.requiredEmail")).not.toBeInTheDocument();
      expect(screen.queryByText("error.invalidEmail")).not.toBeInTheDocument();
    });

    it("accepts a period in the email local part", () => {
      render(<AgencyContact />);

      const emailInput = screen.getByRole("textbox", { name: /emailaddress/i });
      fireEvent.change(emailInput, { target: { value: "john.doe@gmail.com" } });
      fireEvent.blur(emailInput);

      expect(screen.queryByText("error.requiredEmail")).not.toBeInTheDocument();
      expect(screen.queryByText("error.invalidEmail")).not.toBeInTheDocument();
    });

    it("rejects invalid period placement in the email local part", () => {
      render(<AgencyContact />);

      const emailInput = screen.getByRole("textbox", { name: /emailaddress/i });
      fireEvent.change(emailInput, {
        target: { value: "john..doe@gmail.com" },
      });
      fireEvent.blur(emailInput);

      expect(screen.getByText("error.invalidEmail")).toBeInTheDocument();
    });
  });

  describe("pipe character keydown handling", () => {
    it.each([
      ["full name", /fullname/i],
      ["title", /persontitle/i],
      ["email", /emailaddress/i],
    ])("prevents the pipe character in the %s field", (_, label) => {
      render(<AgencyContact />);

      const input = screen.getByRole("textbox", { name: label });

      expect(fireEvent.keyDown(input, { key: "|" })).toBe(false);
    });

    it("allows regular character key presses", () => {
      render(<AgencyContact />);

      const nameInput = screen.getByRole("textbox", { name: /fullname/i });

      expect(fireEvent.keyDown(nameInput, { key: "A" })).toBe(true);
    });
  });

  describe("phone number formatting", () => {
    it("formats phone number as (XXX) XXX-XXXX when user types 10 digits", () => {
      render(<AgencyContact />);

      const phoneInput = screen.getByRole("textbox", { name: /phonenumber/i });
      fireEvent.change(phoneInput, { target: { value: "1234567890" } });

      expect(phoneInput).toHaveValue("(123) 456-7890");
    });

    it("formats partial phone numbers progressively", () => {
      render(<AgencyContact />);

      const phoneInput = screen.getByRole("textbox", { name: /phonenumber/i });

      fireEvent.change(phoneInput, { target: { value: "123" } });
      expect(phoneInput).toHaveValue("(123");

      fireEvent.change(phoneInput, { target: { value: "1234" } });
      expect(phoneInput).toHaveValue("(123) 4");

      fireEvent.change(phoneInput, { target: { value: "123456" } });
      expect(phoneInput).toHaveValue("(123) 456");
    });
  });

  describe("phone number keydown handling", () => {
    it("prevents non-numeric key presses", () => {
      render(<AgencyContact />);

      const phoneInput = screen.getByRole("textbox", { name: /phonenumber/i });

      // Type a number first to set a value
      fireEvent.change(phoneInput, { target: { value: "123" } });
      expect(phoneInput).toHaveValue("(123");

      // Press a non-numeric key - the handler should prevent it
      // We verify by checking the value remains unchanged
      fireEvent.keyDown(phoneInput, { key: "a" });
      expect(phoneInput).toHaveValue("(123");
    });

    it("does not allow alpha key presses", () => {
      render(<AgencyContact />);

      const phoneInput = screen.getByRole("textbox", { name: /phonenumber/i });

      const event = fireEvent.keyDown(phoneInput, { key: "a", code: "KeyA" });

      // fireEvent returns false if preventDefault() was called
      expect(event).toBe(false);
    });

    it("allows numeric key presses", () => {
      render(<AgencyContact />);

      const phoneInput = screen.getByRole("textbox", { name: /phonenumber/i });

      const event = fireEvent.keyDown(phoneInput, { key: "5", code: "Digit5" });

      // fireEvent returns true if preventDefault() was NOT called
      expect(event).toBe(true);
    });

    it("allows navigation and control keys to be pressed", () => {
      render(<AgencyContact />);

      const phoneInput = screen.getByRole("textbox", { name: /phonenumber/i });

      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
        "Home",
        "End",
      ];

      allowedKeys.forEach((akey) => {
        const event = fireEvent.keyDown(phoneInput, { key: akey });
        // fireEvent returns true if preventDefault() was NOT called
        expect(event).toBe(true);
      });
    });
  });
});
