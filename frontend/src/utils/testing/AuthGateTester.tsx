import { AuthorizedData } from "src/types/authTypes";

import { AuthorizationGate } from "src/components/user/AuthorizationGate";

export const AuthGateTester = ({
  authorizedData,
}: {
  authorizedData?: AuthorizedData;
}) => {
  return (
    <AuthorizationGate
      resourcePromises={{
        invitedUsersList: Promise.resolve("success"),
        activeUsersList: Promise.resolve("success 2"),
        organizationRolesList: Promise.reject(new Error("sorry")),
      }}
      requiredPrivileges={[
        {
          resourceId: "1",
          resourceType: "organization",
          privilege: "manage_org_members",
        },
      ]}
    >
      {Object.keys(authorizedData.fetchedResources).length && (
        <div>
          {Object.keys(authorizedData.fetchedResources).map((key) => (
            <ul>
              <li>{key}</li>
            </ul>
          ))}
        </div>
      )}
      {Object.keys(authorizedData.confirmedPrivileges).length && (
        <div>
          {Object.keys(authorizedData.confirmedPrivileges).map((key) => (
            <ul>
              <li>{key}</li>
            </ul>
          ))}
        </div>
      )}
    </AuthorizationGate>
  );
};
