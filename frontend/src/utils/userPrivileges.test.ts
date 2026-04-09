import { ApiRequestError } from "src/errors";
import {
  checkRequiredPrivileges,
  UserPrivilegeRequest,
  UserPrivilegeResult,
} from "src/utils/userPrivileges";

// Request params and responses for checkUserPrivilege
const fakeSession = {
  token: "test-token",
  userId: "123-ABC",
};
const fakePrivilegeDef: UserPrivilegeRequest[] = [
  {
    resourceId: "123-ABC-456-DEF",
    resourceType: "agency",
    privilege: "view_opportunity",
  },
];
const fakeSuccessResponse: UserPrivilegeResult[] = [
  {
    resourceId: "123-ABC-456-DEF",
    resourceType: "agency",
    privilege: "view_opportunity",
    authorized: true,
  },
];
const fakeFailedResponse: UserPrivilegeResult[] = [
  {
    resourceId: "123-ABC-456-DEF",
    resourceType: "agency",
    privilege: "view_opportunity",
    authorized: false,
  },
];

// Responses for mockCheckUserPrivilege
const fakePrivilegeFound = {
  data: null,
  message: "Success",
  status_code: 200,
};

const mockCheckUserPrivilege = jest.fn();

jest.mock("src/services/fetch/fetchers/userFetcher", () => ({
  checkUserPrivilege: (arg: unknown): unknown => mockCheckUserPrivilege(arg),
}));

describe("checkRequiredPrivileges", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls request function with correct parameters", async () => {
    mockCheckUserPrivilege.mockResolvedValue(fakePrivilegeFound);

    const result = await checkRequiredPrivileges(
      fakeSession.token,
      fakeSession.userId,
      fakePrivilegeDef,
    );

    expect(mockCheckUserPrivilege).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeSuccessResponse);
  });

  it("calls request function; user does not have the privilege", async () => {
    mockCheckUserPrivilege.mockRejectedValue(
      new ApiRequestError("Forbidden", "APIRequestError", 403),
    );

    const result = await checkRequiredPrivileges(
      fakeSession.token,
      fakeSession.userId,
      fakePrivilegeDef,
    );

    expect(mockCheckUserPrivilege).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeFailedResponse);
  });

  it("calls request function with incorrect parameters", async () => {
    mockCheckUserPrivilege.mockRejectedValue(
      new ApiRequestError("Validation Error", "APIRequestError", 422),
    );
    const failedRspWithErrMsg = fakeFailedResponse.map((item) => ({
      ...item,
      error: "Validation Error",
    }));

    const result = await checkRequiredPrivileges(
      fakeSession.token,
      fakeSession.userId,
      fakePrivilegeDef,
    );

    expect(mockCheckUserPrivilege).toHaveBeenCalledTimes(1);
    expect(result).toEqual(failedRspWithErrMsg);
  });
});
