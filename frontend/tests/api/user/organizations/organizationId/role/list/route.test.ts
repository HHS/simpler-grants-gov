/**
 * @jest-environment node
 */
import {
  GET,
  POST,
} from "src/app/api/user/organizations/[organizationId]/roles/list/route";

test("exports GET and POST handlers", () => {
  expect(typeof GET).toBe("function");
  expect(typeof POST).toBe("function");
});
