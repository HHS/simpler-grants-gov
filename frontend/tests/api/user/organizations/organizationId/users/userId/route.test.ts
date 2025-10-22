/**
 * @jest-environment node
 */

import { PUT } from "src/app/api/user/organizations/[organizationId]/users/[userId]/route";

test("exports PUT handler", () => {
  expect(typeof PUT).toBe("function");
});
