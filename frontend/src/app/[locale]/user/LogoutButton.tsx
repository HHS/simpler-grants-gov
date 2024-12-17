"use client";

/*

Delete this file when we build an actual Users page

*/
import { useRouter } from "next/navigation";
import { Button } from "@trussworks/react-uswds";

const makeLogoutRequest = async (push) => {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (response.status === 200) {
    return push("/user?message=logged out");
  }
  push("/user?message=log out error");
};

export const LogoutButton = () => {
  const router = useRouter();
  return (
    <Button type="button" onClick={() => makeLogoutRequest(router.push)}>
      Logout
    </Button>
  );
};
