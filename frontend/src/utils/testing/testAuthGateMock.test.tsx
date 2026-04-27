import { render, screen } from "@testing-library/react";

import { AuthGateTester } from "./AuthGateTester";
import {
  mockAuthorizationGateFor,
  mockOnUnauthenticated,
} from "./AuthorizationGateMock";

const MockAuthorizationGate = jest.fn();
const MockUnauthorizedMessage = jest.fn(() => <span>unauthorized</span>);

jest.mock("src/components/user/AuthorizationGate", () => ({
  AuthorizationGate: (props: unknown) => {
    return MockAuthorizationGate(props) as unknown;
  },
}));

jest.mock("src/components/user/UnauthorizedMessage", () => ({
  UnauthorizedMessage: () => {
    return MockUnauthorizedMessage() as unknown;
  },
}));

describe("test the mock", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it("correctly passes resolved promises and privileges", () => {
    const gateMock = mockAuthorizationGateFor({
      authenticated: true,
      promiseResults: {
        invitedUsersList: {
          statusCode: 200,
        },
        activeUsersList: {
          statusCode: 200,
        },
        organizationRolesList: {
          statusCode: 500,
          error: "oops",
        },
      },
      privilegeResults: [
        {
          resourceId: "1",
          resourceType: "application",
          privilege: "view_application",
          authorized: true,
        },
        {
          resourceId: "2",
          resourceType: "application",
          privilege: "start_application",
          authorized: true,
          error: "oops",
        },
        {
          resourceId: "3",
          resourceType: "application",
          privilege: "submit_application",
          authorized: false,
        },
      ],
    });
    MockAuthorizationGate.mockImplementation(gateMock);
    render(<AuthGateTester />);
    expect(screen.getByText("invitedUsersList:200")).toBeInTheDocument();
    expect(screen.getByText("activeUsersList:200")).toBeInTheDocument();
    expect(screen.getByText("organizationRolesList:500")).toBeInTheDocument();
    expect(screen.getByText("view_application:true")).toBeInTheDocument();
    expect(screen.getByText("start_application:true")).toBeInTheDocument();
    expect(screen.getByText("submit_application:false")).toBeInTheDocument();
  });
  it("calls unauthenticated if unauthenticated", () => {
    const gateMock = mockAuthorizationGateFor({
      authenticated: false,
      promiseResults: {
        invitedUsersList: {
          statusCode: 200,
        },
        activeUsersList: {
          statusCode: 200,
        },
        organizationRolesList: {
          statusCode: 500,
          error: "oops",
        },
      },
      privilegeResults: [
        {
          resourceId: "1",
          resourceType: "application",
          privilege: "view_application",
          authorized: true,
        },
        {
          resourceId: "2",
          resourceType: "application",
          privilege: "start_application",
          authorized: true,
          error: "oops",
        },
        {
          resourceId: "3",
          resourceType: "application",
          privilege: "submit_application",
          authorized: false,
        },
      ],
    });
    MockAuthorizationGate.mockImplementation(gateMock);
    render(<AuthGateTester />);
    expect(mockOnUnauthenticated).toHaveBeenCalledTimes(1);
  });
  it("calls onUnauthorized if unauthorized and provided", () => {
    const gateMock = mockAuthorizationGateFor({
      promiseResults: {
        invitedUsersList: {
          statusCode: 200,
        },
        activeUsersList: {
          statusCode: 403,
        },
        organizationRolesList: {
          statusCode: 500,
          error: "oops",
        },
      },
      privilegeResults: [
        {
          resourceId: "1",
          resourceType: "application",
          privilege: "view_application",
          authorized: true,
        },
        {
          resourceId: "2",
          resourceType: "application",
          privilege: "start_application",
          authorized: true,
          error: "oops",
        },
        {
          resourceId: "3",
          resourceType: "application",
          privilege: "submit_application",
          authorized: false,
        },
      ],
    });
    MockAuthorizationGate.mockImplementation(gateMock);
    render(<AuthGateTester />);
    expect(MockUnauthorizedMessage).toHaveBeenCalledTimes(1);
  });
});
