import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import { storeCurrentPage } from "src/services/sessionStorage/sessionStorage";
import { TestUser } from "src/types/userTypes";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@trussworks/react-uswds";

// should only ever appear or be used in local / non-deployed environments
export const TestUserSelect = ({ testUsers }: { testUsers: TestUser[] }) => {
  const [loggingIn, setLoggingIn] = useState(false);
  const router = useRouter();
  const { refreshUser } = useUser();
  const { clientFetch } = useClientFetch("unable to perform fake login", {
    jsonResponse: false,
  });

  const logInTestUser = (jwt: string) => {
    storeCurrentPage();
    setLoggingIn(true);
    // will redirect to /login on success
    clientFetch("/api/user/local-quick-login", {
      method: "POST",
      body: JSON.stringify({
        jwt,
      }),
    })
      .then(() => {
        return refreshUser();
      })
      .then(() => {
        setLoggingIn(false);
        router.refresh();
      })
      .catch((e) => {
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
