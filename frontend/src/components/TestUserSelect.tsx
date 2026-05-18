import { useUser } from "src/services/auth/useUser";
import { TestUser } from "src/types/userTypes";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@trussworks/react-uswds";

// should only ever appear or be used in local / non-deployed environments
export const TestUserSelect = ({ testUsers }: { testUsers: TestUser[] }) => {
  const [loggingIn, setLoggingIn] = useState(false);
  const router = useRouter();
  const { refreshUser } = useUser();

  const logInTestUser = (jwt: string) => {
    setLoggingIn(true);
    // use plain fetch - no auth token needed for login
    fetch("/api/user/local-quick-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jwt }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Login failed: ${response.status}`);
        return refreshUser();
      })
      .then(() => {
        setLoggingIn(false);
        router.refresh();
      })
      .catch((e) => {
        setLoggingIn(false);
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
      disabled={loggingIn}
    >
      {validTestUsers.map((testUser) => (
        <option key={testUser.user_id} value={testUser.user_jwt}>
          {testUser.oauth_id}
        </option>
      ))}
    </Select>
  );
};
