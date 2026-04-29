import { ForbiddenError, ValidationError } from "src/errors";
import {
  checkRequiredPrivileges,
  UserPrivilegeRequest,
  UserPrivilegeResult,
} from "src/utils/userPrivileges";

// Request params and responses for checkUserPrivilege
const fakeSession = {
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
      fakeSession.userId,
      fakePrivilegeDef,
    );

    expect(mockCheckUserPrivilege).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeSuccessResponse);
  });

  it("calls request function; user does not have the privilege", async () => {
    mockCheckUserPrivilege.mockRejectedValue(new ForbiddenError("Forbidden"));

    const result = await checkRequiredPrivileges(
      fakeSession.userId,
      fakePrivilegeDef,
    );

    expect(mockCheckUserPrivilege).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeFailedResponse);
  });

  it("calls request function with incorrect parameters", async () => {
    mockCheckUserPrivilege.mockRejectedValue(
      new ValidationError("Validation Error"),
    );

    await expect(
      checkRequiredPrivileges(fakeSession.userId, fakePrivilegeDef),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(mockCheckUserPrivilege).toHaveBeenCalledTimes(1);
  });
});
