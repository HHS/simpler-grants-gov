import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginLink } from "src/components/core/LoginButton";

const mockStoreCurrentPage = jest.fn();
const mockPostUserEvent = jest.fn();

jest.mock("src/services/event/postUserEvent", () => ({
  postUserEvent: (event: unknown) => mockPostUserEvent(event) as unknown,
}));

jest.mock("src/utils/userUtils", () => ({
  storeCurrentPage: (arg: unknown) => mockStoreCurrentPage(arg) as unknown,
}));

describe("LoginLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call store location to session storage when clicking sign in", async () => {
    render(
      <LoginLink>
        <span>hi</span>
      </LoginLink>,
    );

    const signInButton = screen.getByText("hi");
    await userEvent.click(signInButton);

    expect(mockStoreCurrentPage).toHaveBeenCalled();
    expect(mockStoreCurrentPage).toHaveBeenCalledWith("/");
  });

  it("reports authentication_initiated once per click", async () => {
    render(
      <LoginLink>
        <span>hi</span>
      </LoginLink>,
    );

    expect(mockPostUserEvent).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("hi"));

    expect(mockPostUserEvent).toHaveBeenCalledTimes(1);
    expect(mockPostUserEvent).toHaveBeenCalledWith({
      name: "authentication_initiated",
      properties: { pivRequired: false },
    });
  });

  it("flags PIV required initiation", async () => {
    render(
      <LoginLink queryParameters={{ piv_required: "true" }}>
        <span>piv</span>
      </LoginLink>,
    );

    await userEvent.click(screen.getByText("piv"));

    expect(mockPostUserEvent).toHaveBeenCalledWith({
      name: "authentication_initiated",
      properties: { pivRequired: true },
    });
  });
});
