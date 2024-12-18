"use client";

/*

Delete this file when we build an actual Users page

*/
import { useRouter } from "next/navigation";
import { Button } from "@trussworks/react-uswds";

const makeLogoutRequest = async (push: (location: string) => void) => {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (response.status === 200) {
    push("/user?message=logged out");
    return;
  }
  push("/user?message=log out error");
};

export const LogoutButton = () => {
  const router = useRouter();
  return (
    // eslint-disable-next-line
    <Button type="button" onClick={() => makeLogoutRequest(router.push)}>
      Logout
    </Button>
  );
};
