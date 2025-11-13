import { TestUser } from "src/types/userTypes";

import { Select } from "@trussworks/react-uswds";

const logInTestUser = (jwt) => console.log(jwt);

export const TestUserSelect = ({ testUsers }: { testUsers: TestUser[] }) => {
  return (
    <Select
      className="maxw-card-lg margin-left-2 margin-bottom-1"
      id="test-users-select"
      name="test-users=select"
      onChange={(e) => logInTestUser(e.target.value)}
    >
      {testUsers.map((testUser) => (
        <option key={testUser.user_id} value={testUser.user_jwt}>
          {testUser.oauth_id}
        </option>
      ))}
    </Select>
  );
};
