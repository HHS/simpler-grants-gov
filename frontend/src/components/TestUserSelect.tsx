import { useClientFetch } from "src/hooks/useClientFetch";
import { storeCurrentPage } from "src/services/sessionStorage/sessionStorage";
import { TestUser } from "src/types/userTypes";

import { Select } from "@trussworks/react-uswds";

export const TestUserSelect = ({ testUsers }: { testUsers: TestUser[] }) => {
  const { clientFetch } = useClientFetch("unable to perform fake login");

  const logInTestUser = (jwt: string) => {
    storeCurrentPage();
    // will redirect to /login on success
    clientFetch("/api/localQuickLogin", {
      method: "POST",
      body: JSON.stringify({
        jwt,
      }),
    }).catch((e) => {
      console.error("unable to log in local test user", e);
    });
  };
  const validTestUsers = testUsers.filter((testUser) => testUser.user_jwt);
  return (
    <Select
      className="maxw-card-lg margin-left-2 margin-bottom-1"
      id="test-users-select"
      name="test-users=select"
      onChange={(e) => logInTestUser(e.target.value)}
    >
      {validTestUsers.map((testUser) => (
        <option key={testUser.user_id} value={testUser.user_jwt}>
          {testUser.oauth_id}
        </option>
      ))}
    </Select>
  );
};
